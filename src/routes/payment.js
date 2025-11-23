import express from 'express';
import {
  createPaymentIntent,
  handlePaymentWebhook,
} from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authenticate, createPaymentIntent);
router.post('/webhook', handlePaymentWebhook);

export default router;
