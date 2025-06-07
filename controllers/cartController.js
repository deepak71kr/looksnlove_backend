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
      const price = item.product.price || (item.product.prices && item.product.prices[0]) || 0;
      return sum + (price * item.quantity);
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
    console.log('Add to cart request received:', {
      body: req.body,
      user: req.user?._id,
      headers: req.headers
    });

    const { serviceId, quantity = 1 } = req.body;

    if (!serviceId) {
      console.error('Missing serviceId in request:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    // Validate service
    const service = await Service.findById(serviceId);
    console.log('Service lookup result:', {
      serviceId,
      serviceFound: !!service,
      serviceDetails: service ? {
        id: service._id,
        name: service.name,
        price: service.price,
        prices: service.prices
      } : null
    });

    if (!service) {
      console.error('Service not found:', serviceId);
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    console.log('Cart lookup result:', {
      userId: req.user._id,
      cartFound: !!cart,
      cartId: cart?._id
    });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      console.log('Created new cart:', { cartId: cart._id });
    }

    // Check if service already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === serviceId
    );
    console.log('Existing item check:', {
      serviceId,
      existingItemFound: !!existingItem,
      currentQuantity: existingItem?.quantity
    });

    if (existingItem) {
      // Update quantity if service exists
      existingItem.quantity += quantity;
      console.log('Updated existing item quantity:', {
        newQuantity: existingItem.quantity
      });
    } else {
      // Add new item if service doesn't exist
      cart.items.push({ product: serviceId, quantity });
      console.log('Added new item to cart:', {
        serviceId,
        quantity
      });
    }

    await cart.save();
    console.log('Cart saved successfully:', {
      cartId: cart._id,
      itemCount: cart.items.length
    });

    // Get updated cart with populated service details
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price prices images'
      });

    console.log('Updated cart details:', {
      cartId: updatedCart._id,
      items: updatedCart.items.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        prices: item.product.prices,
        quantity: item.quantity
      }))
    });

    // Calculate total
    const total = updatedCart.items.reduce((sum, item) => {
      const price = item.product.price || (item.product.prices && item.product.prices[0]) || 0;
      return sum + (price * item.quantity);
    }, 0);

    console.log('Cart total calculated:', { total });

    res.status(200).json({
      success: true,
      data: {
        items: updatedCart.items,
        total
      }
    });
  } catch (error) {
    console.error('Add to cart error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      userId: req.user?._id
    });
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      const price = item.product.price || (item.product.prices && item.product.prices[0]) || 0;
      return sum + (price * item.quantity);
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
      const price = item.product.price || (item.product.prices && item.product.prices[0]) || 0;
      return sum + (price * item.quantity);
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