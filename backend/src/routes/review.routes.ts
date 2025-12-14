import express from 'express';
import {
    getReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    updateReviewStatus,
    addAdminReply,
    getProductReviews,
    getReviewStats,
} from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public route for product reviews (must be before :id routes)
router.get('/product/:productId', getProductReviews);

// Admin routes (protected)
router.get('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviews);
router.get('/stats/:storeId', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviewStats);
router.get('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviewById);
router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), createReview);
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateReview);
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteReview);
router.put('/:id/status', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateReviewStatus);
router.post('/:id/reply', authenticate, authorize('admin', 'store_admin', 'super_admin'), addAdminReply);

export default router;
