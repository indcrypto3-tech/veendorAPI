import express from 'express';
import {
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../dtos/orderDto.js';

const router = express.Router();

router.post('/', authenticate, validateRequest(createOrderSchema), createOrder);
router.get('/:id', authenticate, getOrder);
router.get('/', authenticate, getOrders);
router.patch('/:id/status', authenticate, validateRequest(updateOrderStatusSchema), updateOrderStatus);

export default router;
