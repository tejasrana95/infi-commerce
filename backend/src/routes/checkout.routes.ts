
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

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Checkout process, cart validation, shipping, and tax calculation
 */

/**
 * @swagger
 * /api/checkout/validate:
 *   post:
 *     summary: Validate cart before checkout
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Validation result with cart details
 *       400:
 *         description: Cart empty or invalid
 *       500:
 *         description: Server error
 */
router.post('/validate', optionalAuth, validateCheckout);

/**
 * @swagger
 * /api/checkout/addresses:
 *   get:
 *     summary: Get saved addresses for logged-in user
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved addresses
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/addresses', authenticate, getAddresses);

/**
 * @swagger
 * /api/checkout/addresses:
 *   post:
 *     summary: Add new address for logged-in user
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - firstName
 *               - lastName
 *               - address1
 *               - city
 *               - state
 *               - country
 *               - postalCode
 *               - phone
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shipping, billing]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/addresses', authenticate, validate(addAddressValidation), addAddress);

/**
 * @swagger
 * /api/checkout/shipping-methods:
 *   post:
 *     summary: Calculate available shipping methods
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *     responses:
 *       200:
 *         description: Available shipping methods
 *       400:
 *         description: Missing address or cart empty
 *       500:
 *         description: Server error
 */
router.post('/shipping-methods', optionalAuth, getShippingMethods);

/**
 * @swagger
 * /api/checkout/calculate-tax:
 *   post:
 *     summary: Calculate tax based on shipping address
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tax calculation details
 *       400:
 *         description: Missing address or cart empty
 *       500:
 *         description: Server error
 */
router.post('/calculate-tax', optionalAuth, calculateTax);

/**
 * @swagger
 * /api/checkout/apply-coupon:
 *   post:
 *     summary: Apply coupon code
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Invalid coupon
 *       500:
 *         description: Server error
 */
router.post('/apply-coupon', optionalAuth, validate(applyCouponValidation), applyCoupon);

/**
 * @swagger
 * /api/checkout/validate-coupon-pos:
 *   post:
 *     summary: Validate coupon for POS
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *               - subtotal
 *             properties:
 *               couponCode:
 *                 type: string
 *               subtotal:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 *       400:
 *         description: Invalid coupon
 *       500:
 *         description: Server error
 */
router.post('/validate-coupon-pos', optionalAuth, validateCouponPOS);

/**
 * @swagger
 * /api/checkout/remove-coupon:
 *   delete:
 *     summary: Remove applied coupon
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.delete('/remove-coupon', optionalAuth, removeCoupon);

/**
 * @swagger
 * /api/checkout/create-order:
 *   post:
 *     summary: Create order from checkout
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - billingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               currency:
 *                 type: string
 *               customerNote:
 *                 type: string
 *               guestEmail:
 *                 type: string
 *               saveAddress:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/create-order', optionalAuth, createOrder);

export default router;
