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
    createStoreValidation,
    updateStoreValidation,
    updateEmailSettingsValidation,
    testEmailSettingsValidation,
} from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes (anyone can view stores)
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

router.post(
    '/:id/email-settings/test',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(testEmailSettingsValidation),
    testEmailSettings
);

export default router;
