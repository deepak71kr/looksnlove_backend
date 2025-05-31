import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/', auth, getProfile);

// Update user profile
router.put('/', auth, updateProfile);

export default router; 