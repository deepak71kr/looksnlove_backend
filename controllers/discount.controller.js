import Discount from '../models/Discount.js';
import Service from '../models/Service.js';

// Get all discounts
export const getDiscounts = async (req, res) => {
  try {
    // Find the most recent discount
    let discount = await Discount.findOne().sort({ createdAt: -1 });

    // Check if discount exists and is not expired
    if (discount) {
      const now = new Date();
      const validUntil = new Date(discount.validUntil);

      // If discount is expired, delete it and revert prices
      if (now > validUntil) {
        // Revert prices for affected services
        const serviceIds = Object.keys(discount.services.services);
        const servicesToUpdate = await Service.find({
          _id: { $in: serviceIds }
        });

        for (const service of servicesToUpdate) {
          service.price = service.originalPrice || service.price;
          await service.save();
        }

        // Delete the expired discount
        await Discount.findByIdAndDelete(discount._id);
        discount = null;
      }
    }

    res.json(discount);
  } catch (error) {
    console.error('Error in getDiscounts:', error);
    res.status(500).json({ message: 'Error fetching discounts' });
  }
};

// Create or update discount
export const updateDiscount = async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { name, percentage, validUntil, services } = req.body;

    // Validate input
    if (!name || percentage === undefined || !validUntil || !services) {
      console.log('Missing fields:', { name, percentage, validUntil, services });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate name
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Invalid discount name' });
    }

    // Validate percentage
    const percentageNum = Number(percentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
    }

    // Validate date
    const validUntilDate = new Date(validUntil);
    if (isNaN(validUntilDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (validUntilDate < new Date()) {
      return res.status(400).json({ message: 'Valid until date must be in the future' });
    }

    // Validate services object
    if (typeof services !== 'object') {
      return res.status(400).json({ message: 'Services must be an object' });
    }

    // Ensure services has the required structure
    if (typeof services.all !== 'boolean' || 
        typeof services.categories !== 'object' || 
        typeof services.services !== 'object') {
      return res.status(400).json({ message: 'Invalid services object structure' });
    }

    try {
      // Convert services to proper format
      const formattedServices = {
        all: Boolean(services.all),
        categories: services.categories || {},
        services: services.services || {}
      };

      // Find the most recent discount
      let discount = await Discount.findOne().sort({ createdAt: -1 });

      // If there's an existing discount, revert prices to original
      if (discount) {
        const serviceIds = Object.keys(discount.services.services);
        const servicesToUpdate = await Service.find({
          _id: { $in: serviceIds }
        });

        for (const service of servicesToUpdate) {
          // Revert to original price
          service.price = service.originalPrice || service.price;
          await service.save();
        }
      }

      // Update prices for new discount
      const serviceIds = Object.keys(formattedServices.services);
      const servicesToUpdate = await Service.find({
        _id: { $in: serviceIds }
      });

      for (const service of servicesToUpdate) {
        // Store original price if not already stored
        if (!service.originalPrice) {
          service.originalPrice = service.price;
        }
        // Calculate and set new discounted price
        const discountAmount = (service.originalPrice * percentageNum) / 100;
        service.price = Math.round(service.originalPrice - discountAmount);
        await service.save();
      }

      if (discount) {
        // Update existing discount
        discount.name = name.trim();
        discount.percentage = percentageNum;
        discount.validUntil = validUntilDate;
        discount.services = formattedServices;
        await discount.save();
      } else {
        // Create new discount
        discount = new Discount({
          name: name.trim(),
          percentage: percentageNum,
          validUntil: validUntilDate,
          services: formattedServices
        });
        await discount.save();
      }

      console.log('Saved discount:', discount);
      res.json(discount);
    } catch (saveError) {
      console.error('Error saving discount:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          details: Object.values(saveError.errors).map(err => err.message)
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error updating discount:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Error updating discount',
      details: error.message
    });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  try {
    const discountId = req.params.id;
    console.log('Attempting to delete discount with ID:', discountId);
    
    if (!discountId) {
      console.log('No discount ID provided');
      return res.status(400).json({ message: 'Discount ID is required' });
    }

    // Find the discount by ID
    const discount = await Discount.findById(discountId);
    console.log('Found discount:', discount ? 'Yes' : 'No');
    
    if (!discount) {
      console.log('No discount found with ID:', discountId);
      return res.status(404).json({ message: 'No discount found to delete' });
    }

    try {
      // Revert prices to original for all affected services
      const serviceIds = Object.keys(discount.services.services);
      console.log('Affected service IDs:', serviceIds);

      const servicesToUpdate = await Service.find({
        _id: { $in: serviceIds }
      });
      console.log('Found services to update:', servicesToUpdate.length);

      // Update each service's price
      for (const service of servicesToUpdate) {
        console.log('Updating service:', service._id);
        if (service.originalPrice) {
          console.log('Reverting price from', service.price, 'to', service.originalPrice);
          service.price = service.originalPrice;
          service.originalPrice = undefined;
          await service.save();
        } else {
          console.log('No original price found for service:', service._id);
        }
      }

      // Delete the discount
      console.log('Deleting discount document');
      await discount.deleteOne();
      
      console.log('Discount deletion completed successfully');
      res.json({ 
        message: 'Discount deleted successfully',
        affectedServices: serviceIds.length
      });
    } catch (error) {
      console.error('Error during discount deletion:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteDiscount controller:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error deleting discount',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 