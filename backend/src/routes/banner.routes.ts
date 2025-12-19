import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
} from '../controllers/banner.controller';

const router = express.Router();

router.get('/', getBanners);
router.get('/:id', getBannerById);

router.use(authenticate);

router
    .route('/')
    .get(getBanners)
    .post(authorize('admin', 'super_admin'), createBanner);

router
    .route('/:id')
    .get(getBannerById)
    .put(authorize('admin', 'super_admin'), updateBanner)
    .delete(authorize('admin', 'super_admin'), deleteBanner);

export default router;
