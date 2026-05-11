const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const isMaster = email === 'alessio199621@gmail.com';
    const plan = isMaster ? 'pro' : 'free';

    const user = await User.create({
      email,
      password,
      isMaster,
      plan
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        isMaster: user.isMaster,
        plan: user.plan,
        theme: user.theme,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        isMaster: user.isMaster,
        plan: user.plan,
        theme: user.theme,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user settings
router.put('/settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.email) {
      user.email = req.body.email;
    }
    if (req.body.password) {
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
      theme: updatedUser.theme,
      token: generateToken(updatedUser._id) // Optionally return new token, but old one still works
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
