import express from 'express';
import { auth } from '../middleware/auth.js';
import { signup, login, logout, checkAuth, forgotPassword } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.post('/logout', auth, logout);
router.get('/check-auth', auth, checkAuth);

export default router;
