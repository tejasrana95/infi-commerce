import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
    getTaxRates,
    getTaxRateById,
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
    createTaxRateValidation,
    updateTaxRateValidation,
} from '../controllers/taxRate.controller';

const router = Router();

// Public routes (for product forms to fetch tax rates)
router.get('/', getTaxRates);
router.get('/:id', getTaxRateById);

// Admin-only routes
router.post('/', authenticate, authorize('admin', 'super_admin'), validate(createTaxRateValidation), createTaxRate);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), validate(updateTaxRateValidation), updateTaxRate);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteTaxRate);

export default router;
