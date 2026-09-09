const Article= require('../Model/ArticleSchema');

const PhysicArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'physics', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const AstronomyArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'astronomy', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const TechnologyArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'technology', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const BiologyArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'biology', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const EarthArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'earth', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const ChemistryArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'chemistry', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}

const MathematicsArticle=async(req,res)=>{
    try{
    const articles = await Article.find({ category: 'mathematics', status:'published' })
      .populate('author', 'profilePicture')
      .sort('-publishedAt')   // latest first
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
}


module.exports={PhysicArticle,AstronomyArticle,TechnologyArticle,BiologyArticle,
    EarthArticle,ChemistryArticle,MathematicsArticle}
