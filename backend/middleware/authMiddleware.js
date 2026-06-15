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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      // Do not leak error details (expired, invalid signature, etc.)
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  // In development with no token, proceed without a user (do NOT inject a fake admin)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] No token in DEV mode — proceeding without authenticated user.');
    req.user = null;
    return next();
  }

  res.status(401).json({ message: 'Not authorized, no token' });
};

const master = (req, res, next) => {
  if (req.user && (req.user.isMaster || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as master user' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required for AI features' });
  }
};

module.exports = { protect, master, verifyAdmin };
