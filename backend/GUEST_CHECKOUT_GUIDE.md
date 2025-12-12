# Guest Checkout Implementation Guide

## Problem
Currently, all order endpoints require authentication (`authenticate` middleware), which prevents guest users from checking out.

## Solution
Implement guest checkout by:
1. ✅ Making `userId` optional in Order model
2. ✅ Adding `guestEmail` field
3. ⏳ Updating order controller to handle both logged-in and guest users
4. ⏳ Changing routes to use `optionalAuth` instead of `authenticate`

## Changes Made

### 1. Order Model Updated ✅

**Interface Changes:**
```typescript
export interface IOrder extends Document {
    userId?: mongoose.Types.ObjectId; // Now optional
    guestEmail?: string; // For guest orders
    shippingAddress: {
        email?: string; // Guest email
        // ... other fields
    };
}
```

**Schema Changes:**
```typescript
userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed from true
},
guestEmail: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
},
```

### 2. Order Controller Changes Needed

#### Update `createOrder` function:

**Current:**
```typescript
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id; // ❌ Requires authentication
    // ...
});
```

**Updated:**
```typescript
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id; // ✅ Optional
    const { guestEmail, ...orderData } = req.body;
    
    // Validate: Either logged in OR guest email provided
    if (!userId && !guestEmail) {
        throw new AppError('Email is required for guest checkout', 400);
    }
    
    // Get cart (session-based for guests, user-based for logged-in)
    let cart;
    if (userId) {
        cart = await Cart.findOne({ userId, storeId });
    } else {
        // For guests, cart is identified by sessionId
        const sessionId = req.body.sessionId || req.sessionID;
        cart = await Cart.findOne({ sessionId, storeId });
    }
    
    // Create order
    const order = await Order.create({
        storeId,
        userId: userId || undefined,
        guestEmail: !userId ? guestEmail : undefined,
        // ... rest of order data
    });
});
```

#### Update `initializePayment` function:

**Current:**
```typescript
export const initializePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id; // ❌ Requires authentication
    
    // Check authorization
    if (order.userId.toString() !== userId) {
        throw new AppError('Not authorized', 403);
    }
});
```

**Updated:**
```typescript
export const initializePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { guestEmail } = req.body; // For guest verification
    
    const order = await Order.findById(id);
    
    // Check authorization
    if (order.userId) {
        // Logged-in user order
        if (!userId || order.userId.toString() !== userId) {
            throw new AppError('Not authorized', 403);
        }
    } else {
        // Guest order - verify by email
        if (!guestEmail || order.guestEmail !== guestEmail.toLowerCase()) {
            throw new AppError('Not authorized', 403);
        }
    }
    
    // Get customer email
    const customerEmail = userId ? req.user!.email : order.guestEmail;
});
```

### 3. Cart Model Changes Needed

Update Cart model to support session-based carts:

```typescript
export interface ICart extends Document {
    storeId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId; // Optional
    sessionId?: string; // For guest carts
    items: Array<{...}>;
}

const CartSchema = new Schema<ICart>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Changed
    },
    sessionId: {
        type: String,
        required: false,
        index: true,
    },
    // ...
});

// Index for guest carts
CartSchema.index({ sessionId: 1, storeId: 1 });
```

### 4. Route Changes Needed

**Current:**
```typescript
router.post('/create', authenticate, validate(createOrderValidation), createOrder);
router.post('/:id/initialize-payment', authenticate, initializePayment);
router.post('/:id/payment-success', authenticate, handlePaymentSuccess);
```

**Updated:**
```typescript
import { optionalAuth } from '../middleware/auth';

router.post('/create', optionalAuth, validate(createOrderValidation), createOrder);
router.post('/:id/initialize-payment', optionalAuth, initializePayment);
router.post('/:id/payment-success', optionalAuth, handlePaymentSuccess);
router.post('/:id/payment-failed', optionalAuth, handlePaymentFailed);
```

### 5. Validation Updates

Add `guestEmail` to validation:

