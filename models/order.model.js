import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: [true, 'Customer name is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required']
    },
    pincode: {
      type: String,
      required: [true, 'PIN code is required']
    }
  },
  items: [{
    serviceName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required']
  },
  deliveryTime: {
    type: String,
    required: [true, 'Delivery time is required']
  },
  additionalInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ongoing', 'postponed', 'completed', 'cancelled'],
    default: 'ongoing'
  }
}, {
  timestamps: true
});

// Add index for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order; 