import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { authenticate, authorize } from '../middleware/auth';
import Product from '../models/Product';
import posPaymentRoutes from './pos-payment.routes';
import posSyncController from '../controllers/pos-sync.controller';

const router = Router();

// All POS routes require authentication and pos_user/store_admin/super_admin role
router.use(authenticate);
router.use(authorize('pos_user', 'store_admin', 'super_admin'));

/**
 * @swagger
 * tags:
 *   name: POS
 *   description: Point of Sale system operations
 */

// Mount POS Payment Routes (e.g. /api/pos/payment/qr)
router.use('/payment', posPaymentRoutes);

// Sync Status

/**
 * @swagger
 * /api/pos/sync-status:
 *   get:
 *     summary: Get POS sync status
 *     tags: [POS]
 *     responses:
 *       200:
 *         description: Sync status details
 */
router.get('/sync-status', posSyncController.getSyncStatus);

// Session Management

/**
 * @swagger
 * /api/pos/session/start:
 *   post:
 *     summary: Start a new POS session
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openingCash
 *             properties:
 *               openingCash:
 *                 type: number
 *     responses:
 *       201:
 *         description: Session started successfully
 *       400:
 *         description: Missing opening cash or store ID
 *       500:
 *         description: Server error
 */
router.post('/session/start', posController.startSession);

/**
 * @swagger
 * /api/pos/session/end:
 *   post:
 *     summary: End POS session
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - closingCash
 *             properties:
 *               sessionId:
 *                 type: string
 *               closingCash:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/session/end', posController.endSession);

/**
 * @swagger
 * /api/pos/session/current:
 *   get:
 *     summary: Get current active session
 *     tags: [POS]
 *     responses:
 *       200:
 *         description: Current session details
 *       500:
 *         description: Server error
 */
router.get('/session/current', posController.getCurrentSession);

/**
 * @swagger
 * /api/pos/session/history:
 *   get:
 *     summary: Get session history
 *     tags: [POS]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: all
 *     responses:
 *       200:
 *         description: Session history list
 *       500:
 *         description: Server error
 */
router.get('/session/history', posController.getSessionHistory);


// Dashboard

/**
 * @swagger
 * /api/pos/dashboard:
 *   get:
 *     summary: Get POS dashboard data
 *     tags: [POS]
 *     responses:
 *       200:
 *         description: Dashboard data (sales, orders)
 *       500:
 *         description: Server error
 */
router.get('/dashboard', posController.getDashboard);

// Receipt

/**
 * @swagger
 * /api/pos/receipt/{orderId}:
 *   get:
 *     summary: Get receipt data for an order
 *     tags: [POS]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt data
 *       500:
 *         description: Server error
 */
router.get('/receipt/:orderId', posController.getReceiptData);

// Password Verification

/**
 * @swagger
 * /api/pos/verify-password:
 *   post:
 *     summary: Verify user password for sensitive actions
 *     tags: [POS]
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
 *         description: Password verification result
 *       400:
 *         description: Missing password
 *       500:
 *         description: Server error
 */
router.post('/verify-password', posController.verifyPassword);

// Held Orders Management

/**
 * @swagger
 * /api/pos/held-orders:
 *   post:
 *     summary: Create a held order
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerIdentifier
 *               - items
 *               - subtotal
 *               - tax
 *               - total
 *             properties:
 *               customerIdentifier:
 *                 type: string
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               subtotal:
 *                 type: number
 *               tax:
 *                 type: number
 *               total:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Held order created
 *       400:
 *         description: No active session or missing fields
 *       500:
 *         description: Server error
 */
router.post('/held-orders', posController.createHeldOrder);

/**
 * @swagger
 * /api/pos/held-orders:
 *   get:
 *     summary: Get all held orders
 *     tags: [POS]
 *     parameters:
 *       - in: query
 *         name: assignedToMe
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of held orders
 *       500:
 *         description: Server error
 */
router.get('/held-orders', posController.getHeldOrders);

/**
 * @swagger
 * /api/pos/held-orders/{id}/transfer:
 *   put:
 *     summary: Transfer held order to another user
 *     tags: [POS]
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
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Held order transferred
 *       400:
 *         description: Invalid target user
 *       404:
 *         description: Held order not found
 *       500:
 *         description: Server error
 */
router.put('/held-orders/:id/transfer', posController.transferHeldOrder);

/**
 * @swagger
 * /api/pos/held-orders/{id}/resume:
 *   put:
 *     summary: Resume a held order
 *     tags: [POS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Held order resumed
 *       404:
 *         description: Held order not found
 *       500:
 *         description: Server error
 */
router.put('/held-orders/:id/resume', posController.resumeHeldOrder);

/**
 * @swagger
 * /api/pos/held-orders/{id}:
 *   delete:
 *     summary: Delete (cancel) a held order
 *     tags: [POS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Held order deleted
 *       404:
 *         description: Held order not found
 *       500:
 *         description: Server error
 */
router.delete('/held-orders/:id', posController.deleteHeldOrder);

// Get POS Users (for transfer functionality)

/**
 * @swagger
 * /api/pos/users:
 *   get:
 *     summary: Get all POS users for current store
 *     tags: [POS]
 *     responses:
 *       200:
 *         description: List of POS users
 *       500:
 *         description: Server error
 */
router.get('/users', posController.getPOSUsers);

// Order Return Management

/**
 * @swagger
 * /api/pos/orders/search:
 *   get:
 *     summary: Search orders for return
 *     tags: [POS]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: Search query too short
 *       500:
 *         description: Server error
 */
router.get('/orders/search', posController.searchOrders);

/**
 * @swagger
 * /api/pos/orders/calculate-refund:
 *   post:
 *     summary: Calculate refund amount
 *     tags: [POS]
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
 *         description: Refund calculation result
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Server error
 */
router.post('/orders/calculate-refund', posController.calculateRefund);

/**
 * @swagger
 * /api/pos/orders/return:
 *   post:
 *     summary: Process order return
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *               - refundAmount
 *               - refundMethod
 *               - reason
 *             properties:
 *               orderId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               refundAmount:
 *                 type: number
 *               refundMethod:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return processed successfully
 *       400:
 *         description: Missing fields or no active session
 *       500:
 *         description: Server error
 */
router.post('/orders/return', posController.processReturn);

/**
 * @swagger
 * /api/pos/products/by-sku:
 *   get:
 *     summary: Lookup product by exact SKU or barcode
 *     tags: [POS]
 *     parameters:
 *       - in: query
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       400:
 *         description: Missing SKU
 *       404:
 *         description: Product not found
 */
router.get('/products/by-sku', authenticate, async (req: any, res: any) => {
  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ success: false, message: 'SKU is required' });
  }

  const product = await Product.findOne({
    $or: [
      { sku: sku },
      { barcode: sku },
    ],
    storeId: req.user.storeId,
    isActive: true,
  }).populate('categoryIds brand');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `No product found with SKU/barcode: ${sku}`
    });
  }

  res.json({ success: true, product });
});

export default router;
