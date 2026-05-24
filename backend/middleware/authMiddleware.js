const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.error(error);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // Fallback for local testing without login. Use a valid ObjectId to prevent Mongoose CastErrors
    req.user = { _id: '652136d89a74a12345678901', name: 'Admin', email: 'admin@local.dev', isMaster: true };
    return next();
  }

  res.status(401).json({ message: 'Not authorized, no token' });
};

const master = (req, res, next) => {
  if (req.user && req.user.isMaster) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as master user' });
  }
};

module.exports = { protect, master };
