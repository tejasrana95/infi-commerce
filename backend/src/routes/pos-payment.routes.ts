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

// Generate QR Code
router.post('/qr', generateQR);

// Check Status of QR Payment
router.get('/qr/:id/status', checkStatus);

// Manual Verification of QR Payment
router.post('/qr/:orderId/verify', verifyManual);

// Cancel QR
router.post('/qr/:id/cancel', cancelQR);

export default router;
