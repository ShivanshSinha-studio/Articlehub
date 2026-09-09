const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide article title'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    required:true,
    trim:true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300,
    trim:true
  },
  content: {
    type: String,
    required: true,
    trim:true
  },
  featuredImage: [{
    type: String,
    required: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['physics', 'astronomy', 'technology', 'biology', 'earth', 'chemistry', 'mathematics']
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comment'
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBreaking: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected'],
    default: 'pending_review'
  },
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  reviewNote: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  publishedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

articleSchema.path('featuredImage').validate(function(images) {
  return Array.isArray(images) && images.length > 0;
}, 'Please upload at least one featured image');



const Article= mongoose.model('article', articleSchema);

module.exports=Article;
