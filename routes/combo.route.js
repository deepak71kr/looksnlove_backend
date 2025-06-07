import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import ComboPackage from '../models/ComboPackage.js';

const router = express.Router();

// Get all combo packages
router.get('/', async (req, res) => {
  try {
    const combos = await ComboPackage.find({ isActive: true })
      .populate('services');
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific combo package
router.get('/:id', async (req, res) => {
  try {
    const combo = await ComboPackage.findById(req.params.id)
      .populate('services');
    if (!combo) {
      return res.status(404).json({ message: 'Combo package not found' });
    }
    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create combo package (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const combo = new ComboPackage(req.body);
    const savedCombo = await combo.save();
    res.status(201).json(savedCombo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update combo package (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const combo = await ComboPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('services');
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete combo package (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await ComboPackage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Combo package deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 