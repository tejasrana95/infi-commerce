import express from 'express';
import * as slugController from '../controllers/slug.controller';

const router = express.Router();

// Public routes (no auth required for resolution)
router.get('/resolve/:storeId/:slug', slugController.resolveSlug);

// Check availability (useful for admin UI)
router.get('/check/:storeId/:slug', slugController.checkSlugAvailability);

export default router;
