import { Router } from 'express';
import {
    createShippingRule,
    getShippingRules,
    getShippingRuleById,
    updateShippingRule,
    deleteShippingRule,
    calculateShipping,
    calculateSmartShipping,
    applyShippingToCart,
    getCartSummary,
    createShippingRuleValidation,
    calculateShippingValidation,
    calculateSmartShippingValidation,
} from '../controllers/shipping.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/calculate', validate(calculateShippingValidation), calculateShipping);
router.post('/calculate-smart', validate(calculateSmartShippingValidation), calculateSmartShipping);
router.post('/apply', applyShippingToCart);
router.get('/cart/summary', getCartSummary);

// Admin routes - Shipping rule management
router.post(
    '/rules',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createShippingRuleValidation),
    createShippingRule
);

router.get(
    '/rules',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getShippingRules
);

router.get(
    '/rules/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getShippingRuleById
);

router.put(
    '/rules/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateShippingRule
);

router.delete(
    '/rules/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteShippingRule
);

export default router;
