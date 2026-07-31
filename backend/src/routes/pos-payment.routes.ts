import { Router } from 'express';
import {
    generateQR,
    checkStatus,
    verifyManual,
    cancelQR,
} from '../controllers/pos-payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: POS Payment
 *   description: POS Payment operations (QR, etc.)
 */

/**
 * @swagger
 * /api/pos-payment/qr:
 *   post:
 *     summary: Generate a QR Code for POS Payment
 *     tags: [POS Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               orderId:
 *                 type: string
 *               description:
 *                 type: string
 *               customerDetails:
 *                 type: object
 *               posSessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: QR Code generated
 *       400:
 *         description: Missing required fields or configuration
 *       500:
 *         description: Server error
 */
router.post('/qr', generateQR);

/**
 * @swagger
 * /api/pos-payment/qr/{id}/status:
 *   get:
 *     summary: Check status of a QR Payment
 *     tags: [POS Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: gateway
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 *       400:
 *         description: Missing gateway or configId
 *       500:
 *         description: Server error
 */
router.get('/qr/:id/status', checkStatus);

/**
 * @swagger
 * /api/pos-payment/qr/{orderId}/verify:
 *   post:
 *     summary: Manually verify a Custom QR Payment
 *     tags: [POS Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - referenceNumber
 *             properties:
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/qr/:orderId/verify', verifyManual);

/**
 * @swagger
 * /api/pos-payment/qr/{id}/cancel:
 *   post:
 *     summary: Cancel a QR Code
 *     tags: [POS Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: gateway
 *         schema:
 *           type: string
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR Code cancelled
 *       500:
 *         description: Server error
 */
router.post('/qr/:id/cancel', cancelQR);

export default router;
