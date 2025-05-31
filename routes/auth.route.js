import express from 'express';
import { auth } from '../middleware/auth.js';
import { login, signup, logout, checkAuth, forgotPassword } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/check-auth', checkAuth);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/check', auth, checkAuth);

export default router;