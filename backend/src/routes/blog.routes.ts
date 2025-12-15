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
    createBlogPostValidation,
    getBlogCategoryById
} from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

// Blog Categories
router
    .route('/categories')
    .post(authorize('admin', 'super_admin'), validate(createBlogCategoryValidation), createBlogCategory)
    .get(getBlogCategories);

router
    .route('/categories/:id')
    .get(getBlogCategoryById)
    .put(authorize('admin', 'super_admin'), validate(updateBlogCategoryValidation), updateBlogCategory)
    .delete(authorize('admin', 'super_admin'), deleteBlogCategory);

// Blog Posts
router
    .route('/posts')
    .post(authorize('admin', 'super_admin'), validate(createBlogPostValidation), createBlogPost)
    .get(getBlogPosts);

router
    .route('/posts/:id')
    .get(getBlogPostById)
    .put(authorize('admin', 'super_admin'), updateBlogPost)
    .delete(authorize('admin', 'super_admin'), deleteBlogPost);

export default router;
