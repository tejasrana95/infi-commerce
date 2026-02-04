import { Router } from 'express';
import barcodeController from '../controllers/barcode.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All barcode routes require authentication and admin/store_admin role
router.use(authenticate);
router.use(authorize('admin', 'store_admin', 'super_admin'));

/**
 * @swagger
 * tags:
 *   name: Barcode
 *   description: Barcode generation and printing
 */

/**
 * @swagger
 * /api/barcode/generate:
 *   post:
 *     summary: Generate barcode for a product
 *     tags: [Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [CODE128, EAN13, QR]
 *     responses:
 *       200:
 *         description: Barcode generated successfully
 *       400:
 *         description: Missing productId
 *       500:
 *         description: Server error
 */
router.post('/generate', barcodeController.generateBarcode);

/**
 * @swagger
 * /api/barcode/bulk-generate:
 *   post:
 *     summary: Bulk generate barcodes
 *     tags: [Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Barcodes generated successfully
 *       400:
 *         description: Missing productIds
 *       500:
 *         description: Server error
 */
router.post('/bulk-generate', barcodeController.bulkGenerateBarcodes);

/**
 * @swagger
 * /api/barcode/download/{productId}:
 *   get:
 *     summary: Download barcode image
 *     tags: [Barcode]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Barcode image (PNG)
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Barcode not found
 *       500:
 *         description: Server error
 */
router.get('/download/:productId', barcodeController.downloadBarcode);

/**
 * @swagger
 * /api/barcode/print-batch:
 *   post:
 *     summary: Generate printable barcode PDF
 *     tags: [Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               printerType:
 *                 type: string
 *                 enum: [label, regular]
 *                 default: regular
 *               labelSize:
 *                 type: string
 *                 enum: [small, standard, medium, large, xl, shipping]
 *                 default: standard
 *               pageSize:
 *                 type: string
 *                 enum: [a4, letter, a5, legal]
 *                 default: letter
 *               layout:
 *                 type: string
 *                 enum: [2x3, 2x4, 3x4, 3x5, 4x6, 4x8]
 *                 default: 3x4
 *               format:
 *                 type: string
 *                 enum: [CODE128, EAN13, QR]
 *                 default: CODE128
 *               quantities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               repeatToFill:
 *                 type: boolean
 *                 default: false
 *               includeName:
 *                 type: boolean
 *                 default: true
 *               includePrice:
 *                 type: boolean
 *                 default: false
 *               includeSku:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing productIds
 *       500:
 *         description: Server error
 */
router.post('/print-batch', barcodeController.generateBarcodeSheet);

/**
 * @swagger
 * /api/barcode/print-options:
 *   get:
 *     summary: Get available print options
 *     tags: [Barcode]
 *     responses:
 *       200:
 *         description: Print options retrieved successfully
 */
router.get('/print-options', barcodeController.getPrintOptions);

/**
 * @swagger
 * /api/barcode/formats:
 *   get:
 *     summary: Get supported barcode formats
 *     tags: [Barcode]
 *     responses:
 *       200:
 *         description: Supported formats retrieved successfully
 */
router.get('/formats', barcodeController.getSupportedFormats);

export default router;
