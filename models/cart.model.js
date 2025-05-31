import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  total: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Calculate total before saving
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + item.price, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 