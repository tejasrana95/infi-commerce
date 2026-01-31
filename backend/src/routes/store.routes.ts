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
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes (anyone can view stores)
router.get('/:id/meta', getStoreMeta);
router.get('/', getStores);
router.get('/domain/:domain', getStoreByDomain);
router.get('/slug/:slug', getStoreBySlug);
router.get('/:id', getStoreById);

// Protected routes (require authentication AND admin role)
// Only admin, store_admin, and super_admin can manage stores
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createStoreValidation),
    createStore
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateStoreValidation),
    updateStore
);

router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateStore
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'), // Only admin and super_admin can delete
    deleteStore
);

router.patch(
    '/:id/toggle-status',
    authenticate,
    authorize('admin', 'super_admin'), // Only admin and super_admin can toggle status
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
    validate(updateWhatsappSettingsValidation),
    updateWhatsappSettings
);

router.post(
    '/:id/email-settings/test',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
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
    updatePosPaymentSettings
);

export default router;
