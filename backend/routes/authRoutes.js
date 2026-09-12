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
    const { email, password, name, acceptedTerms } = req.body;

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
    
    // 7-day free trial for all new users
    const trialDays = 7;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const plan = 'pro'; // full PRO access during trial
    const subscriptionStatus = isMaster ? 'active' : 'trialing';

    const user = await User.create({
      email: email.toLowerCase().trim(),
      name: name ? name.trim() : email.split('@')[0],
      password,
      isMaster,
      plan,
      subscriptionPlan: plan,
      subscriptionStatus,
      trialEndsAt,
      billingInterval: 'month',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        isMaster: user.isMaster,
        role: user.role,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan || user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        billingInterval: user.billingInterval,
        stripeCustomerId: user.stripeCustomerId,
        preferences: user.preferences,
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
      return res.json({
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        isMaster: user.isMaster,
        role: user.role,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan || user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        billingInterval: user.billingInterval,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        preferences: user.preferences,
        theme: user.theme,
        token: generateToken(user._id),
      });
    } else {
      // Generic message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    return res.status(500).json({ error: error.message });
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

// ── Update Profile (Name, Username, Avatar) ────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, username, avatar } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ message: 'Username deve contenere almeno 3 caratteri alfanumerici' });
      }
      // Check if username is taken by another user
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Questo username è già in uso' });
      }
      user.username = cleanUsername;
    }
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        preferences: user.preferences,
      }
    });
  } catch (error) {
    console.error('[Auth] Profile update error:', error);
    res.status(500).json({ message: error.message || 'Errore durante l\'aggiornamento del profilo' });
  }
});

// ── Change Password Securely ───────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password corrente e nuova password richieste' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nuova password deve contenere almeno 8 caratteri' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'La password corrente non è corretta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password modificata con successo' });
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({ message: 'Errore durante la modifica della password' });
  }
});

// ── Update Preferences ─────────────────────────────────────────────────────
router.put('/preferences', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { currency, notifications, theme } = req.body;

    if (theme) user.theme = theme;
    if (!user.preferences) user.preferences = {};
    if (currency) user.preferences.currency = currency;
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    user.markModified('preferences');
    await user.save();

    res.json({
      success: true,
      message: 'Preferenze salvate',
      preferences: user.preferences,
      theme: user.theme
    });
  } catch (error) {
    console.error('[Auth] Update preferences error:', error);
    res.status(500).json({ message: 'Errore durante il salvataggio delle preferenze' });
  }
});

// ── Subscription Management (Switch Plan / Cancel / Reactivate) ─────────────
router.post('/subscription/change', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { action, interval } = req.body; // action: 'switch_interval' | 'cancel' | 'reactivate'
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'switch_interval') {
      if (!['month', 'year'].includes(interval)) {
        return res.status(400).json({ message: 'Intervallo non valido (richiesto month o year)' });
      }
      user.billingInterval = interval;
      await user.save();
      return res.json({
        success: true,
        message: `Frequenza di fatturazione aggiornata a: ${interval === 'year' ? 'Annuale' : 'Mensile'}`,
        billingInterval: user.billingInterval,
      });
    }

    if (action === 'cancel') {
      user.cancelAtPeriodEnd = true;
      await user.save();
      return res.json({
        success: true,
        message: 'Il rinnovo automatico dell\'abbonamento è stato disattivato.',
        cancelAtPeriodEnd: true,
      });
    }

    if (action === 'reactivate') {
      user.cancelAtPeriodEnd = false;
      await user.save();
      return res.json({
        success: true,
        message: 'Rinnovo automatico riattivato con successo.',
        cancelAtPeriodEnd: false,
      });
    }

    return res.status(400).json({ message: 'Azione non riconosciuta' });
  } catch (error) {
    console.error('[Auth] Subscription change error:', error);
    res.status(500).json({ message: 'Errore durante la gestione dell\'abbonamento' });
  }
});

