import { Router } from 'express';
import {
    getAccountStatus,
    getProducts,
    checkProductReadiness,
    submitProduct,
    batchSubmitProducts,
    removeProduct,
    updateSupplementalData,
    batchUpdateSupplementalData,
    getFeedDiagnostics,
} from '../controllers/google-merchant.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkDemoMode } from '../middleware/checkDemoMode';

const router = Router();

// All routes require admin authentication
const adminAuth = [authenticate, authorize('admin', 'store_admin', 'super_admin')];

/**
 * @swagger
 * /api/google-merchant/{storeId}/status:
 *   get:
 *     summary: Get Google Merchant Center account status
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Merchant Center account status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:storeId/status', ...adminAuth, getAccountStatus);

/**
 * @swagger
 * /api/google-merchant/{storeId}/diagnostics:
 *   get:
 *     summary: Get Google Merchant Center feed diagnostics
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed diagnostics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:storeId/diagnostics', ...adminAuth, getFeedDiagnostics);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products:
 *   get:
 *     summary: Get products with Google Merchant sync status
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product sync status list
 *       401:
 *         description: Unauthorized
 */
router.get('/:storeId/products', ...adminAuth, getProducts);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/{productId}/readiness:
 *   get:
 *     summary: Check product readiness for Google Merchant submission
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product readiness report
 *       404:
 *         description: Product not found
 */
router.get('/:storeId/products/:productId/readiness', ...adminAuth, checkProductReadiness);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/{productId}/submit:
 *   post:
 *     summary: Submit a single product to Google Merchant Center
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product submitted successfully
 *       400:
 *         description: Submission error or validation failure
 */
router.post('/:storeId/products/:productId/submit', ...adminAuth, checkDemoMode, submitProduct);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/batch-submit:
 *   post:
 *     summary: Batch submit multiple products to Google Merchant Center
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
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
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Batch submission results
 */
router.post('/:storeId/products/batch-submit', ...adminAuth, checkDemoMode, batchSubmitProducts);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/{productId}:
 *   delete:
 *     summary: Remove a product from Google Merchant Center
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from Google Merchant Center
 */
router.delete('/:storeId/products/:productId', ...adminAuth, checkDemoMode, removeProduct);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/{productId}/supplemental:
 *   put:
 *     summary: Update supplemental data for a product in Google Merchant
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
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
 *         description: Supplemental data updated
 */
router.put('/:storeId/products/:productId/supplemental', ...adminAuth, checkDemoMode, updateSupplementalData);

/**
 * @swagger
 * /api/google-merchant/{storeId}/products/batch-supplemental:
 *   put:
 *     summary: Batch update supplemental data for products
 *     tags: [Google Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
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
 *         description: Supplemental data batch updated
 */
router.put('/:storeId/products/batch-supplemental', ...adminAuth, checkDemoMode, batchUpdateSupplementalData);

export default router;
