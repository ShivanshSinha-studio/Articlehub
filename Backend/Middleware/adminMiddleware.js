const userMiddleware = require('./userMiddleware');

const adminMiddleware = (req, res, next) => {
  userMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).send('Error: you are not admin');
    }

    next();
  });
};

module.exports = adminMiddleware;
