import express from 'express';
import {
    createHeader,
    getHeaders,
    getHeaderById,
    updateHeader,
    deleteHeader,
    createFooter,
    getFooters,
    getFooterById,
    updateFooter,
    deleteFooter
} from '../controllers/header-footer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Headers
router
    .route('/headers')
    .post(authorize('admin', 'superadmin'), createHeader)
    .get(getHeaders);

router
    .route('/headers/:id')
    .get(getHeaderById)
    .put(authorize('admin', 'superadmin'), updateHeader)
    .delete(authorize('admin', 'superadmin'), deleteHeader);

// Footers
router
    .route('/footers')
    .post(authorize('admin', 'superadmin'), createFooter)
    .get(getFooters);

router
    .route('/footers/:id')
    .get(getFooterById)
    .put(authorize('admin', 'superadmin'), updateFooter)
    .delete(authorize('admin', 'superadmin'), deleteFooter);

export default router;
