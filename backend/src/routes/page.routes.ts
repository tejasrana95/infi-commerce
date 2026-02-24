import express from 'express';
import {
    createPage,
    getPages,
    getPageById,
    getPageBySlug,
    updatePage,
    deletePage,
    createPageValidation,
    updatePageValidation
} from '../controllers/page.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes (no auth required)
router.get('/slug/:slug', optionalAuth, getPageBySlug);
router.get('/', optionalAuth, getPages); // Public for sitemap (filtered by status)

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'super_admin'), validate(createPageValidation), createPage);

router
    .route('/:id')
    .get(getPageById)
    .put(authorize('admin', 'super_admin'), validate(updatePageValidation), updatePage)
    .delete(authorize('admin', 'super_admin'), deletePage);

export default router;
