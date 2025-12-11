import { Router } from 'express';
import {
    createStore,
    getStores,
    getStoreById,
    getStoreBySlug,
    updateStore,
    deleteStore,
    toggleStoreStatus,
    createStoreValidation,
    updateStoreValidation,
} from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes (anyone can view stores)
router.get('/', getStores);
router.get('/:id', getStoreById);
router.get('/slug/:slug', getStoreBySlug);

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

export default router;
