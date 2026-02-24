import { Router } from 'express';
import {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategoryById,
    getCategoryBySlug,
    getCategoryFilters,
    updateCategory,
    deleteCategory,
    createCategoryValidation,
    updateCategoryValidation,
    bulkAction,
} from '../controllers/category.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes (anyone can view categories)
router.get('/', optionalAuth, getCategories);
router.get('/tree/:storeId', optionalAuth, getCategoryTree);
router.get('/:id', optionalAuth, getCategoryById);
router.get('/:id/filters', optionalAuth, getCategoryFilters);
router.get('/slug/:storeId/:slug', optionalAuth, getCategoryBySlug);

// Protected routes (require authentication AND admin role)
// Only admin, store_admin, and super_admin can manage categories
router.post(
    '/bulk-action',
    authenticate,
    authorize('admin', 'super_admin'),
    bulkAction
);

router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createCategoryValidation),
    createCategory
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(updateCategoryValidation),
    updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'), // Only admin and super_admin can delete
    deleteCategory
);

export default router;
