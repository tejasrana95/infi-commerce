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
    toggleHelpfulVote,
} from '../controllers/review.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public route for product reviews (must be before :id routes)
router.get('/product/:productId', getProductReviews);

// Create review (public/optional auth)
router.post('/', optionalAuth, createReview);

// Vote helpful (auth required)
router.post('/:id/helpful', authenticate, toggleHelpfulVote);

// Admin routes (protected)
router.get('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviews);
router.get('/stats/:storeId', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviewStats);
router.get('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), getReviewById);
// Create route moved above
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateReview);
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteReview);
router.put('/:id/status', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateReviewStatus);
router.post('/:id/reply', authenticate, authorize('admin', 'store_admin', 'super_admin'), addAdminReply);

export default router;
