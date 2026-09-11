const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { moderateContent } = require('../services/aiSynthesisService');

// Setup multer for image uploads
const uploadDir = path.join(__dirname, '../uploads/social');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// GET /api/social/posts - Get feed
router.get('/posts', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const groupId = req.query.groupId || null;

    const query = { isFlagged: false };
    if (groupId) {
      query.groupId = groupId;
    } else {
      query.groupId = null; // Solo post pubblici se non specificato
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 50)) // Cap at 50 to prevent large payload abuse
      .populate('author', 'name username avatar')
      .populate('reposts', 'name username')
      .populate({
        path: 'originalPostId',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    // Map over posts to generate missing usernames retroactively if needed
    const formattedPosts = posts.map(post => {
      const authorObj = post.author ? post.author.toObject() : { name: 'Unknown' };
      if (!authorObj.username) {
        authorObj.username = '@user';
        authorObj.name = authorObj.name || 'User';
      }
      return { ...post.toObject(), author: authorObj };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/social/posts - Create new post
router.post('/posts', protect, upload.single('media'), async (req, res) => {
  try {
    const { content, groupId } = req.body;
    
    if (!content && !req.file) {
      return res.status(400).json({ error: 'Content or media is required' });
    }

    // AI Moderation
    let isFlagged = false;
    if (content) {
      const moderationResult = await moderateContent(content);
      if (!moderationResult.isApproved) {
        isFlagged = true;
        // Depending on strictness, we could return 403. Let's just flag it for now so it's hidden from the feed.
      }
    }

    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/social/${req.file.filename}`;
    }

    const post = new Post({
      author: req.user._id, // Assumes protect middleware attaches user
      content: content || '',
      mediaUrl: mediaUrl,
      groupId: groupId || null,
      isFlagged: isFlagged
    });

    await post.save();
    
    const populatedPost = await Post.findById(post._id)
        .populate('author', 'name username avatar')
        .exec();

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/social/posts/:id/react - Toggle or update reaction
router.post('/posts/:id/react', protect, async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user._id;
    // Find existing reaction from this user
    const existingReactionIndex = post.reactions.findIndex(r => r.user.toString() === userId.toString());

    if (existingReactionIndex > -1) {
      // User already reacted
      if (post.reactions[existingReactionIndex].type === type) {
        // Toggle off if same reaction
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change reaction type
        post.reactions[existingReactionIndex].type = type;
      }
    } else {
      // New reaction
      post.reactions.push({ user: userId, type: type || 'like' });
    }

    await post.save();
    res.json({ reactions: post.reactions });
  } catch (error) {
    console.error('Error reacting to post:', error);
    res.status(500).json({ error: 'Failed to react to post' });
  }
});

// POST /api/social/posts/:id/repost - Repost to a group or global feed
router.post('/posts/:id/repost', protect, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ error: 'Post not found' });

    const { groupId, content } = req.body;
    const userId = req.user._id;

    // Aggiungiamo l'utente alla lista repost dell'originale
    if (!originalPost.reposts.some(id => id.toString() === userId.toString())) {
      originalPost.reposts.push(userId);
      await originalPost.save();
    }

    // Creiamo il nuovo post che "cita" l'originale
    const repostPost = new Post({
      author: userId,
      content: content || ' ', // Fallback space per passare la validazione required
      groupId: groupId || null,
      originalPostId: originalPost._id,
      isFlagged: false
    });

    await repostPost.save();
    
    const populatedPost = await Post.findById(repostPost._id)
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPostId',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error reposting:', error);
    res.status(500).json({ error: 'Failed to repost' });
  }
});

// POST /api/social/posts/:id/report - Report post
router.post('/posts/:id/report', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.reports += 1;
    // Auto-flag if reports exceed threshold
    if (post.reports >= 5) {
      post.isFlagged = true;
    }
    
    await post.save();
    res.json({ success: true, reports: post.reports });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

// DELETE /api/social/posts/:id - Delete post
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Security: only the post author can delete their own post
    if (!req.user || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// === COMMENTS ===
const Comment = require('../models/Comment');

// GET /api/social/posts/:id/comments
router.get('/posts/:id/comments', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar')
      .exec();
    
    const formattedComments = comments.map(c => {
      const authorObj = c.author ? c.author.toObject() : { name: 'Unknown' };
      if (!authorObj.username) {
        authorObj.username = '@user';
        authorObj.name = authorObj.name || 'User';
      }
      return { ...c.toObject(), author: authorObj };
    });

    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/social/posts/:id/comments
router.post('/posts/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = new Comment({
      post: post._id,
      author: req.user._id,
      content: content
    });

    await comment.save();
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name username avatar')
      .exec();

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

module.exports = router;
