import { Router } from 'express';
import {
    getAdminBranding,
    updateAdminBranding,
    getAdminAiSettings,
    updateAdminAiSettings
} from '../controllers/setting.controller';
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

// Admin AI Settings
router.get(
    '/admin-ai',
    authenticate,
    authorize('super_admin'),
    getAdminAiSettings
);

router.put(
    '/admin-ai',
    authenticate,
    authorize('super_admin'),
    updateAdminAiSettings
);

// POS PWA Settings - Public GET for POS app, protected PUT for admin
import { getPosPwaSettings, updatePosPwaSettings } from '../controllers/setting.controller';

router.get('/pos-pwa', getPosPwaSettings);

router.put(
    '/pos-pwa',
    authenticate,
    authorize('super_admin'),
    updatePosPwaSettings
);

export default router;
