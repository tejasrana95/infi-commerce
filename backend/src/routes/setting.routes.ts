import { Router } from 'express';
import { getAdminBranding, updateAdminBranding } from '../controllers/setting.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Publicly accessible for login page and initial load
router.get('/admin-branding', getAdminBranding);

// Only super_admin can update global branding
router.put(
    '/admin-branding',
    authenticate,
    authorize('super_admin'),
    updateAdminBranding
);

export default router;
