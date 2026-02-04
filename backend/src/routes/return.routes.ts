
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    checkEligibility,
    calculateRefund,
    createReturnRequest,
    adminCreateReturn,
    getReturnRequest,
    getUserReturnRequests,
    getAllReturnRequests,
    approveReturnRequest,
    rejectReturnRequest,
    schedulePickup,
    markReceived,
    processRefund,
    shipExchange,
    completeReturn,
    cancelReturn,
} from '../controllers/return.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Returns
 *   description: Return and exchange request management
 */

/**
 * @swagger
 * /api/returns/check-eligibility:
 *   post:
 *     summary: Check return eligibility for an order
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Eligibility status
 *       400:
 *         description: Missing orderId or storeId
 *       500:
 *         description: Server error
 */
router.post('/check-eligibility', authenticate, checkEligibility);

/**
 * @swagger
 * /api/returns/calculate:
 *   post:
 *     summary: Calculate refund amount for items
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Refund calculation details
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/calculate', authenticate, calculateRefund);

/**
 * @swagger
 * /api/returns/create:
 *   post:
 *     summary: Create return/exchange request (Customer)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *               - type
 *             properties:
 *               orderId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [return, exchange]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               reason:
 *                 type: string
 *               customerNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Return request created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/create', authenticate, createReturnRequest);

/**
 * @swagger
 * /api/returns/admin/create:
 *   post:
 *     summary: Create return/exchange request (Admin)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               type:
 *                 type: string
 *                 default: return
 *               autoApprove:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Return request created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
    '/admin/create',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    adminCreateReturn
);

/**
 * @swagger
 * /api/returns/user/me:
 *   get:
 *     summary: Get customer's return requests
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of return requests
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user/me', authenticate, getUserReturnRequests);

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get all return requests (Admin)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of return requests
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getAllReturnRequests
);

/**
 * @swagger
 * /api/returns/{id}:
 *   get:
 *     summary: Get return request details
 *     tags: [Returns]
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
 *         description: Return request details
 *       404:
 *         description: Return request not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, getReturnRequest);

/**
 * @swagger
 * /api/returns/{id}/approve:
 *   patch:
 *     summary: Approve return request
 *     tags: [Returns]
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
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request approved
 *       404:
 *         description: Return request not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/approve',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    approveReturnRequest
);

/**
 * @swagger
 * /api/returns/{id}/reject:
 *   patch:
 *     summary: Reject return request
 *     tags: [Returns]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request rejected
 *       404:
 *         description: Return request not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/reject',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    rejectReturnRequest
);

/**
 * @swagger
 * /api/returns/{id}/schedule-pickup:
 *   patch:
 *     summary: Schedule pickup
 *     tags: [Returns]
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
 *               - pickupDate
 *             properties:
 *               pickupDate:
 *                 type: string
 *               pickupAddress:
 *                 type: object
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pickup scheduled
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/schedule-pickup',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    schedulePickup
);

/**
 * @swagger
 * /api/returns/{id}/mark-received:
 *   patch:
 *     summary: Mark items as received
 *     tags: [Returns]
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
 *               - receivedItems
 *             properties:
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Items marked as received
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/mark-received',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    markReceived
);

/**
 * @swagger
 * /api/returns/{id}/process-refund:
 *   patch:
 *     summary: Process refund
 *     tags: [Returns]
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
 *               amount:
 *                 type: number
 *               refundMethod:
 *                 type: string
 *               sendNotification:
 *                 type: boolean
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/process-refund',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    processRefund
);

/**
 * @swagger
 * /api/returns/{id}/ship-exchange:
 *   patch:
 *     summary: Ship exchange order
 *     tags: [Returns]
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
 *               - trackingNumber
 *               - carrier
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *               trackingUrl:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exchange shipped
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/ship-exchange',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    shipExchange
);

/**
 * @swagger
 * /api/returns/{id}/complete:
 *   patch:
 *     summary: Complete return/exchange request
 *     tags: [Returns]
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
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request completed
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id/complete',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    completeReturn
);

/**
 * @swagger
 * /api/returns/{id}/cancel:
 *   patch:
 *     summary: Cancel return request
 *     tags: [Returns]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request cancelled
 *       500:
 *         description: Server error
 */
router.patch('/:id/cancel', authenticate, cancelReturn);

export default router;
