import Vendor from '../models/Vendor.js';
import { successResponse, paginatedResponse, paginationMeta } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Create vendor profile
 * POST /api/v1/vendors
 */
export const createVendor = async (req, res, next) => {
  try {
    const { businessName, description, address, phone, email } = req.body;

    // Check if vendor already exists for this user
    const existingVendor = await Vendor.findOne({ userId: req.user.userId });
    if (existingVendor) {
      throw new ValidationError('Vendor profile already exists');
    }

    const vendor = await Vendor.create({
      userId: req.user.userId,
      businessName,
      description,
      address,
      phone,
      email,
      status: 'pending',
    });

    logger.info({ vendorId: vendor._id, userId: req.user.userId }, 'Vendor created');

    return successResponse(res, { vendor: vendor.toJSON() }, 201, 'Vendor created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current vendor profile
 * GET /api/v1/vendors/me
 */
export const getMyVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId }).populate('userId', 'phone name');

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }

    return successResponse(res, { vendor: vendor.toJSON() }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update vendor profile
 * PUT /api/v1/vendors/:id
 */
export const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { businessName, description, address, phone, email } = req.body;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    // Ensure vendor can only update their own profile
    if (vendor.userId.toString() !== req.user.userId.toString()) {
      throw new ForbiddenError('You can only update your own vendor profile');
    }

    // Update fields
    if (businessName) vendor.businessName = businessName;
    if (description !== undefined) vendor.description = description;
    if (address) vendor.address = { ...vendor.address, ...address };
    if (phone) vendor.phone = phone;
    if (email !== undefined) vendor.email = email;

    await vendor.save();

    logger.info({ vendorId: vendor._id }, 'Vendor updated');

    return successResponse(res, { vendor: vendor.toJSON() }, 200, 'Vendor updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor by ID
 * GET /api/v1/vendors/:id
 */
export const getVendor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).populate('userId', 'phone name');

    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    return successResponse(res, { vendor: vendor.toJSON() }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all vendors with pagination and filters
 * GET /api/v1/vendors
 */
export const getVendors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Vendor.countDocuments(query);

    // Get vendors
    const vendors = await Vendor.find(query)
      .populate('userId', 'phone name')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const meta = paginationMeta(total, pageNum, limitNum);

    return paginatedResponse(res, vendors.map(v => v.toJSON()), meta);
  } catch (error) {
    next(error);
  }
};
