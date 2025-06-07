import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import Order from '../models/order.model.js';
import Cart from '../models/Cart.js';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus,
  getUserOrders 
} from '../controllers/orderController.js';

const router = express.Router();

// Create a new order
router.post('/', auth, createOrder);

// Get all orders (admin only)
router.get('/', auth, isAdmin, getOrders);

// Get user's orders (must be before /:id route)
router.get('/my-orders', auth, getUserOrders);

// Get specific order
router.get('/:id', auth, getOrderById);

// Update order status (admin only)
router.patch('/:id/status', auth, isAdmin, updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot cancel completed order' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
});

export default router; 