// ── GDPR Data Export ───────────────────────────────────────────────────────
router.get('/export-data', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Collect all related user data
    let Post = null;
    let Comment = null;
    try {
      Post = require('../models/Post');
      Comment = require('../models/Comment');
    } catch (e) {}

    const posts = Post ? await Post.find({ author: user._id }) : [];
    const comments = Comment ? await Comment.find({ author: user._id }) : [];

    const exportBundle = {
      exportDate: new Date().toISOString(),
      platform: 'TraderVision Quantitative Terminal',
      compliance: 'GDPR / Regolamento UE 2016/679',
      userProfile: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        plan: user.plan,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        billingInterval: user.billingInterval,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
      userActivity: {
        postsCount: posts.length,
        posts: posts.map(p => ({ id: p._id, content: p.content, createdAt: p.createdAt })),
        commentsCount: comments.length,
        comments: comments.map(c => ({ id: c._id, text: c.text, createdAt: c.createdAt })),
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=tradervision_gdpr_export_${user._id}.json`);
    return res.json(exportBundle);
  } catch (error) {
    console.error('[Auth] GDPR export error:', error);
    res.status(500).json({ message: 'Errore durante l\'esportazione dei dati' });
  }
});

// ── Delete Account (GDPR Right to Erasure) ──────────────────────────────────
router.delete('/delete-account', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Conferma la password per eliminare l\'account' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isMaster) {
      return res.status(403).json({ message: 'L\'account Master non può essere eliminato.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password errata. Eliminazione annullata.' });
    }

    // Clean up user posts and comments
    try {
      const Post = require('../models/Post');
      const Comment = require('../models/Comment');
      await Post.deleteMany({ author: user._id });
      await Comment.deleteMany({ author: user._id });
    } catch (e) {
      console.warn('[Auth] Cleanup related entities warning:', e.message);
    }

    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: 'Account e dati personali eliminati definitivamente.' });
  } catch (error) {
    console.error('[Auth] Delete account error:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'account' });
  }
});

// ── Legacy Update user settings ────────────────────────────────────────────
router.put('/settings', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.email) {
      user.email = req.body.email.toLowerCase().trim();
    }
    if (req.body.name) {
      user.name = req.body.name.trim();
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
      name: updatedUser.name,
      username: updatedUser.username,
      isMaster: updatedUser.isMaster,
      plan: updatedUser.plan,
      subscriptionPlan: updatedUser.subscriptionPlan || updatedUser.plan,
      subscriptionStatus: updatedUser.subscriptionStatus,
      trialEndsAt: updatedUser.trialEndsAt,
      billingInterval: updatedUser.billingInterval,
      stripeCustomerId: updatedUser.stripeCustomerId,
      theme: updatedUser.theme,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email o username già in uso' });
    }
    console.error('[Auth] Settings update error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Dev Token Helper (Development only) ──────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  router.get('/dev-token', async (req, res) => {
    try {
      let user = await User.findOne({ email: 'admin@local.dev' });
      if (!user) {
        user = await User.create({
          email: 'admin@local.dev',
          password: 'devPassword123!',
          isMaster: true,
          role: 'admin',
          plan: 'pro',
          subscriptionPlan: 'pro'
        });
      } else {
        if (!user.isMaster || user.role !== 'admin' || user.plan !== 'pro') {
          user.isMaster = true;
          user.role = 'admin';
          user.plan = 'pro';
          user.subscriptionPlan = 'pro';
          await user.save();
        }
      }
      res.json({
        user: {
          _id: user._id,
          email: user.email,
          name: 'Admin',
          isMaster: true,
          role: 'admin',
          plan: 'pro',
          subscriptionPlan: 'pro',
          theme: user.theme || 'dark'
        },
        token: generateToken(user._id)
      });
    } catch (err) {
      console.error('[Auth] Error generating dev token:', err);
      res.status(500).json({ error: 'Failed to generate dev token' });
    }
  });
}

module.exports = router;
