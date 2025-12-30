import express from 'express';
import {
    createLayout,
    getLayouts,
    getLayoutById,
    updateLayout,
    deleteLayout,
    duplicateLayout,
    resolveLayout,
    createLayoutValidation,
    updateLayoutValidation
} from '../controllers/layout.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes for frontend
router.get('/', getLayouts);
router.get('/resolve', resolveLayout);  // Must be before /:id to avoid matching
router.get('/:id', getLayoutById);

// Protected routes for admin
router.post('/', authenticate, authorize('admin', 'super_admin'), validate(createLayoutValidation), createLayout);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), validate(updateLayoutValidation), updateLayout);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteLayout);
router.post('/:id/duplicate', authenticate, authorize('admin', 'super_admin'), duplicateLayout);

export default router;
