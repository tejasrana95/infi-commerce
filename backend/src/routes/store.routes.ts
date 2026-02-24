import { Router } from 'express';
import {
    createStore,
    getStores,
    getStoreById,
    getStoreBySlug,
    getStoreByDomain,
    updateStore,
    deleteStore,
    toggleStoreStatus,
    getEmailSettings,
    updateEmailSettings,
    testEmailSettings,
    getSmsSettings,
    updateSmsSettings,
    getWhatsappSettings,
    updateWhatsappSettings,
    createStoreValidation,
    updateStoreValidation,
    updateEmailSettingsValidation,
    updateSmsSettingsValidation,
    updateWhatsappSettingsValidation,
    testEmailSettingsValidation,
    getStoreMeta,
    getPosPaymentSettings,
    updatePosPaymentSettings,
} from '../controllers/store.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkDemoMode } from '../middleware/checkDemoMode';

const router = Router();

// Public routes (anyone can view stores)
router.get('/:id/meta', getStoreMeta);
router.get(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getStores
);
router.get('/domain/:domain', optionalAuth, getStoreByDomain);
router.get('/slug/:slug', optionalAuth, getStoreBySlug);
router.get('/:id', optionalAuth, getStoreById);

// Protected routes (require authentication AND admin role)
// Only admin, store_admin, and super_admin can manage stores
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(createStoreValidation),
    createStore
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(updateStoreValidation),
    updateStore
);

router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    updateStore
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'), // Only admin and super_admin can delete
    checkDemoMode,
    deleteStore
);

router.patch(
    '/:id/toggle-status',
    authenticate,
    authorize('admin', 'super_admin'), // Only admin and super_admin can toggle status
    checkDemoMode,
    toggleStoreStatus
);

// Email settings routes
router.get(
    '/:id/email-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getEmailSettings
);

router.put(
    '/:id/email-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(updateEmailSettingsValidation),
    updateEmailSettings
);

// SMS settings routes
router.get(
    '/:id/sms-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getSmsSettings
);

router.put(
    '/:id/sms-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(updateSmsSettingsValidation),
    updateSmsSettings
);

// WhatsApp settings routes
router.get(
    '/:id/whatsapp-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getWhatsappSettings
);

router.put(
    '/:id/whatsapp-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(updateWhatsappSettingsValidation),
    updateWhatsappSettings
);

router.post(
    '/:id/email-settings/test',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    validate(testEmailSettingsValidation),
    testEmailSettings
);

// POS Payment Settings routes
router.get(
    '/:id/pos-payment-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getPosPaymentSettings
);

router.put(
    '/:id/pos-payment-settings',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    checkDemoMode,
    updatePosPaymentSettings
);

export default router;
