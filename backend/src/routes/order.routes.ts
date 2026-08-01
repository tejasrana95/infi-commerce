import { Router } from 'express';
import {
    createOrder,
    initializePayment,
    getOrderById,
    getLatestPOSOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    handlePaymentSuccess,
    handlePaymentFailed,
    trackOrder,
    adminCreateOrder,
    adminUpdateOrder,
    createOrderValidation,
    updateOrderStatusValidation,
    adminCreateOrderValidation,
    adminUpdateOrderValidation,
    downloadInvoice,
    downloadPackingSlip,
    updateTracking,
    updateTrackingValidation,
    requestReturn,
    updateReturnStatus,
    processRefund,
    requestRefund,
    updateRefundStatus,
    deleteOrder,
    bulkDeleteOrders,
    bulkUpdateOrderStatus,
} from '../controllers/order.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and processing
 */

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - shippingAddress
 *               - billingAddress
 *               - paymentMethod
 *             properties:
 *               storeId:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   address1:
 *                     type: string
 *                   address2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   phone:
 *                     type: string
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *                 enum: [razorpay, stripe, paypal, cod]
 *               couponCode:
 *                 type: string
 *               customerNote:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or cart empty
 *       401:
 *         description: Unauthorized
 */
router.post('/create', optionalAuth, validate(createOrderValidation), createOrder);

/**
 * @swagger
 * /api/orders/admin/create:
 *   post:
 *     summary: Create order directly (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - items
 *               - shippingAddress
 *             properties:
 *               storeId:
 *                 type: string
 *               guestEmail:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/admin/create',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin', 'pos_user'),
    validate(adminCreateOrderValidation),
    adminCreateOrder
);

/**
 * @swagger
 * /api/orders/bulk-status:
 *   post:
 *     summary: Bulk update order status without triggering notifications
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *               - status
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orders status updated successfully
 */
router.post(
    '/bulk-status',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    bulkUpdateOrderStatus
);

/**
 * @swagger
 * /api/orders/bulk-delete:
 *   post:
 *     summary: Bulk delete orders and related info (Super Admin only, password required)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *               - password
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orders deleted successfully
 *       400:
 *         description: Invalid password or missing order IDs
 *       403:
 *         description: Only Super Admin can delete orders
 */
router.post(
    '/bulk-delete',
    authenticate,
    authorize('super_admin'),
    bulkDeleteOrders
);


/**
 * @swagger
 * /api/orders/admin/{id}:
 *   put:
 *     summary: Update order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               paymentStatus:
 *                 type: string
 *               status:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *               tax:
 *                 type: number
 *               discount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put(
    '/admin/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(adminUpdateOrderValidation),
    adminUpdateOrder
);


/**
 * @swagger
 * /api/orders/{id}/initialize-payment:
 *   post:
 *     summary: Initialize payment with gateway
 *     tags: [Orders]
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
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     paymentId:
 *                       type: string
 *                     gatewayType:
 *                       type: string
 *                     razorpay:
 *                       type: object
 *                       description: Razorpay-specific data (if Razorpay selected)
 *                     stripe:
 *                       type: object
 *                       description: Stripe-specific data (if Stripe selected)
 *                     paypal:
 *                       type: object
 *                       description: PayPal-specific data (if PayPal selected)
 *       400:
 *         description: Order already paid
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/initialize-payment', optionalAuth, initializePayment);

/**
 * @swagger
 * /api/orders/user/me:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: List of user's orders
 *       401:
 *         description: Unauthorized
 */
router.get('/user/me', authenticate, getUserOrders);

/**
 * @swagger
 * /api/orders/pos/latest:
 *   get:
 *     summary: Get latest POS order by customer email and posSessionId
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: customerEmail
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: posSessionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest POS order details
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: No matching order found
 */
router.get('/pos/latest', getLatestPOSOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all orders
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize('admin', 'store_admin', 'super_admin', 'pos_user'), getAllOrders);

/**
 * @swagger
 * /api/orders/{orderNumber}/track:
 *   get:
 *     summary: Track order by order number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order tracking information
 *       404:
 *         description: Order not found
 */
router.get('/:orderNumber/track', trackOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.get('/:id', optionalAuth, getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled, refunded]
 *               trackingNumber:
 *                 type: string
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.put(
    '/:id/status',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateOrderStatusValidation),
    updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
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
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order in current status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', optionalAuth, cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/payment-success:
 *   post:
 *     summary: Handle successful payment
 *     tags: [Orders]
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
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       404:
 *         description: Order not found
 */
router.post('/:id/payment-success', optionalAuth, handlePaymentSuccess);

/**
 * @swagger
 * /api/orders/{id}/payment-failed:
 *   post:
 *     summary: Handle failed payment
 *     tags: [Orders]
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
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment status updated
 *       404:
 *         description: Order not found
 */
router.post('/:id/payment-failed', authenticate, handlePaymentFailed);

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Download invoice PDF
 * @access  Private (Owner/Admin)
 */
router.get('/:id/invoice', optionalAuth, downloadInvoice);

/**
 * @route   GET /api/orders/:id/packing-slip
 * @desc    Download packing slip PDF
 * @access  Private (Admin only)
 */
router.get(
    '/:id/packing-slip',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    downloadPackingSlip
);

/**
 * @route   PATCH /api/orders/:id/tracking
 * @desc    Update tracking information
 * @access  Private (Admin only)
 */
router.patch(
    '/:id/tracking',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateTrackingValidation),
    updateTracking
);

router.post('/:id/return-request', authenticate, requestReturn);

router.patch(
    '/:id/return-status',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateReturnStatus
);

router.patch(
    '/:id/refund',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    processRefund
);

router.patch(
    '/:id/refund-status',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateRefundStatus
);

router.post('/:id/refund-request', authenticate, requestRefund);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order and all related info (Super Admin only, password required)
 *     tags: [Orders]
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
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Password required or invalid password
 *       403:
 *         description: Only Super Admin can delete orders
 *       404:
 *         description: Order not found
 */
router.delete(
    '/:id',
    authenticate,
    authorize('super_admin'),
    deleteOrder
);

export default router;
