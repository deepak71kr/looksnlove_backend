import Cart from '../models/Cart.js';
import Service from '../models/Service.js';

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images'
      });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          total: 0
        }
      });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        items: cart.items,
        total
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart'
    });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { serviceId, quantity = 1 } = req.body;

    // Validate service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if service already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === serviceId
    );

    if (existingItem) {
      // Update quantity if service exists
      existingItem.quantity += quantity;
    } else {
      // Add new item if service doesn't exist
      cart.items.push({ product: serviceId, quantity });
    }

    await cart.save();

    // Get updated cart with populated service details
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price images'
      });

    // Calculate total
    const total = updatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        items: updatedCart.items,
        total
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart'
    });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { serviceId, quantity } = req.body;

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item
    const item = cart.items.find(
      item => item.product.toString() === serviceId
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    item.quantity = quantity;
    await cart.save();

    // Get updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price images'
      });

    // Calculate total
    const total = updatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        items: updatedCart.items,
        total
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart'
    });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item
    cart.items = cart.items.filter(
      item => item.product.toString() !== serviceId
    );
    await cart.save();

    // Get updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price images'
      });

    // Calculate total
    const total = updatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        items: updatedCart.items,
        total
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart'
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      data: {
        items: [],
        total: 0
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart'
    });
  }
}; 