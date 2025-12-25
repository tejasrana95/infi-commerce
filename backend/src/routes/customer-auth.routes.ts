import { Router } from 'express';
import {
    registerCustomer,
    loginCustomer,
    refreshCustomerToken,
    getCustomerProfile,
    updateCustomerProfile,
    socialLogin,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    customerRegisterValidation,
    customerLoginValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    verifyEmailValidation,
} from '../controllers/customer-auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import storeContext from '../middleware/storeContext';

const router = Router();

// Public routes with store context (for email notifications)
router.post('/register', storeContext.required, validate(customerRegisterValidation), registerCustomer);
router.post('/login', validate(customerLoginValidation), loginCustomer);
router.post('/refresh', refreshCustomerToken);
router.post('/social-login', socialLogin);

// Password reset routes (public, require store context for emails)
router.post('/forgot-password', storeContext.required, validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

// Email verification (public - token-based)
router.post('/verify-email', validate(verifyEmailValidation), verifyEmail);

// Protected routes (require customer authentication)
router.get('/me', authenticate, getCustomerProfile);
router.put('/me', authenticate, updateCustomerProfile);
router.post('/change-password', authenticate, validate(changePasswordValidation), changePassword);
router.post('/resend-verification', authenticate, storeContext.required, resendVerification);

export default router;

