import { Router } from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    checkShipping,
    getFeaturedProducts,
    getOnSaleProducts,
    updateStock,
    createProductValidation,
    updateProductValidation,
    cloneProduct,
    getSearchFilters
} from '../controllers/product.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/on-sale', getOnSaleProducts);
router.get('/search/filters', getSearchFilters);
router.get('/:id', optionalAuth, getProductById);
router.get('/slug/:storeId/:slug', optionalAuth, getProductBySlug);
router.post('/:id/check-shipping', checkShipping);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createProductValidation),
    createProduct
);

router.post(
    '/:id/clone',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    cloneProduct
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateProductValidation),
    updateProduct
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteProduct
);

router.patch(
    '/:id/stock',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateStock
);

export default router;
