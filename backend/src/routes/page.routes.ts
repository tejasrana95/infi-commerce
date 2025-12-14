import express from 'express';
import {
    createPage,
    getPages,
    getPageById,
    updatePage,
    deletePage,
    createPageValidation,
    updatePageValidation
} from '../controllers/page.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'superadmin'), createPageValidation, validate, createPage)
    .get(getPages);

router
    .route('/:id')
    .get(getPageById)
    .put(authorize('admin', 'superadmin'), updatePageValidation, validate, updatePage)
    .delete(authorize('admin', 'superadmin'), deletePage);

export default router;
