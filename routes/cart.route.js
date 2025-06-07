import express from 'express';
import { auth } from '../middleware/auth.js';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';

const router = express.Router();

// Get user's cart
router.get('/', auth, getCart);

// Add item to cart
router.post('/add', auth, addToCart);

// Update cart item
router.put('/update', auth, updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', auth, removeFromCart);

// Clear cart
router.delete('/clear', auth, clearCart);

export default router; 