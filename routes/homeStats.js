import express from 'express';
import HomeStats from '../models/HomeStats.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get homepage statistics
router.get('/', async (req, res) => {
  try {
    const stats = await HomeStats.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Update homepage statistics (admin only)
router.put('/', isAdmin, async (req, res) => {
  try {
    const { rating, services, experience, members } = req.body;
    
    // Validate input
    if (rating && (rating < 0 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }
    if (services && services < 0) {
      return res.status(400).json({ message: 'Services count cannot be negative' });
    }
    if (experience && experience < 0) {
      return res.status(400).json({ message: 'Experience years cannot be negative' });
    }
    if (members && members < 0) {
      return res.status(400).json({ message: 'Members count cannot be negative' });
    }

    const stats = await HomeStats.getStats();
    const updatedStats = await HomeStats.findByIdAndUpdate(
      stats._id,
      {
        rating: rating || stats.rating,
        services: services || stats.services,
        experience: experience || stats.experience,
        members: members || stats.members
      },
      { new: true }
    );

    res.json(updatedStats);
  } catch (error) {
    res.status(500).json({ message: 'Error updating statistics', error: error.message });
  }
});

export default router; 