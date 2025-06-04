import express from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import { sendPasswordEmail } from '../utils/emailSender.js';

const router = express.Router();

// Helper for error responses
const errorResponse = (res, status, message) => {
  return res.status(status).json({ 
    success: false, 
    error: message 
  });
};

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Create and save user
    const newUser = new User({ 
      name, 
      email, 
      password,
      phone,
      role: 'user'
    });
    
    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating account. Please try again.' 
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Verify password
    if (password !== user.password) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/"
    });

    res.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Internal server error');
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'Email not registered');
    }

    try {
      // Send account details email
      await sendPasswordEmail(user.email, user.password, user.phone);
      
      res.json({ 
        success: true,
        message: 'Account details have been sent to your email'
      });
    } catch (emailError) {
      console.error('Error sending account details email:', emailError);
      return errorResponse(res, 500, 'Failed to send account details. Please try again later.');
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    errorResponse(res, 500, 'Failed to process request');
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with valid token
    const user = await User.findOne({
      email: decoded.email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired token');
    }

    // Update password
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ 
      success: true,
      message: 'Password reset successful' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    errorResponse(res, 500, 'Password reset failed');
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ 
      success: false, 
      message: 'Error during logout' 
    });
  }
});

// Check Auth Status Route
router.get('/check-auth', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      res.clearCookie('token');
      return res.json({ 
        success: false, 
        isAuthenticated: false,
        message: 'User not found'
      });
    }
    
    // Generate new token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie again to refresh it
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/"
    });
    
    // Send response with user data
    return res.json({ 
      success: true, 
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.clearCookie('token');
    return res.json({ 
      success: false, 
      isAuthenticated: false,
      message: 'Authentication check failed'
    });
  }
});

export default router;
