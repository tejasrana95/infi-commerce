import { Router } from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    mergeCart,
    getCartCount,
    validateCart,
    addToCartValidation,
    updateCartItemValidation,
} from '../controllers/cart.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Cart routes (support both authenticated users and guest sessions)
// Guest users should send x-session-id header
// Authenticated users are identified via JWT token

// Get cart (public - uses session or user)
router.get('/', optionalAuth, getCart);

// Get cart item count
router.get('/count', optionalAuth, getCartCount);

// Validate cart
router.post('/validate', optionalAuth, validateCart);

// Add item to cart
router.post('/items', optionalAuth, validate(addToCartValidation), addToCart);

// Update cart item
router.put('/items/:itemId', optionalAuth, validate(updateCartItemValidation), updateCartItem);

// Remove item from cart
router.delete('/items/:itemId', optionalAuth, removeFromCart);

// Clear cart
router.delete('/clear', optionalAuth, clearCart);

// Merge guest cart with user cart (requires authentication)
router.post('/merge', authenticate, mergeCart);

export default router;
