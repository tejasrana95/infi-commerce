import express from 'express';
import {
    getContentCards,
    getContentCardById,
    getContentCardBySlug,
    createContentCard,
    updateContentCard,
    deleteContentCard,
    cloneContentCard,
    getContentCardCategories,
    getContentCardCategoryById,
    createContentCardCategory,
    updateContentCardCategory,
    deleteContentCardCategory,
    cloneContentCardCategory
} from '../controllers/contentCard.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================
router.get('/cards/slug/:slug', getContentCardBySlug);
router.get('/categories', getContentCardCategories);

// ============================================
// MIXED ROUTES (work with or without auth)
// These routes check req.user internally to determine behavior
// ============================================
router.get('/cards', optionalAuth, getContentCards); // Public sees published, authenticated sees all

// ============================================
// AUTHENTICATED ROUTES
// ============================================
router.use(authenticate);

// Card management
router.post('/cards', authorize('admin', 'super_admin'), createContentCard);
router.get('/cards/:id', getContentCardById);
router.put('/cards/:id', authorize('admin', 'super_admin'), updateContentCard);
router.delete('/cards/:id', authorize('admin', 'super_admin'), deleteContentCard);
router.post('/cards/:id/clone', authorize('admin', 'super_admin'), cloneContentCard);

// Category management  
router.post('/categories', authorize('admin', 'super_admin'), createContentCardCategory);
router.get('/categories/:id', getContentCardCategoryById);
router.put('/categories/:id', authorize('admin', 'super_admin'), updateContentCardCategory);
router.delete('/categories/:id', authorize('admin', 'super_admin'), deleteContentCardCategory);
router.post('/categories/:id/clone', authorize('admin', 'super_admin'), cloneContentCardCategory);

export default router;
