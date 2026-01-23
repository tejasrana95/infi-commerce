import { Router } from 'express';
import barcodeController from '../controllers/barcode.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All barcode routes require authentication and admin/store_admin role
router.use(authenticate);
router.use(authorize('admin', 'store_admin', 'super_admin'));

// Barcode Generation
router.post('/generate', barcodeController.generateBarcode);
router.post('/bulk-generate', barcodeController.bulkGenerateBarcodes);

// Barcode Download
router.get('/download/:productId', barcodeController.downloadBarcode);

// Barcode Sheet
router.post('/print-batch', barcodeController.generateBarcodeSheet);

// Print Options (label sizes, page sizes, layouts)
router.get('/print-options', barcodeController.getPrintOptions);

// Supported Formats
router.get('/formats', barcodeController.getSupportedFormats);

export default router;
