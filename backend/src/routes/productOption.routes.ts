import { Router } from 'express';
import {
    createProductOption,
    getProductOptions,
    getProductOptionById,
    updateProductOption,
    deleteProductOption,
    getFilterableProductOptions,
    addProductOptionValue,
    removeProductOptionValue,
    createProductOptionValidation,
    updateProductOptionValidation,
} from '../controllers/productOption.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getProductOptions);
router.get('/filterable', getFilterableProductOptions);
router.get('/:id', getProductOptionById);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createProductOptionValidation),
    createProductOption
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateProductOptionValidation),
    updateProductOption
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteProductOption
);

router.post(
    '/:id/values',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    addProductOptionValue
);

router.delete(
    '/:id/values/:valueId',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    removeProductOptionValue
);

export default router;
