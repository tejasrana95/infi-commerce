import express from 'express';
import {
    createTheme,
    getThemes,
    getThemeById,
    updateTheme,
    deleteTheme,
    activateTheme,
    createThemeValidation,
    updateThemeValidation
} from '../controllers/theme.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes (if needed to fetch themes for setup) or protected?
// Generally theme management is admin-only.
// Let's protect everything for now.

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'superadmin'), createThemeValidation, validate, createTheme)
    .get(getThemes);

router
    .route('/:id')
    .get(getThemeById)
    .put(authorize('admin', 'superadmin'), updateThemeValidation, validate, updateTheme)
    .delete(authorize('admin', 'superadmin'), deleteTheme);

router.post('/:id/activate', authorize('admin', 'superadmin'), activateTheme);

export default router;
