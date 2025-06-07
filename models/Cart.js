import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total before saving
cartSchema.pre('save', async function(next) {
  try {
    if (this.isModified('items')) {
      const populatedCart = await this.populate({
        path: 'items.product',
        select: 'price prices'
      });
      
      this.total = populatedCart.items.reduce((sum, item) => {
        const price = item.product.price || (item.product.prices && item.product.prices[0]) || 0;
        return sum + (price * item.quantity);
      }, 0);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add index for faster queries
cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 