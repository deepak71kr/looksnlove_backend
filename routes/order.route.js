import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';

const router = express.Router();

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== Creating New Order ===');
    console.log('User ID:', req.user._id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { customerDetails, deliveryDate, deliveryTime, additionalInstructions } = req.body;
    
    // Validate required fields
    if (!customerDetails || !customerDetails.name || !customerDetails.phone || !customerDetails.address || !customerDetails.pincode) {
      console.error('Missing required customer details');
      return res.status(400).json({ message: 'Missing required customer details' });
    }

    if (!deliveryDate || !deliveryTime) {
      console.error('Missing delivery date or time');
      return res.status(400).json({ message: 'Missing delivery date or time' });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id });
    console.log('Found Cart:', JSON.stringify(cart, null, 2));
    
    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty or not found');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create new order
    const order = new Order({
      userId: req.user._id,
      customerDetails,
      items: cart.items.map(item => ({
        serviceName: item.serviceName,
        category: item.category,
        price: item.price
      })),
      total: cart.total,
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      additionalInstructions,
      status: 'ongoing'
    });

    console.log('New Order Object:', JSON.stringify(order, null, 2));
    
    try {
      const savedOrder = await order.save();
      console.log('Order saved successfully with ID:', savedOrder._id);

      // Clear the cart after successful order
      cart.items = [];
      cart.total = 0;
      await cart.save();
      console.log('Cart cleared after order');

      // Return the saved order with populated user details
      const populatedOrder = await Order.findById(savedOrder._id).populate('userId', 'name email');
      res.status(201).json(populatedOrder);
    } catch (saveError) {
      console.error('Error saving order:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(saveError.errors).map(err => err.message)
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all orders (admin only)
router.get('/admin', auth, isAdmin, async (req, res) => {
  try {
    console.log('=== Fetching All Orders for Admin ===');
    console.log('Admin User ID:', req.user._id);
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    console.log(`Found ${orders.length} orders`);
    console.log('Orders:', orders);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== Fetching User Orders ===');
    console.log('User ID:', req.user._id);
    
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for user`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get specific order
router.get('/:orderId', auth, async (req, res) => {
  try {
    console.log('=== Fetching Specific Order ===');
    console.log('Order ID:', req.params.orderId);
    console.log('User ID:', req.user._id);
    
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id
    });
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Found order:', order);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status (admin only)
router.patch('/:orderId/status', auth, isAdmin, async (req, res) => {
  try {
    console.log('=== Updating Order Status ===');
    console.log('Order ID:', req.params.orderId);
    console.log('New Status:', req.body.status);
    
    const { status } = req.body;
    
    if (!['ongoing', 'postponed', 'completed'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    await order.save();
    console.log('Order status updated successfully');
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Cancel order
router.patch('/:orderId/cancel', auth, async (req, res) => {
  try {
    console.log('=== Cancelling Order ===');
    console.log('Order ID:', req.params.orderId);
    console.log('User ID:', req.user._id);
    
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id
    });
    
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status === 'completed') {
      console.log('Cannot cancel completed order');
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }
    
    order.status = 'cancelled';
    await order.save();
    console.log('Order cancelled successfully');
    
    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
});

export default router; 