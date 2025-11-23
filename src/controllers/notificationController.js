import Notification from '../models/Notification.js';
import { successResponse, paginatedResponse, paginationMeta } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, read, type } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user.userId };
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;

    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const meta = paginationMeta(total, pageNum, limitNum);

    return paginatedResponse(res, notifications.map(n => n.toJSON()), meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return successResponse(res, { notification: notification.toJSON() }, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Send push notification (stub)
 * POST /api/v1/notifications/push
 */
export const sendPushNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, data } = req.body;

    // Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'system',
      data: data || {},
    });

    // TODO: Send actual push notification via FCM/APNs
    logger.info({ notificationId: notification._id, userId }, 'Push notification sent (stub)');

    return successResponse(
      res,
      { notification: notification.toJSON() },
      200,
      'Push notification sent (stub)'
    );
  } catch (error) {
    next(error);
  }
};
