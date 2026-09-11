const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');

// POST /api/groups - Crea un nuovo gruppo
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate, members } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Se è pubblico, controlliamo omonimi o nomi molto simili
    if (!isPrivate) {
      // Escape special regex characters from user input to prevent ReDoS
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingExact = await Group.findOne({ name: new RegExp(`^${escapedName}$`, 'i'), isPrivate: false });
      if (existingExact) {
        // Cerca suggerimenti
        const similarGroups = await Group.find({ 
          $text: { $search: name },
          isPrivate: false 
        }).limit(3);
        
        return res.status(409).json({ 
          error: 'A public group with this name already exists.', 
          suggestions: similarGroups 
        });
      }
    }

    // Aggiungiamo il creatore ai membri e admin di default
    const initialMembers = Array.from(new Set([req.user._id.toString(), ...(members || [])]));

    const group = new Group({
      name,
      description,
      creator: req.user._id,
      members: initialMembers,
      admins: [req.user._id],
      isPrivate
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/groups/my-groups - Ottieni i gruppi dell'utente
router.get('/my-groups', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching my groups:', error);
    res.status(500).json({ error: 'Failed to fetch your groups' });
  }
});

// GET /api/groups/search - Cerca gruppi pubblici
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      // Ritorna i gruppi pubblici più recenti se nessuna query
      const groups = await Group.find({ isPrivate: false }).sort({ createdAt: -1 }).limit(10);
      return res.json(groups);
    }

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const groups = await Group.find({ 
      isPrivate: false,
      name: { $regex: escapedQ, $options: 'i' }
    }).limit(20);
    res.json(groups);
  } catch (error) {
    console.error('Error searching groups:', error);
    res.status(500).json({ error: 'Failed to search groups' });
  }
});

// POST /api/groups/:id/join - Entra in un gruppo pubblico
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.isPrivate) return res.status(403).json({ error: 'Cannot join private group directly' });

    if (!group.members.some(id => id.toString() === req.user._id.toString())) {
      group.members.push(req.user._id);
      await group.save();
    }
    res.json(group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

module.exports = router;
