import express from 'express';
import { getDiscounts, updateDiscount, deleteDiscount } from '../controllers/discount.controller.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all discounts
router.get('/', getDiscounts);

// Create or update discount (admin only)
router.put('/', isAuthenticated, isAdmin, updateDiscount);

// Delete discount (admin only)
router.delete('/:id', isAuthenticated, isAdmin, deleteDiscount);

export default router; 