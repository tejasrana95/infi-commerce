import { Router } from 'express';
import {
    createAttribute,
    getAttributes,
    getAttributeById,
    updateAttribute,
    deleteAttribute,
    getFilterableAttributes,
    addAttributeValue,
    removeAttributeValue,
    createAttributeValidation,
    updateAttributeValidation,
} from '../controllers/attribute.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getAttributes);
router.get('/filterable', getFilterableAttributes);
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

router.post(
    '/:id/values',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    addAttributeValue
);

router.delete(
    '/:id/values/:valueId',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    removeAttributeValue
);

export default router;
