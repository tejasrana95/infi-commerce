import { Router } from 'express';
import {
    registerAdmin,
    loginAdmin,
    refreshAdminToken,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    setup2FA,
    verifyAndEnable2FA,
    disable2FA,
    verify2FALogin,
    adminRegisterValidation,
    adminLoginValidation,
} from '../controllers/admin-auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/login', validate(adminLoginValidation), loginAdmin);
router.post('/refresh', refreshAdminToken);

// Protected routes (require admin authentication)
// Note: Registration should be protected in production - only super_admin should create new admins
router.post('/register', validate(adminRegisterValidation), registerAdmin);
router.get('/me', authenticate, getAdminProfile);
router.put('/me', authenticate, updateAdminProfile);
router.post('/change-password', authenticate, changeAdminPassword);

// 2FA routes
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verifyAndEnable2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/2fa/verify-login', verify2FALogin);

export default router;
