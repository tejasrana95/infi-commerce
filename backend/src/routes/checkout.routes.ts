import { Router } from 'express';
import {
    validateCheckout,
    getAddresses,
    addAddress,
    getShippingMethods,
    calculateTax,
    applyCoupon,
    removeCoupon,
    validateCouponPOS,

    createOrder,
    addAddressValidation,
    applyCouponValidation,
} from '../controllers/checkout.controller';
import { optionalAuth, authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Checkout validation
router.post('/validate', optionalAuth, validateCheckout);

// Address management (requires authentication)
router.get('/addresses', authenticate, getAddresses);
router.post('/addresses', authenticate, validate(addAddressValidation), addAddress);

// Shipping methods
router.post('/shipping-methods', optionalAuth, getShippingMethods);

// Tax calculation
router.post('/calculate-tax', optionalAuth, calculateTax);

// Coupon management
router.post('/apply-coupon', optionalAuth, validate(applyCouponValidation), applyCoupon);
router.post('/validate-coupon-pos', optionalAuth, validateCouponPOS);
router.delete('/remove-coupon', optionalAuth, removeCoupon);

// Payment methods


// Create order
router.post('/create-order', optionalAuth, createOrder);

export default router;
