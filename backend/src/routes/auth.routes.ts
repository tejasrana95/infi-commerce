import { Router } from 'express';
import {
    register,
    login,
    refreshToken,
    getProfile,
    updateProfile,
    registerValidation,
    loginValidation,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;
