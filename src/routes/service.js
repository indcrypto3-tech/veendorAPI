import express from 'express';
import {
  createService,
  getService,
  getServices,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import {
  createServiceSchema,
  updateServiceSchema,
} from '../dtos/serviceDto.js';

const router = express.Router();

router.post('/', authenticate, validateRequest(createServiceSchema), createService);
router.get('/:id', getService);
router.get('/', getServices);
router.put('/:id', authenticate, validateRequest(updateServiceSchema), updateService);
router.delete('/:id', authenticate, deleteService);

export default router;
