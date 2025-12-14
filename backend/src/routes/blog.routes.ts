import express from 'express';
import {
    createBlogCategory,
    getBlogCategories,
    updateBlogCategory,
    deleteBlogCategory,
    createBlogPost,
    getBlogPosts,
    getBlogPostById,
    updateBlogPost,
    deleteBlogPost,
    createBlogCategoryValidation,
    updateBlogCategoryValidation,
    createBlogPostValidation
} from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

// Blog Categories
router
    .route('/categories')
    .post(authorize('admin', 'superadmin'), createBlogCategoryValidation, validate, createBlogCategory)
    .get(getBlogCategories);

router
    .route('/categories/:id')
    .put(authorize('admin', 'superadmin'), updateBlogCategoryValidation, validate, updateBlogCategory)
    .delete(authorize('admin', 'superadmin'), deleteBlogCategory);

// Blog Posts
router
    .route('/posts')
    .post(authorize('admin', 'superadmin'), createBlogPostValidation, validate, createBlogPost)
    .get(getBlogPosts);

router
    .route('/posts/:id')
    .get(getBlogPostById)
    .put(authorize('admin', 'superadmin'), updateBlogPost)
    .delete(authorize('admin', 'superadmin'), deleteBlogPost);

export default router;
