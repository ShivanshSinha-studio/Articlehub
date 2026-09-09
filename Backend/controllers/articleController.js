const Article= require('../Model/ArticleSchema');
const AuditLog=require('../Model/AuditLogSchema');

const parseBoolean = (value) => value === true || value === 'true';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const normalizeImageArray = (article) => {
  if (!article) return article;
  if (typeof article.featuredImage === 'string') {
    article.featuredImage = [article.featuredImage];
  }
  return article;
};

const getWritableStatus = (req) => {
  const isAdmin=req.user.role === 'admin';
  const requestedStatus=req.body.status;

  if (requestedStatus === 'draft') return 'draft';
  if (isAdmin && requestedStatus === 'pending_review') return 'pending_review';
  return 'published';
};

const makeArticlePayload = (req, existingArticle) => {
  const isAdmin=req.user.role === 'admin';
  const status=getWritableStatus(req);
  const existingImages = Array.isArray(existingArticle?.featuredImage)
    ? existingArticle.featuredImage
    : existingArticle?.featuredImage
      ? [existingArticle.featuredImage]
      : [];
  const featuredImage = req.body.images?.length ? req.body.images : existingImages;
  const existingFeatured = existingArticle ? Boolean(existingArticle.isFeatured) : false;
  const existingBreaking = existingArticle ? Boolean(existingArticle.isBreaking) : false;

  return {
    title:req.body.title,
    slug:req.body.slug,
    excerpt:req.body.excerpt,
    content:req.body.content,
    category:req.body.category,
    tags:Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : [],
    status,
    isFeatured: isAdmin && hasOwn(req.body, 'isFeatured') ? parseBoolean(req.body.isFeatured) : existingFeatured,
    isBreaking: isAdmin && hasOwn(req.body, 'isBreaking') ? parseBoolean(req.body.isBreaking) : existingBreaking,
    featuredImage
  };
};

const getAllArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = '-publishedAt'
    } = req.query;
    
    const query = {status:'published'};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    const articles = await Article.find(query)
      .populate('author', 'name profilePicture')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Article.countDocuments(query);
    
    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getArticle = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, status:'published' })
  .populate({
    path: 'author',
    select: 'name profilePicture bio'
  });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Increment view count
    article.views += 1;
    await article.save();
    
    res.status(200).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createArticle = async (req, res) => {
  try {
    const status=getWritableStatus(req);
    const now=new Date();
    const payload=makeArticlePayload(req);

    const article = await Article.create({
      ...payload,
      author: req.user._id,
      status,
      submittedAt: status === 'pending_review' ? now : undefined,
      publishedAt: status === 'published' ? now : undefined,
      reviewedAt: status === 'published' ? now : undefined,
      reviewedBy: status === 'published' ? req.user._id : undefined,
      reviewNote: ''
    });
    
    res.status(201).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPrivateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name email profilePicture');
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const isOwner = article.author._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can view only your own article" });
    }

    res.status(200).json({
      success:true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = normalizeImageArray(await Article.findById(req.params.id));
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const isOwner = article.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can edit only your own article" });
    }

    const payload=makeArticlePayload(req, article);
    Object.assign(article, payload);
    article.submittedAt = payload.status === 'pending_review' ? new Date() : article.submittedAt;
    article.publishedAt = payload.status === 'published' ? (article.publishedAt || new Date()) : article.publishedAt;
    article.reviewedAt = payload.status === 'published' ? new Date() : undefined;
    article.reviewedBy = payload.status === 'published' ? req.user._id : undefined;
    article.reviewNote = '';
    article.updatedAt = new Date();

    await article.save();

    res.status(200).json({
      success:true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};

const getFeaturedArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isFeatured: true, status:'published' })
      .populate('author', 'name profilePicture')
      .sort('-publishedAt')
      .limit(5);
    
    res.status(200).json({
      success: true,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBreakingNews = async (req, res) => {
  try {
    const articles = await Article.find({ isBreaking: true, status:'published' })
      .populate('author', 'name')
      .sort('-publishedAt')
      .limit(3);
    
    res.status(200).json({
      success: true,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .sort('-publishedAt')
      .populate('author', 'name profilePicture');

    res.status(200).json({
      success: true,
      count: articles.length,
      articles
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getReviewArticles = async (req, res) => {
  try {
    const page=Math.max(Number(req.query.page) || 1, 1);
    const limit=Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const articles = await Article.find({ status: 'pending_review' })
      .sort('-submittedAt')
      .populate('author', 'name email profilePicture')
      .skip((page - 1) * limit)
      .limit(limit);
    const total=await Article.countDocuments({ status: 'pending_review' });

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const reviewArticle = async (req, res) => {
  try {
    const { status, reviewNote, isFeatured, isBreaking } = req.body;

    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be published or rejected" });
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    article.status = status;
    article.reviewNote = reviewNote || '';
    article.reviewedAt = new Date();
    article.reviewedBy = req.user._id;
    article.updatedAt = new Date();

    if (status === 'published') {
      article.publishedAt = article.publishedAt || new Date();
      article.isFeatured = !!isFeatured;
      article.isBreaking = !!isBreaking;
    } else {
      article.isFeatured = false;
      article.isBreaking = false;
    }

    await article.save();
    await AuditLog.create({
      actor:req.user._id,
      action:'article_reviewed',
      targetType:'article',
      target:article._id,
      status,
      note:reviewNote || '',
      metadata:{title:article.title}
    });

    res.status(200).json({
      success: true,
      message: `Article ${status}`,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const page=Math.max(Number(req.query.page) || 1, 1);
    const limit=Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const logs=await AuditLog.find({})
      .sort('-createdAt')
      .populate('actor', 'name email role')
      .skip((page - 1) * limit)
      .limit(limit);
    const total=await AuditLog.countDocuments({});

    res.status(200).json({
      success:true,
      total,
      pages:Math.ceil(total / limit),
      currentPage:page,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};

const submitArticleForReview = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const isOwner = article.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can submit only your own article" });
    }

    if (!['draft', 'rejected', 'pending_review'].includes(article.status)) {
      return res.status(400).json({ message: "Only unpublished articles can be submitted" });
    }

    article.status = req.user.role === 'admin' && req.body.status === 'pending_review' ? 'pending_review' : 'published';
    article.submittedAt = new Date();
    article.publishedAt = article.status === 'published' ? (article.publishedAt || new Date()) : article.publishedAt;
    article.reviewedAt = article.status === 'published' ? new Date() : article.reviewedAt;
    article.reviewedBy = article.status === 'published' ? req.user._id : article.reviewedBy;
    article.reviewNote = '';
    article.updatedAt = new Date();
    await article.save();

    res.status(200).json({
      success: true,
      message: article.status === 'published' ? "Article published" : "Article submitted for review",
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAdminArticles = async (req, res) => {
  try {
    const page=Math.max(Number(req.query.page) || 1, 1);
    const limit=Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const search=req.query.search || '';
    const query={};

    if (search) {
      query.$or=[
        {title: {$regex: search, $options: 'i'}},
        {excerpt: {$regex: search, $options: 'i'}},
        {status: {$regex: search, $options: 'i'}},
        {category: {$regex: search, $options: 'i'}}
      ];
    }

    const articles=await Article.find(query)
      .populate('author', 'name email role profilePicture')
      .sort('-updatedAt')
      .skip((page - 1) * limit)
      .limit(limit);
    const total=await Article.countDocuments(query);

    res.status(200).json({
      success:true,
      total,
      pages:Math.ceil(total / limit),
      currentPage:page,
      articles
    });
  } catch (error) {
    res.status(500).json({success:false,message:error.message});
  }
};

const deleteArticle= async(req,res)=>{
  try{
     const article = await Article.findByIdAndDelete(req.params.id);
      if (!article) 
        return res.status(404).json({ 
        message: "Article not found" 
      });

      res.json({ message: "Article deleted" });
  }catch(error){
      res.status(500).send("Server error");
  }
}

// Like/Unlike Article
const toggleLike = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user._id;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const alreadyLiked = article.likes.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      article.likes = article.likes.filter(id => id.toString() !== userId.toString());
    } else {
      article.likes.push(userId);
    }

    await article.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Article unliked' : 'Article liked',
      liked: !alreadyLiked,
      likes: article.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bookmark/Unbookmark Article
const toggleBookmark = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user._id;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const alreadyBookmarked = article.bookmarks.some(id => id.toString() === userId.toString());

    if (alreadyBookmarked) {
      article.bookmarks = article.bookmarks.filter(id => id.toString() !== userId.toString());
    } else {
      article.bookmarks.push(userId);
    }

    await article.save();

    res.status(200).json({
      success: true,
      message: alreadyBookmarked ? 'Article removed from bookmarks' : 'Article bookmarked',
      bookmarked: !alreadyBookmarked,
      bookmarks: article.bookmarks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBookmarkedArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      sort = '-publishedAt'
    } = req.query;

    const query = {
      status: 'published',
      bookmarks: req.user._id
    };

    const articles = await Article.find(query)
      .populate('author', 'name profilePicture')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Article.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if user has liked/bookmarked
const checkUserAction = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user._id;

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      liked: article.likes.some(id => id.toString() === userId.toString()),
      bookmarked: article.bookmarks.some(id => id.toString() === userId.toString()),
      likes: article.likes.length,
      bookmarks: article.bookmarks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports={createArticle,getAllArticles,getArticle,getBreakingNews,getFeaturedArticles,getMyArticles,getPrivateArticle,updateArticle,getReviewArticles,reviewArticle,submitArticleForReview,getAuditLogs,getAdminArticles,deleteArticle,toggleLike,toggleBookmark,getBookmarkedArticles,checkUserAction};
