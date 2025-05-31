// backend/controllers/categoryController.js
import ServiceCategory from '../models/service.category.model.js';

// Migrate existing services to new schema
const migrateServices = async () => {
  try {
    const categories = await ServiceCategory.find();
    for (const category of categories) {
      let needsUpdate = false;
      category.services = category.services.map(service => {
        // If service has old schema (prices object), convert to new schema
        if (service.prices) {
          needsUpdate = true;
          return {
            name: service.name,
            price: service.prices.Normal || 0,
            description: service.description || ''
          };
        }
        return service;
      });
      if (needsUpdate) {
        await category.save();
      }
    }
    console.log('Services migration completed');
  } catch (err) {
    console.error('Error migrating services:', err);
  }
};

// Run migration on startup
migrateServices();

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const category = new ServiceCategory({ name: req.body.name, services: [] });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a service to a category
export const addService = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Service name is required' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ message: 'Service price is required' });
    }

    // Convert price to number and validate
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    const category = await ServiceCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Create new service object
    const newService = {
      name: name.trim(),
      price: numericPrice,
      description: description ? description.trim() : ''
    };

    // Add service to category
    category.services.push(newService);
    
    // Save the category with the new service
    const updatedCategory = await category.save();
    
    // Return the newly added service
    const addedService = updatedCategory.services[updatedCategory.services.length - 1];
    res.status(201).json(addedService);
  } catch (err) {
    console.error('Error adding service:', err);
    res.status(400).json({ message: err.message });
  }
};

// Update a service within a category
export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, price, description } = req.body;
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const service = category.services.id(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (name) service.name = name;
    if (price !== undefined) service.price = Number(price);
    if (description !== undefined) service.description = description;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a service from a category
export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const service = category.services.id(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    category.services.pull(serviceId);
    await category.save();
    
    res.json({ message: 'Service deleted', category });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(400).json({ message: err.message });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    await ServiceCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
