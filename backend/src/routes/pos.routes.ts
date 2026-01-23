import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All POS routes require authentication and pos_user/store_admin/super_admin role
router.use(authenticate);
router.use(authorize('pos_user', 'store_admin', 'super_admin'));

// Session Management
router.post('/session/start', posController.startSession);
router.post('/session/end', posController.endSession);
router.get('/session/current', posController.getCurrentSession);
router.get('/session/history', posController.getSessionHistory);


// Dashboard
router.get('/dashboard', posController.getDashboard);

// Receipt
router.get('/receipt/:orderId', posController.getReceiptData);

// Password Verification
router.post('/verify-password', posController.verifyPassword);

export default router;
