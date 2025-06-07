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
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);
  next();
});

// Add index for faster queries
cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 