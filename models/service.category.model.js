// models/ServiceCategory.js
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    default: ''
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  services: [serviceSchema]
});

const ServiceCategory = mongoose.model('ServiceCategory', categorySchema);

export default ServiceCategory;
