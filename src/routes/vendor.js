import express from 'express';
import {
  createVendor,
  getMyVendor,
  updateVendor,
  getVendor,
  getVendors,
} from '../controllers/vendorController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import {
  createVendorSchema,
  updateVendorSchema,
} from '../dtos/vendorDto.js';

const router = express.Router();

router.get('/me', authenticate, getMyVendor);
router.post('/', authenticate, validateRequest(createVendorSchema), createVendor);
router.put('/:id', authenticate, validateRequest(updateVendorSchema), updateVendor);
router.get('/:id', getVendor);
router.get('/', getVendors);

export default router;
