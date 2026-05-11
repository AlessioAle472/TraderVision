const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = { _id: 'dev_admin', name: 'Admin', email: 'admin@local.dev', isMaster: true };
    return next();
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const master = (req, res, next) => {
  if (req.user && req.user.isMaster) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as master user' });
  }
};

module.exports = { protect, master };
