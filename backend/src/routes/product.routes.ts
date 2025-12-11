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
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/on-sale', getOnSaleProducts);
router.get('/:id', getProductById);
router.get('/slug/:storeId/:slug', getProductBySlug);
router.post('/:id/check-shipping', checkShipping);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createProductValidation),
    createProduct
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
