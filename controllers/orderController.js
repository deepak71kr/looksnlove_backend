import Order from '../models/order.model.js';
import Cart from '../models/Cart.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';

// Create new order
export const createOrder = async (req, res) => {
  try {
    console.log('Create order request received:', {
      body: req.body,
      user: req.user?._id,
      headers: req.headers
    });

    const { items, total, customerDetails, deliveryDate, deliveryTime, additionalInstructions } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items in request:', items);
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    if (!customerDetails) {
      console.error('Missing customer details in request');
      return res.status(400).json({
        success: false,
        message: 'Customer details are required'
      });
    }

    if (!deliveryDate || !deliveryTime) {
      console.error('Missing delivery information:', { deliveryDate, deliveryTime });
      return res.status(400).json({
        success: false,
        message: 'Delivery date and time are required'
      });
    }

    // Validate items
    for (const item of items) {
      if (!item._id || !item.quantity) {
        console.error('Invalid item in request:', item);
        return res.status(400).json({
          success: false,
          message: 'Each item must have an ID and quantity'
        });
      }

      // Verify service exists
      const service = await Service.findById(item._id);
      if (!service) {
        console.error('Service not found:', item._id);
        return res.status(404).json({
          success: false,
          message: `Service not found: ${item._id}`
        });
      }
    }

    console.log('Creating order with validated data:', {
      userId: req.user._id,
      itemCount: items.length,
      total,
      deliveryDate,
      deliveryTime
    });

    // Create order
    const order = new Order({
      userId: req.user._id,
      customerDetails,
      items,
      total,
      deliveryDate,
      deliveryTime,
      additionalInstructions,
      status: 'ongoing'
    });

    await order.save();
    console.log('Order created successfully:', {
      orderId: order._id,
      userId: order.userId,
      status: order.status
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      userId: req.user?._id
    });
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all orders (admin)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    console.log('Fetching orders for user:', {
      userId: req.user?._id,
      userEmail: req.user?.email,
      isAuthenticated: !!req.user
    });
    
    if (!req.user || !req.user._id) {
      console.error('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      console.error('Invalid user ID:', req.user._id);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Find orders with error handling
    let orders;
    try {
      orders = await Order.find({ userId: req.user._id })
        .sort('-createdAt')
        .lean();
      
      console.log(`Found ${orders.length} orders for user ${req.user._id}`);
    } catch (dbError) {
      console.error('Database error fetching orders:', dbError);
      throw new Error('Database error while fetching orders');
    }

    // Format dates for frontend
    const formattedOrders = orders.map(order => {
      try {
        return {
          ...order,
          deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : null,
          createdAt: order.createdAt ? order.createdAt.toISOString() : null
        };
      } catch (formatError) {
        console.error('Error formatting order:', formatError);
        return order;
      }
    });

    res.status(200).json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Get user orders error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is admin or order owner
    if (order.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 