// backend/routes/categoryRoutes.js
import express from 'express';
import {
  createCategory,
  getCategories,
  deleteCategory,
  addService,
  updateService,
  deleteService
} from '../controllers/category.controller.js';

const router = express.Router();

// Category CRUD
router.post('/', createCategory);
router.get('/', getCategories);
router.delete('/:id', deleteCategory);

// Service CRUD within Category
router.post('/:id/services', addService);
router.put('/:id/services/:serviceId', updateService);
router.delete('/:id/services/:serviceId', deleteService);

export default router;
