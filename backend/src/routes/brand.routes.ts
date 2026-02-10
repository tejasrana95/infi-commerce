import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    createBrandValidation,
    updateBrandValidation,
    bulkAction,
} from '../controllers/brand.controller';

const router = Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin-only routes
router.post('/bulk-action', authenticate, authorize('admin', 'super_admin'), bulkAction);
router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), validate(createBrandValidation), createBrand);
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), validate(updateBrandValidation), updateBrand);
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteBrand);

export default router;
