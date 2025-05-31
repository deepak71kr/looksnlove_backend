import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  validUntil: {
    type: Date,
    required: true
  },
  services: {
    all: {
      type: Boolean,
      required: true,
      default: false
    },
    categories: {
      type: Object,
      required: true,
      default: {}
    },
    services: {
      type: Object,
      required: true,
      default: {}
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
discountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Convert services to proper format when saving
discountSchema.pre('save', function(next) {
  if (this.services) {
    // Ensure services is an object
    if (typeof this.services !== 'object') {
      this.services = {};
    }

    // Ensure categories and services are objects
    if (typeof this.services.categories !== 'object') {
      this.services.categories = {};
    }
    if (typeof this.services.services !== 'object') {
      this.services.services = {};
    }

    // Convert any Map instances to plain objects
    if (this.services.categories instanceof Map) {
      this.services.categories = Object.fromEntries(this.services.categories);
    }
    if (this.services.services instanceof Map) {
      this.services.services = Object.fromEntries(this.services.services);
    }
  }
  next();
});

// Add validation for services structure
discountSchema.pre('validate', function(next) {
  if (this.services) {
    // Validate all flag
    if (typeof this.services.all !== 'boolean') {
      this.invalidate('services.all', 'All services flag must be a boolean');
    }

    // Validate categories object
    if (typeof this.services.categories !== 'object') {
      this.invalidate('services.categories', 'Categories must be an object');
    } else {
      // Validate each category value is a boolean
      for (const [key, value] of Object.entries(this.services.categories)) {
        if (typeof value !== 'boolean') {
          this.invalidate('services.categories', `Category ${key} value must be a boolean`);
        }
      }
    }

    // Validate services object
    if (typeof this.services.services !== 'object') {
      this.invalidate('services.services', 'Services must be an object');
    } else {
      // Validate each service value is a boolean
      for (const [key, value] of Object.entries(this.services.services)) {
        if (typeof value !== 'boolean') {
          this.invalidate('services.services', `Service ${key} value must be a boolean`);
        }
      }
    }
  }
  next();
});

// Convert to JSON
discountSchema.set('toJSON', {
  transform: function(doc, ret) {
    try {
      if (ret.services) {
        // Ensure we're returning plain objects
        ret.services.categories = ret.services.categories instanceof Map 
          ? Object.fromEntries(ret.services.categories)
          : ret.services.categories || {};
        
        ret.services.services = ret.services.services instanceof Map
          ? Object.fromEntries(ret.services.services)
          : ret.services.services || {};
      }
      return ret;
    } catch (error) {
      console.error('Error in toJSON transform:', error);
      return ret;
    }
  }
});

const Discount = mongoose.model('Discount', discountSchema);

export default Discount; 