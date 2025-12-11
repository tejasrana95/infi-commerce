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
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Cart routes (support both authenticated users and guest sessions)
// Guest users should send x-session-id header

// Get cart (public - uses session or user)
router.get('/', getCart);

// Get cart item count
router.get('/count', getCartCount);

// Validate cart
router.post('/validate', validateCart);

// Add item to cart
router.post('/items', validate(addToCartValidation), addToCart);

// Update cart item
router.put('/items/:itemId', validate(updateCartItemValidation), updateCartItem);

// Remove item from cart
router.delete('/items/:itemId', removeFromCart);

// Clear cart
router.delete('/clear', clearCart);

// Merge guest cart with user cart (requires authentication)
router.post('/merge', authenticate, mergeCart);

export default router;
