import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
} from '../controllers/wishlist.controller';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', getWishlist);

// Add product to wishlist
router.post('/:productId', addToWishlist);

// Remove product from wishlist
router.delete('/:productId', removeFromWishlist);

// Check if product is in wishlist
router.get('/:productId/check', checkWishlistStatus);

export default router;
