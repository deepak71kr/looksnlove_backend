import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Basic cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);
      
      if (!decoded.userId) {
        console.log('No userId in token');
        res.clearCookie('token', cookieOptions);
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token format' 
        });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        res.clearCookie('token', cookieOptions);
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      req.user = user;
      console.log('User authenticated:', user._id);
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      res.clearCookie('token', cookieOptions);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('token', cookieOptions);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found in cookies for admin check');
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Admin token decoded:', decoded);
      
      if (!decoded.userId) {
        console.log('No userId in token');
        res.clearCookie('token', cookieOptions);
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token format' 
        });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user || user.role !== 'admin') {
        console.log('User not admin:', user?._id);
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized' 
        });
      }

      req.user = user;
      console.log('Admin authenticated:', user._id);
      next();
    } catch (jwtError) {
      console.error('Admin JWT verification error:', jwtError);
      res.clearCookie('token', cookieOptions);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.clearCookie('token', cookieOptions);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 