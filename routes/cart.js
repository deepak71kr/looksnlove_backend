const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// Get cart items
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [], total: 0 });
      await cart.save();
    }
    res.json({ items: cart.items, total: cart.total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [], total: 0 });
    }

    const newItem = {
      serviceName: req.body.serviceName,
      category: req.body.category,
      price: req.body.price,
      date: req.body.date,
      time: req.body.time
    };

    cart.items.push(newItem);
    cart.total = cart.items.reduce((sum, item) => sum + item.price, 0);
    await cart.save();

    res.json({ items: cart.items, total: cart.total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    cart.total = cart.items.reduce((sum, item) => sum + item.price, 0);
    await cart.save();

    res.json({ items: cart.items, total: cart.total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.json({ items: [], total: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 