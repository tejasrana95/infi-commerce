import express from 'express';
import {
    getHeroBanners,
    getHeroBannerById,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    reorderHeroBanners
} from '../controllers/heroBanner.controller';
import { authenticate, authorize } from '../middleware/auth';
import { optionalApiKeyAuth } from '../middleware/apiKeyAuth';

const router = express.Router();

router.get('/', optionalApiKeyAuth, getHeroBanners);
router.get('/:id', optionalApiKeyAuth, getHeroBannerById);

router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), createHeroBanner);
router.put('/reorder', authenticate, authorize('admin', 'store_admin', 'super_admin'), reorderHeroBanners);
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateHeroBanner);
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteHeroBanner);

export default router;
