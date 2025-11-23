import Service from '../models/Service.js';
import Vendor from '../models/Vendor.js';
import slugify from 'slugify';
import { successResponse, paginatedResponse, paginationMeta } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Create a new service
 * POST /api/v1/services
 */
export const createService = async (req, res, next) => {
  try {
    const { title, description, price, currency, durationMinutes, category, images } = req.body;

    // Get vendor for current user
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      throw new ValidationError('You must create a vendor profile first');
    }

    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await Service.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const service = await Service.create({
      vendorId: vendor._id,
      title,
      slug,
      description,
      price,
      currency: currency || 'USD',
      durationMinutes: durationMinutes || 60,
      category,
      images: images || [],
      status: 'active',
    });

    logger.info({ serviceId: service._id, vendorId: vendor._id }, 'Service created');

    return successResponse(res, { service: service.toJSON() }, 201, 'Service created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID
 * GET /api/v1/services/:id
 */
export const getService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id).populate('vendorId', 'businessName phone');

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    return successResponse(res, { service: service.toJSON() }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all services with pagination and filters
 * GET /api/v1/services
 */
export const getServices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      vendorId,
      status,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    if (vendorId) query.vendorId = vendorId;
    if (status) query.status = status;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Get total count
    const total = await Service.countDocuments(query);

    // Get services
    const services = await Service.find(query)
      .populate('vendorId', 'businessName phone')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const meta = paginationMeta(total, pageNum, limitNum);

    return paginatedResponse(res, services.map(s => s.toJSON()), meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Update service
 * PUT /api/v1/services/:id
 */
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, currency, durationMinutes, category, status, images } = req.body;

    const service = await Service.findById(id);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Get vendor and check ownership
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor || service.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenError('You can only update your own services');
    }

    // Update fields
    if (title) {
      service.title = title;
      // Regenerate slug if title changed
      const baseSlug = slugify(title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (await Service.findOne({ slug, _id: { $ne: service._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      service.slug = slug;
    }
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (currency) service.currency = currency;
    if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
    if (category !== undefined) service.category = category;
    if (status) service.status = status;
    if (images) service.images = images;

    await service.save();

    logger.info({ serviceId: service._id }, 'Service updated');

    return successResponse(res, { service: service.toJSON() }, 200, 'Service updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service
 * DELETE /api/v1/services/:id
 */
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Get vendor and check ownership
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor || service.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenError('You can only delete your own services');
    }

    // Soft delete by setting status to archived
    service.status = 'archived';
    await service.save();

    logger.info({ serviceId: service._id }, 'Service deleted');

    return successResponse(res, null, 200, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};
