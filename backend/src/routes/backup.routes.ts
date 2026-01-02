import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import * as backupController from '../controllers/backup.controller';

const router = Router();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
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

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// ===== EXPORT ROUTES =====
router.post('/export/products', backupController.exportProducts);
router.post('/export/orders', backupController.exportOrders);
router.post('/export/customers', backupController.exportCustomers);
router.post('/export/categories', backupController.exportCategories);
router.post('/export/brands', backupController.exportBrands);
router.post('/export/coupons', backupController.exportCoupons);
router.post('/export/reviews', backupController.exportReviews);

// ===== IMPORT ROUTES =====
router.post('/import/products', upload.single('file'), backupController.importProducts);
router.post('/import/orders', upload.single('file'), backupController.importOrders);
router.post('/import/customers', upload.single('file'), backupController.importCustomers);
router.post('/import/categories', upload.single('file'), backupController.importCategories);
router.post('/import/brands', upload.single('file'), backupController.importBrands);
router.post('/import/coupons', upload.single('file'), backupController.importCoupons);
router.post('/import/reviews', upload.single('file'), backupController.importReviews);

// ===== VALIDATION ROUTE =====
router.post('/validate/:entity', upload.single('file'), backupController.validateImport);

// ===== MONGODB DUMP/RESTORE ROUTES =====
router.get('/database/dump', backupController.downloadDatabaseDump);
router.post('/database/restore', upload.single('file'), backupController.restoreDatabaseDump);
router.get('/database/tools', backupController.checkMongoDbTools);
router.get('/database/backups', backupController.listBackups);

export default router;
