import express from 'express';
import {
    createBlogCategory,
    getBlogCategories,
    updateBlogCategory,
    deleteBlogCategory,
    createBlogPost,
    getBlogPosts,
    getBlogPostById,
    getBlogPostBySlug,
    updateBlogPost,
    deleteBlogPost,
    createBlogCategoryValidation,
    updateBlogCategoryValidation,
    createBlogPostValidation,
    getBlogCategoryById,
    getPopularTags,
    trackBlogView,
    likeBlogPost
} from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================
router.get('/posts/slug/:slug', getBlogPostBySlug);
router.get('/posts/tags', getPopularTags);
router.get('/posts', getBlogPosts);
router.get('/categories', getBlogCategories);
router.post('/posts/:id/view', trackBlogView);
router.post('/posts/:id/like', likeBlogPost);

// ============================================
// AUTHENTICATED ROUTES
// ============================================
router.use(authenticate);

// Blog Categories (authenticated)
router.post('/categories', authorize('admin', 'super_admin'), validate(createBlogCategoryValidation), createBlogCategory);
router.get('/categories/:id', getBlogCategoryById);
router.put('/categories/:id', authorize('admin', 'super_admin'), validate(updateBlogCategoryValidation), updateBlogCategory);
router.delete('/categories/:id', authorize('admin', 'super_admin'), deleteBlogCategory);

// Blog Posts (authenticated)
router.post('/posts', authorize('admin', 'super_admin'), validate(createBlogPostValidation), createBlogPost);
router.get('/posts/:id', getBlogPostById);
router.put('/posts/:id', authorize('admin', 'super_admin'), updateBlogPost);
router.delete('/posts/:id', authorize('admin', 'super_admin'), deleteBlogPost);

export default router;
