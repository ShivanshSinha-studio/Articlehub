const User = require('../Model/userSchema');
const jwt = require('jsonwebtoken');

const setAccessCookie = (res, user) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const token = jwt.sign(
    {_id:user._id,email:user.email,role:user.role,type:'access'},
    process.env.JWT_KEY,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'}
  );

  res.cookie('token', token, {
    httpOnly:true,
    sameSite:isProduction ? 'none' : 'lax',
    secure:isProduction,
    maxAge:15*60*1000
  });
};

const getUserFromRefreshToken = async (refreshToken, res) => {
  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY || process.env.JWT_KEY);

  if (payload.type !== 'refresh') {
    throw new Error('invalid refresh token');
  }

  const user = await User.findById(payload._id);
  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    throw new Error('refresh token revoked');
  }

  setAccessCookie(res, user);
  return user;
};

const userMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_KEY);
      if (payload.type !== 'access') {
        throw new Error('invalid access token');
      }

      const user = await User.findById(payload._id);
      if (!user) {
        throw new Error('user not found');
      }

      req.user = user;
      return next();
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new Error('please login');
    }

    req.user = await getUserFromRefreshToken(refreshToken, res);
    next();
  } catch (error) {
    res.status(401).send('Error: ' + error.message);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_KEY);
      if (payload.type !== 'access') {
        req.user = null;
        return next();
      }

      req.user = await User.findById(payload._id);
      return next();
    }

    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      req.user = await getUserFromRefreshToken(refreshToken, res);
      return next();
    }

    req.user = null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = userMiddleware;
module.exports.optionalAuth = optionalAuth;
