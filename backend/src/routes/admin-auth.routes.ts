import { Router } from 'express';
import {
    registerAdmin,
    loginAdmin,
    refreshAdminToken,
    getAdminProfile,
    updateAdminProfile,
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

export default router;
