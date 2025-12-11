import { Router } from 'express';
import {
    createSale,
    getSales,
    getActiveSales,
    getSaleById,
    updateSale,
    deleteSale,
    applySale,
    createSaleValidation,
} from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/active', getActiveSales);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    validate(createSaleValidation),
    createSale
);

router.get(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getSales
);

router.get(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getSaleById
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    updateSale
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteSale
);

router.post(
    '/:id/apply',
    authenticate,
    authorize('admin', 'super_admin'),
    applySale
);

export default router;
