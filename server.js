// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
import categoryRoutes from './routes/category.route.js';
import contactRoutes from './routes/contact.route.js';
import userRoutes from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import cartRoutes from './routes/cart.route.js';
import authRoutes from './routes/auth.route.js';
import serviceRoutes from './routes/services.route.js';
import homeStatsRoutes from './routes/homeStats.js';
import orderRoutes from './routes/order.route.js';
import profileRoutes from './routes/profile.route.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: ['https://looksnlove-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/home-stats', homeStatsRoutes);
app.use('/api/users/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

