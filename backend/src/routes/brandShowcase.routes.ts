import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getBrandShowcases,
    getBrandShowcaseById,
    createBrandShowcase,
    updateBrandShowcase,
    deleteBrandShowcase,
} from '../controllers/brandShowcase.controller';

const router = express.Router();

router.get('/', getBrandShowcases);
router.get('/:id', getBrandShowcaseById);

router.use(authenticate);

router
    .route('/')
    .get(getBrandShowcases)
    .post(authorize('admin', 'super_admin'), createBrandShowcase);

router
    .route('/:id')
    .get(getBrandShowcaseById)
    .put(authorize('admin', 'super_admin'), updateBrandShowcase)
    .delete(authorize('admin', 'super_admin'), deleteBrandShowcase);

export default router;
