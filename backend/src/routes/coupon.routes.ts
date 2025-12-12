import { Router } from 'express';
import {
    createCoupon,
    getCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    applyCoupon,
    getActiveCoupons,
    createCouponValidation,
    updateCouponValidation,
    validateCouponValidation,
} from '../controllers/coupon.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon management and validation
 */

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - storeId
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *               storeId:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [flat, percentage]
 *               discountValue:
 *                 type: number
 *               applyTo:
 *                 type: string
 *                 enum: [store, categories]
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               minCartValue:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               usageLimit:
 *                 type: number
 *               perCustomerLimit:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin'),
    validate(createCouponValidation),
    createCoupon
);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of coupons
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, authorize('admin', 'store_admin'), getCoupons);

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - storeId
 *             properties:
 *               code:
 *                 type: string
 *               storeId:
 *                 type: string
 *               cartId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon validation result
 *       400:
 *         description: Invalid coupon
 *       404:
 *         description: Coupon not found
 */
router.post('/validate', optionalAuth, validate(validateCouponValidation), validateCoupon);

/**
 * @swagger
 * /api/coupons/store/{storeId}/active:
 *   get:
 *     summary: Get all active coupons for a store
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active coupons
 */
router.get('/store/:storeId/active', getActiveCoupons);

/**
 * @swagger
 * /api/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon details
 *       404:
 *         description: Coupon not found
 */
router.get('/:id', authenticate, authorize('admin', 'store_admin'), getCouponById);

/**
 * @swagger
 * /api/coupons/{id}:
 *   put:
 *     summary: Update coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       404:
 *         description: Coupon not found
 */
router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin'),
    validate(updateCouponValidation),
    updateCoupon
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       404:
 *         description: Coupon not found
 */
router.delete('/:id', authenticate, authorize('admin', 'store_admin'), deleteCoupon);

/**
 * @swagger
 * /api/coupons/{id}/apply:
 *   post:
 *     summary: Apply coupon to cart
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Coupon cannot be applied
 */
router.post('/:id/apply', authenticate, applyCoupon);

export default router;
