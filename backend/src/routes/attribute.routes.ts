import { Router } from 'express';
import {
    createAttribute,
    getAttributes,
    getAttributeById,
    updateAttribute,
    deleteAttribute,
    getFilterableAttributes,
    getComparableAttributes,
    addAttributeOption,
    removeAttributeOption,
    createAttributeValidation,
    updateAttributeValidation,
} from '../controllers/attribute.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes - for product filtering and comparison
router.get('/', getAttributes);
router.get('/filterable', getFilterableAttributes);
router.get('/comparable', getComparableAttributes);
router.get('/:id', getAttributeById);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createAttributeValidation),
    createAttribute
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateAttributeValidation),
    updateAttribute
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteAttribute
);

// Option management for select/multiselect attributes
router.post(
    '/:id/options',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    addAttributeOption
);

router.delete(
    '/:id/options/:option',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    removeAttributeOption
);

export default router;
