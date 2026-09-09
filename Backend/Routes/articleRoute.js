const express = require('express');
const articleRouter = express.Router();

const uploadArticleImage = require('../Middleware/uploadimage');
const userMiddleware = require("../Middleware/userMiddleware");
const authorize= require('../Middleware/authorize');

const {createArticle ,getAllArticles,getArticle,getFeaturedArticles,getBreakingNews,getMyArticles,getPrivateArticle,updateArticle,getReviewArticles,reviewArticle,submitArticleForReview,getAuditLogs,getAdminArticles,deleteArticle,toggleLike,toggleBookmark,getBookmarkedArticles,checkUserAction}= require('../controllers/articleController');
const {addComment, getComments, deleteComment, toggleCommentLike, updateComment} = require('../controllers/commentController');

// // Public routes
articleRouter.get('/getAll', getAllArticles);
articleRouter.get('/article/:slug', getArticle);
articleRouter.get('/articles/featured', getFeaturedArticles);
articleRouter.get('/articles/breaking', getBreakingNews);
articleRouter.get('/articles/myArticle',userMiddleware,getMyArticles);
articleRouter.get('/articles/bookmarks',userMiddleware,getBookmarkedArticles);
articleRouter.get('/articles/audit-logs',userMiddleware,authorize('admin'),getAuditLogs);
articleRouter.get('/articles/admin/all',userMiddleware,authorize('admin'),getAdminArticles);
articleRouter.get('/articles/private/:id',userMiddleware,authorize('author', 'admin'),getPrivateArticle);
articleRouter.get('/articles/review',userMiddleware,authorize('admin'),getReviewArticles);
articleRouter.patch('/articles/review/:id',userMiddleware,authorize('admin'),reviewArticle);
articleRouter.delete('/articles/:id', userMiddleware, authorize('admin'), deleteArticle);

// Article Actions (Like, Bookmark, Check Status)
articleRouter.post('/like/:articleId', userMiddleware, toggleLike);
articleRouter.post('/bookmark/:articleId', userMiddleware, toggleBookmark);
articleRouter.get('/check/:articleId', userMiddleware, checkUserAction);

// Comment Routes
articleRouter.post('/comments/:articleId', userMiddleware, addComment);
articleRouter.get('/comments/:articleId', getComments);
articleRouter.delete('/comments/:commentId', userMiddleware, deleteComment);
articleRouter.post('/comments/:commentId/like', userMiddleware, toggleCommentLike);
articleRouter.patch('/comments/:commentId', userMiddleware, updateComment);

// // Protected routes
articleRouter.post('/create', userMiddleware, authorize('author', 'admin'), uploadArticleImage, createArticle);
articleRouter.put('/articles/:id', userMiddleware, authorize('author', 'admin'), uploadArticleImage, updateArticle);
articleRouter.patch('/articles/:id/submit', userMiddleware, authorize('author', 'admin'), submitArticleForReview);



module.exports = articleRouter;
