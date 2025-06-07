import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  prices: [{
    type: Number,
    required: true
  }],
  duration: {
    type: Number, // in minutes
    required: true
  },
  image: {
    type: String,
    default: '/categories_images/combo_services.jpg'
  }
}, {
  timestamps: true
});

export default mongoose.model('Service', serviceSchema); 