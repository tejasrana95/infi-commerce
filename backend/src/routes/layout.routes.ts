import express from 'express';
import {
    createLayout,
    getLayouts,
    getLayoutById,
    updateLayout,
    deleteLayout,
    duplicateLayout,
    createLayoutValidation,
    updateLayoutValidation
} from '../controllers/layout.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'superadmin'), createLayoutValidation, validate, createLayout)
    .get(getLayouts);

router
    .route('/:id')
    .get(getLayoutById)
    .put(authorize('admin', 'superadmin'), updateLayoutValidation, validate, updateLayout)
    .delete(authorize('admin', 'superadmin'), deleteLayout);

router.post('/:id/duplicate', authorize('admin', 'superadmin'), duplicateLayout);

export default router;
