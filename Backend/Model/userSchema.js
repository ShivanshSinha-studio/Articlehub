const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a username'],
    minlength: 3,
    maxlength: 30,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    trim:true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  refreshTokenVersion: {
    type: Number,
    default: 0
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'author', 'admin'],
    default: 'user'
  },
  requestedRole: {
    type: String,
    enum: ['user', 'author'],
    default: 'user'
  },
  authorRequestStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  authorRequestMessage: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  authorRequestAdminNote: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  authorRequestReviewedAt: {
    type: Date
  },
  authorRequestReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  savedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500
  },
  newsletterSubscribed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},{timestamps:true});

const User=mongoose.model("user",userSchema)

module.exports = User;
