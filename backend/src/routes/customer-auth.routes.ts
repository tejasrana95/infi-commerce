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
    setupCustomer2FA,
    verifyAndEnableCustomer2FA,
    disableCustomer2FA,
    verifyCustomer2FALogin,
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
router.post('/login', storeContext.required, validate(customerLoginValidation), loginCustomer);
router.post('/2fa/verify-login', storeContext.required, verifyCustomer2FALogin);
router.post('/refresh', refreshCustomerToken);
router.post('/social-login', storeContext.required, socialLogin);

// Password reset routes (public, require store context for emails)
router.post('/forgot-password', storeContext.required, validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password', storeContext.required, validate(resetPasswordValidation), resetPassword);

// Email verification (public - token-based)
router.post('/verify-email', validate(verifyEmailValidation), verifyEmail);

// Protected routes (require customer authentication)
router.get('/me', authenticate, getCustomerProfile);
router.put('/me', authenticate, updateCustomerProfile);
router.post('/change-password', authenticate, validate(changePasswordValidation), changePassword);
router.post('/resend-verification', authenticate, storeContext.required, resendVerification);

// 2FA management
router.post('/2fa/setup', authenticate, storeContext.optional, setupCustomer2FA);
router.post('/2fa/verify', authenticate, verifyAndEnableCustomer2FA);
router.post('/2fa/disable', authenticate, disableCustomer2FA);

export default router;

