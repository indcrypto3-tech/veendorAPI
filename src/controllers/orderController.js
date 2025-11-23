import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Vendor from '../models/Vendor.js';
import { successResponse, paginatedResponse, paginationMeta } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Create a new order
 * POST /api/v1/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const { serviceId, scheduledAt, notes } = req.body;

    // Get service
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (service.status !== 'active') {
      throw new ValidationError('Service is not available');
    }

    // Create order
    const order = await Order.create({
      vendorId: service.vendorId,
      serviceId: service._id,
      userId: req.user.userId,
      status: 'pending',
      price: service.price,
      currency: service.currency,
      scheduledAt: new Date(scheduledAt),
      notes,
      paymentStatus: 'pending',
    });

    await order.populate(['vendorId', 'serviceId', 'userId']);

    logger.info({ orderId: order._id, userId: req.user.userId }, 'Order created');

    return successResponse(res, { order: order.toJSON() }, 201, 'Order created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/v1/orders/:id
 */
export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate(['vendorId', 'serviceId', 'userId']);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check access: user can see their own orders, vendors can see their orders
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    const isVendorOrder = vendor && order.vendorId._id.toString() === vendor._id.toString();
    const isUserOrder = order.userId._id.toString() === req.user.userId.toString();

    if (!isVendorOrder && !isUserOrder) {
      throw new ForbiddenError('You do not have access to this order');
    }

    return successResponse(res, { order: order.toJSON() }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders with pagination and filters
 * GET /api/v1/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      serviceId,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // If user is a vendor, show only their orders
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (vendor) {
      query.vendorId = vendor._id;
    } else {
      // Otherwise, show only user's orders
      query.userId = req.user.userId;
    }

    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;
    if (serviceId) query.serviceId = serviceId;

    // Get total count
    const total = await Order.countDocuments(query);

    // Get orders
    const orders = await Order.find(query)
      .populate(['vendorId', 'serviceId', 'userId'])
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const meta = paginationMeta(total, pageNum, limitNum);

    return paginatedResponse(res, orders.map(o => o.toJSON()), meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PATCH /api/v1/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Only vendor can update order status
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor || order.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenError('Only the vendor can update order status');
    }

    // Validate status transitions
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    order.status = status;

    if (status === 'completed') {
      order.completedAt = new Date();
    }

    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      if (cancellationReason) {
        order.cancellationReason = cancellationReason;
      }
    }

    await order.save();

    logger.info({ orderId: order._id, status }, 'Order status updated');

    return successResponse(res, { order: order.toJSON() }, 200, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};
