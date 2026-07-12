const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ── Register ───────────────────────────────────────────────────────────────
// Rate limited: max 10 attempts per 15 minutes per IP
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      // Return same generic message to prevent email enumeration
      return res.status(400).json({ message: 'Registration failed. Please check your details.' });
    }

    const isMaster = process.env.MASTER_EMAIL && email.toLowerCase() === process.env.MASTER_EMAIL.toLowerCase();
    const plan = isMaster ? 'pro' : 'free';

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      isMaster,
      plan,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        isMaster: user.isMaster,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan || user.plan,
        stripeCustomerId: user.stripeCustomerId,
        theme: user.theme,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ── Login ──────────────────────────────────────────────────────────────────
// Rate limited: max 10 attempts per 15 minutes per IP
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        isMaster: user.isMaster,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan || user.plan,
        stripeCustomerId: user.stripeCustomerId,
        theme: user.theme,
        token: generateToken(user._id),
      });
    } else {
      // Generic message to prevent user enumeration
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ── Get current user ───────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[Auth] /me error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Update user settings ───────────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow whitelisted fields to be updated
    if (req.body.email) {
      user.email = req.body.email.toLowerCase().trim();
    }
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      user.password = req.body.password;
    }
    if (req.body.theme) {
      user.theme = req.body.theme;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      isMaster: updatedUser.isMaster,
      plan: updatedUser.plan,
      subscriptionPlan: updatedUser.subscriptionPlan || updatedUser.plan,
      stripeCustomerId: updatedUser.stripeCustomerId,
      theme: updatedUser.theme,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    console.error('[Auth] Settings update error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
