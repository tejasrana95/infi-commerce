
import { Router, RequestHandler } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import * as backupController from '../controllers/backup.controller';

const router = Router();

// Configure multer for memory storage (files stored in buffer)
const multerConfig = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Accept only Excel files
        if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/gzip' || // For MongoDB dumps
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls') ||
            file.originalname.endsWith('.gz')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) or gzip files (.gz) are allowed'));
        }
    }
});

// Cast to RequestHandler to avoid type conflicts between @types/express versions
const upload = (fieldName: string): RequestHandler => multerConfig.single(fieldName) as unknown as RequestHandler;

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Data backup and restore operations (Super Admin)
 */

/**
 * @swagger
 * /api/backup/export/products:
 *   post:
 *     summary: Export products to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/products', backupController.exportProducts);

/**
 * @swagger
 * /api/backup/export/orders:
 *   post:
 *     summary: Export orders to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/orders', backupController.exportOrders);

/**
 * @swagger
 * /api/backup/export/customers:
 *   post:
 *     summary: Export customers to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/customers', backupController.exportCustomers);

/**
 * @swagger
 * /api/backup/export/categories:
 *   post:
 *     summary: Export categories to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/categories', backupController.exportCategories);

/**
 * @swagger
 * /api/backup/export/brands:
 *   post:
 *     summary: Export brands to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/brands', backupController.exportBrands);

/**
 * @swagger
 * /api/backup/export/coupons:
 *   post:
 *     summary: Export coupons to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/coupons', backupController.exportCoupons);

/**
 * @swagger
 * /api/backup/export/reviews:
 *   post:
 *     summary: Export reviews to Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *             format: binary
 *       500:
 *         description: Server error
 */
router.post('/export/reviews', backupController.exportReviews);

// ===== IMPORT ROUTES =====

/**
 * @swagger
 * /api/backup/import/products:
 *   post:
 *     summary: Import products from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/products', upload('file'), backupController.importProducts);

/**
 * @swagger
 * /api/backup/import/orders:
 *   post:
 *     summary: Import orders from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/orders', upload('file'), backupController.importOrders);

/**
 * @swagger
 * /api/backup/import/customers:
 *   post:
 *     summary: Import customers from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/customers', upload('file'), backupController.importCustomers);

/**
 * @swagger
 * /api/backup/import/categories:
 *   post:
 *     summary: Import categories from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/categories', upload('file'), backupController.importCategories);

/**
 * @swagger
 * /api/backup/import/brands:
 *   post:
 *     summary: Import brands from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/brands', upload('file'), backupController.importBrands);

/**
 * @swagger
 * /api/backup/import/coupons:
 *   post:
 *     summary: Import coupons from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/coupons', upload('file'), backupController.importCoupons);

/**
 * @swagger
 * /api/backup/import/reviews:
 *   post:
 *     summary: Import reviews from Excel
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - storeId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Import status
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/import/reviews', upload('file'), backupController.importReviews);

// ===== VALIDATION ROUTE =====

/**
 * @swagger
 * /api/backup/validate/{entity}:
 *   post:
 *     summary: Validate import file (dry run)
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [products, orders, customers, categories, brands, coupons, reviews]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: File missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/validate/:entity', upload('file'), backupController.validateImport);

// ===== MONGODB DUMP/RESTORE ROUTES =====

/**
 * @swagger
 * /api/backup/database/dump:
 *   get:
 *     summary: Download MongoDB dump
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Database dump file (gzip)
 *         content:
 *           application/gzip:
 *             schema:
 *               type: string
 *             format: binary
 *       503:
 *         description: Tools not available
 *       500:
 *         description: Server error
 */
router.get('/database/dump', backupController.downloadDatabaseDump);

/**
 * @swagger
 * /api/backup/database/restore:
 *   post:
 *     summary: Restore MongoDB from dump
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Restore status
 *       503:
 *         description: Tools not available
 *       500:
 *         description: Server error
 */
router.post('/database/restore', upload('file'), backupController.restoreDatabaseDump);

/**
 * @swagger
 * /api/backup/database/tools:
 *   get:
 *     summary: Check MongoDB tools availability
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Tool availability status
 */
router.get('/database/tools', backupController.checkMongoDbTools);

/**
 * @swagger
 * /api/backup/database/backups:
 *   get:
 *     summary: List available backups
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: List of backup files
 */
router.get('/database/backups', backupController.listBackups);

export default router;
