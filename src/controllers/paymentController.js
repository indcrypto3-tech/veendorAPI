import Notification from '../models/Notification.js';
import { successResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Create dummy payment intent
 * POST /api/v1/payments/create
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, amount, currency } = req.body;

    // Generate dummy payment intent
    const paymentIntent = {
      id: `pi_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: currency || 'USD',
      status: 'requires_payment_method',
      clientSecret: `pi_secret_${Date.now()}`,
      orderId,
      createdAt: new Date(),
    };

    logger.info({ paymentIntentId: paymentIntent.id, orderId }, 'Dummy payment intent created');

    return successResponse(
      res,
      { paymentIntent },
      200,
      'Payment intent created (dummy mode)'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle payment webhook (placeholder)
 * POST /api/v1/payments/webhook
 */
export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // TODO: Verify webhook signature
    // const event = stripe.webhooks.constructEvent(
    //   payload,
    //   signature,
    //   config.payment.webhookSecret
    // );

    logger.info({ event: payload.type }, 'Payment webhook received (dummy)');

    // Handle different event types
    // switch (payload.type) {
    //   case 'payment_intent.succeeded':
    //     // Update order payment status
    //     break;
    //   case 'payment_intent.payment_failed':
    //     // Handle failed payment
    //     break;
    // }

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
