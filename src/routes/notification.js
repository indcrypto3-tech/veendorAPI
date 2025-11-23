import express from 'express';
import {
  getNotifications,
  markAsRead,
  sendPushNotification,
} from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.post('/push', authenticate, sendPushNotification);

export default router;
