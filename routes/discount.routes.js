import express from 'express';
import { getDiscounts, updateDiscount, deleteDiscount } from '../controllers/discount.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getDiscounts);
router.put('/', verifyToken, isAdmin, updateDiscount);
router.delete('/', verifyToken, isAdmin, deleteDiscount);

export default router; 