```typescript
export const createOrderValidation = [
    body('storeId').isMongoId(),
    body('guestEmail')
        .optional()
        .isEmail()
        .withMessage('Valid email is required for guest checkout'),
    body('sessionId')
        .optional()
        .isString(),
    // ... other validations
];
```

## Guest Checkout Flow

### Frontend Implementation

```javascript
// 1. Add items to cart (with sessionId for guests)
await fetch('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({
        storeId: 'store_123',
        sessionId: getSessionId(), // Generate and store in localStorage
        productId: 'product_123',
        quantity: 1
    })
});

// 2. Guest checkout
const order = await fetch('/api/orders/create', {
    method: 'POST',
    // NO Authorization header for guests
    body: JSON.stringify({
        storeId: 'store_123',
        sessionId: getSessionId(),
        guestEmail: 'guest@example.com', // Required for guests
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'guest@example.com',
            // ...
        },
        billingAddress: { /* ... */ },
        paymentMethod: 'razorpay'
    })
});

// 3. Initialize payment (no auth needed)
const payment = await fetch(`/api/orders/${order.id}/initialize-payment`, {
    method: 'POST',
    body: JSON.stringify({
        guestEmail: 'guest@example.com' // For verification
    })
});

// 4. Complete payment
// ... same as before

// 5. Optional: Create account after purchase
await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
        email: 'guest@example.com',
        password: 'newpassword',
        linkOrderNumber: order.orderNumber // Link guest order to new account
    })
});
```

## Order Tracking for Guests

```typescript
/**
 * @route   POST /api/orders/track-guest
 * @desc    Track order for guest users
 * @access  Public
 */
export const trackGuestOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, email } = req.body;
    
    const order = await Order.findOne({
        orderNumber,
        guestEmail: email.toLowerCase()
    }).select('orderNumber status paymentStatus trackingNumber shippedAt deliveredAt');
    
    if (!order) {
        throw new AppError('Order not found or email does not match', 404);
    }
    
    res.json({
        success: true,
        data: order
    });
});
```

## Session Management

### Generate Session ID (Frontend)

```javascript
function getSessionId() {
    let sessionId = localStorage.getItem('guestSessionId');
    
    if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guestSessionId', sessionId);
    }
    
    return sessionId;
}
```

### Merge Cart on Login

```typescript
/**
 * Merge guest cart with user cart on login
 */
export const mergeGuestCart = async (userId: string, sessionId: string, storeId: string) => {
    const guestCart = await Cart.findOne({ sessionId, storeId });
    const userCart = await Cart.findOne({ userId, storeId });
    
    if (guestCart) {
        if (userCart) {
            // Merge items
            for (const guestItem of guestCart.items) {
                const existingItem = userCart.items.find(
                    item => item.productId.toString() === guestItem.productId.toString()
                );
                
                if (existingItem) {
                    existingItem.quantity += guestItem.quantity;
                } else {
                    userCart.items.push(guestItem);
                }
            }
            await userCart.save();
            await Cart.findByIdAndDelete(guestCart._id);
        } else {
            // Convert guest cart to user cart
            guestCart.userId = new mongoose.Types.ObjectId(userId);
            guestCart.sessionId = undefined;
            await guestCart.save();
        }
    }
};
```

## Benefits

✅ **Reduced Friction** - No forced registration  
✅ **Higher Conversion** - Industry standard shows 23% increase  
✅ **Better UX** - Users can checkout quickly  
✅ **Optional Account** - Can create account after purchase  
✅ **Order Tracking** - Guests can track via email + order number  

## Security Considerations

1. **Email Verification** - Guests verify orders using email
2. **Rate Limiting** - Prevent abuse of guest checkout
3. **Session Expiry** - Guest carts expire after 24 hours
4. **No Sensitive Data** - Don't store payment details for guests

## Next Steps

1. Update Cart model to support `sessionId`
2. Update order controller functions
3. Update routes to use `optionalAuth`
4. Add guest order tracking endpoint
5. Implement cart merging on login
6. Update frontend to handle guest checkout

---

**This implementation allows both logged-in and guest users to complete purchases!** 🎉
