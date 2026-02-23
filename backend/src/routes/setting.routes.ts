import { Router } from 'express';
import {
    getAdminBranding,
    updateAdminBranding,
    getAdminAiSettings,
    updateAdminAiSettings,
    getPosPwaSettings,
    updatePosPwaSettings,
    getSearchReplaceTables,
    runSearchReplace,
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
router.get('/pos-pwa', getPosPwaSettings);

router.put(
    '/pos-pwa',
    authenticate,
    authorize('super_admin'),
    updatePosPwaSettings
);

// Search and Replace - super admin only
router.get(
    '/search-replace/tables',
    authenticate,
    authorize('super_admin'),
    getSearchReplaceTables
);

router.post(
    '/search-replace',
    authenticate,
    authorize('super_admin'),
    runSearchReplace
);

export default router;
