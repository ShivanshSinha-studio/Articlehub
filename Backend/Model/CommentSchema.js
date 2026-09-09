const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide comment content'],
    minlength: 1,
    maxlength: 1000,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'article',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for finding comments by article
commentSchema.index({ article: 1, createdAt: -1 });

const Comment = mongoose.model('comment', commentSchema);

module.exports = Comment;
