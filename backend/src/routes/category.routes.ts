import { Router } from 'express';
import {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    createCategoryValidation,
    updateCategoryValidation,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes (anyone can view categories)
router.get('/', getCategories);
router.get('/tree/:storeId', getCategoryTree);
router.get('/:id', getCategoryById);
router.get('/slug/:storeId/:slug', getCategoryBySlug);

// Protected routes (require authentication AND admin role)
// Only admin, store_admin, and super_admin can manage categories
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
