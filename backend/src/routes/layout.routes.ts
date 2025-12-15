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
    .post(authorize('admin', 'super_admin'), validate(createLayoutValidation), createLayout)
    .get(getLayouts);

router
    .route('/:id')
    .get(getLayoutById)
    .put(authorize('admin', 'super_admin'), validate(updateLayoutValidation), updateLayout)
    .delete(authorize('admin', 'super_admin'), deleteLayout);

router.post('/:id/duplicate', authorize('admin', 'super_admin'), duplicateLayout);

export default router;
