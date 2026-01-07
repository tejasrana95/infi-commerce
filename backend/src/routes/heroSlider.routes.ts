import express from 'express';
import {
    getHeroSliders,
    getHeroSliderById,
    createHeroSlider,
    updateHeroSlider,
    deleteHeroSlider
} from '../controllers/heroSlider.controller';
import { authenticate, authorize } from '../middleware/auth';
import { optionalApiKeyAuth } from '../middleware/apiKeyAuth';

const router = express.Router();

// Public routes (for fetching sliders on frontend)
router.get('/', optionalApiKeyAuth, getHeroSliders);
router.get('/:id', optionalApiKeyAuth, getHeroSliderById);

// Admin routes
router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), createHeroSlider);
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateHeroSlider);
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteHeroSlider);

export default router;
