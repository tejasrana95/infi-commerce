import { Router } from 'express';
import {
    createGatewayConfig,
    getGatewayConfigs,
    getGatewayConfigById,
    updateGatewayConfig,
    deleteGatewayConfig,
    getAvailableGateways,
    testGatewayConnection,
    getSupportedGateways,
    createGatewayConfigValidation,
    updateGatewayConfigValidation,
} from '../controllers/payment-gateway.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment Gateways
 *   description: Payment gateway configuration and management
 */

/**
 * @swagger
 * /api/payment-gateways/supported:
 *   get:
 *     summary: Get list of supported payment gateways
 *     tags: [Payment Gateways]
 *     responses:
 *       200:
 *         description: List of supported gateways
 */
router.get('/supported', getSupportedGateways);

/**
 * @swagger
 * /api/payment-gateways/available:
 *   post:
 *     summary: Get available payment gateways for checkout
 *     tags: [Payment Gateways]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - country
 *             properties:
 *               storeId:
 *                 type: string
 *               country:
 *                 type: string
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Available payment gateways
 */
router.post('/available', getAvailableGateways);

/**
 * @swagger
 * /api/payment-gateways:
 *   post:
 *     summary: Create payment gateway configuration
 *     tags: [Payment Gateways]
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
 *               - gatewayType
 *               - gatewayName
 *               - credentials
 *             properties:
 *               storeId:
 *                 type: string
 *               gatewayType:
 *                 type: string
 *                 enum: [razorpay, stripe, paypal]
 *               gatewayName:
 *                 type: string
 *               geoGroupId:
 *                 type: string
 *               credentials:
 *                 type: object
 *               isTestMode:
 *                 type: boolean
 *               priority:
 *                 type: number
 *               features:
 *                 type: object
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gateway configured successfully
 */
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin'),
    validate(createGatewayConfigValidation),
    createGatewayConfig
);

/**
 * @swagger
 * /api/payment-gateways:
 *   get:
 *     summary: Get all payment gateway configurations
 *     tags: [Payment Gateways]
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
 *         name: gatewayType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of gateway configurations
 */
router.get('/', authenticate, authorize('admin', 'store_admin'), getGatewayConfigs);

/**
 * @swagger
 * /api/payment-gateways/test-connection:
 *   post:
 *     summary: Test payment gateway connection
 *     tags: [Payment Gateways]
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
 *               - gatewayType
 *             properties:
 *               storeId:
 *                 type: string
 *               gatewayType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection test result
 */
router.post(
    '/test-connection',
    authenticate,
    authorize('admin', 'store_admin'),
    testGatewayConnection
);

/**
 * @swagger
 * /api/payment-gateways/{id}:
 *   get:
 *     summary: Get payment gateway configuration by ID
 *     tags: [Payment Gateways]
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
 *         description: Gateway configuration details
 */
router.get('/:id', authenticate, authorize('admin', 'store_admin'), getGatewayConfigById);

/**
 * @swagger
 * /api/payment-gateways/{id}:
 *   put:
 *     summary: Update payment gateway configuration
 *     tags: [Payment Gateways]
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
 *         description: Gateway configuration updated
 */
router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin'),
    validate(updateGatewayConfigValidation),
    updateGatewayConfig
);

/**
 * @swagger
 * /api/payment-gateways/{id}:
 *   delete:
 *     summary: Delete payment gateway configuration
 *     tags: [Payment Gateways]
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
 *         description: Gateway configuration deleted
 */
router.delete('/:id', authenticate, authorize('admin', 'store_admin'), deleteGatewayConfig);

export default router;
