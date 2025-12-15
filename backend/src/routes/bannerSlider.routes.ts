import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getBannerSliders,
    getBannerSliderById,
    createBannerSlider,
    updateBannerSlider,
    deleteBannerSlider,
} from '../controllers/bannerSlider.controller';

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .get(getBannerSliders)
    .post(authorize('admin', 'super_admin'), createBannerSlider);

router
    .route('/:id')
    .get(getBannerSliderById)
    .put(authorize('admin', 'super_admin'), updateBannerSlider)
    .delete(authorize('admin', 'super_admin'), deleteBannerSlider);

export default router;
