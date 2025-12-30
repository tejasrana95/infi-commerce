import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Dashboard routes - Admin only
router.get('/stats', authenticate, authorize('admin', 'store_admin', 'super_admin'), getDashboardStats);

export default router;
