import { Response } from 'express';
import { body, param } from 'express-validator';
import Cart from '../models/Cart';
import Product from '../models/Product';
import ProductOption from '../models/ProductOption';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

/**
 * Helper function to format cart response with variant details and attribute labels
 */
async function formatCartResponse(cart: any) {
    if (!cart || !cart.items || cart.items.length === 0) {
        return cart;
    }

    const cartObj = cart.toObject();

    // Format each cart item
    const formattedItems = await Promise.all(
        cartObj.items.map(async (item: any) => {
            // If there's a variantId, get variant details from the product
            if (item.variantId && item.productId) {
                const product = await Product.findById(item.productId._id || item.productId);

                if (product && product.variants) {
                    const variant = product.variants.find((v: any) =>
                        v._id.toString() === item.variantId.toString()
                    );

                    if (variant) {
                        // Create variant object
                        item.variant = {
                            _id: (variant as any)._id,
                            name: variant.sku,
                            sku: variant.sku,
                        };

                        // Convert attribute IDs to labels
                        if (variant.attributes && product.productOptions) {
                            const attributeLabels: Record<string, string> = {};

                            for (const [optionId, value] of Object.entries(variant.attributes)) {
                                const option = await ProductOption.findById(optionId);
                                if (option) {
                                    // Find the matching option value
                                    const optionValue = option.values.find((v: any) =>
                                        v.value.toLowerCase() === (value as string).toLowerCase()
                                    );

                                    if (optionValue) {
                                        attributeLabels[option.name] = optionValue.label;
                                    }
                                }
                            }

                            // Replace attributes with labels
                            item.attributes = attributeLabels;
                        }

                        // Remove variantId field
                        delete item.variantId;
                    }
                }
            }

            return item;
        })
    );

    return {
        ...cartObj,
        items: formattedItems,
    };
}

// Validation rules
export const addToCartValidation = [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('variantId').optional().isString(),
];

export const updateCartItemValidation = [
    param('itemId').isMongoId().withMessage('Valid item ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
        throw new AppError('User ID or session ID is required', 400);
    }

    const filter: any = userId ? { userId } : { sessionId };

    let cart = await Cart.findOne(filter)
        .populate('items.productId', 'name slug images stockStatus stock manageStock variants productOptions');

    if (!cart) {
        // Create empty cart
        cart = await Cart.create({
            userId,
            sessionId,
            storeId: req.body.storeId || req.query.storeId,
            items: [],
        });
    }

    // Format cart with variant details
    const formattedCart = await formatCartResponse(cart);

    res.json({ cart: formattedCart });
});

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - storeId
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart
 */
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, variantId, quantity, storeId } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
        throw new AppError('User ID or session ID is required', 400);
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (!product.isActive) {
        throw new AppError('Product is not available', 400);
    }

    // Check stock
    let availableStock = product.stock;
    let itemPrice = (product as any).getEffectivePrice();
    let itemSku = product.sku;
    let itemImage = product.featuredImage || product.images[0];
    let itemAttributes: any = {};

    // If variant is specified, get variant details
    if (variantId && product.type === 'variable') {
        const variant = product.variants?.find((v: any) => v._id.toString() === variantId);
        if (!variant) {
            throw new AppError('Variant not found', 404);
        }
        availableStock = variant.stock;
        itemPrice = variant.salePrice || variant.price;
        itemSku = variant.sku;
        itemImage = variant.images?.[0] || itemImage;
        itemAttributes = variant.attributes;
    }

    // Check if enough stock
    if (product.manageStock && availableStock < quantity) {
        throw new AppError(`Only ${availableStock} items available in stock`, 400);
    }

    // Find or create cart
    const filter: any = userId ? { userId } : { sessionId };
    let cart = await Cart.findOne(filter);

    if (!cart) {
        cart = new Cart({
            userId,
            sessionId,
            storeId,
            items: [],
        });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
        (item: any) =>
            item.productId.toString() === productId &&
            (!variantId || item.variantId === variantId)
    );

    if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // Check stock for new quantity
        if (product.manageStock && availableStock < newQuantity) {
            throw new AppError(`Only ${availableStock} items available in stock`, 400);
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = itemPrice; // Update price in case it changed
    } else {
        // Add new item
        cart.items.push({
            productId,
            variantId,
            name: product.name,
            sku: itemSku,
            price: itemPrice,
            quantity,
            image: itemImage,
            attributes: itemAttributes,
        } as any);
    }

    await cart.save();

    // Populate and format cart
    await cart.populate('items.productId', 'name slug images stockStatus stock manageStock variants productOptions');
    const formattedCart = await formatCartResponse(cart);

    res.json({
        message: 'Item added to cart',
        cart: formattedCart,
    });
});

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated
 */
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    const item = cart.items.find((item: any) => item._id.toString() === itemId);
    if (!item) {
        throw new AppError('Item not found in cart', 404);
    }

    // Check stock
    const product = await Product.findById(item.productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    let availableStock = product.stock;
    if (item.variantId && product.type === 'variable') {
        const variant = product.variants?.find((v: any) => v._id.toString() === item.variantId);
        if (variant) {
            availableStock = variant.stock;
        }
    }

    if (product.manageStock && availableStock < quantity) {
        throw new AppError(`Only ${availableStock} items available in stock`, 400);
    }

    // Update quantity
    item.quantity = quantity;
    await cart.save();

    // Populate and format cart
    await cart.populate('items.productId', 'name slug images stockStatus stock manageStock variants productOptions');
    const formattedCart = await formatCartResponse(cart);

    res.json({
        message: 'Cart item updated',
        cart: formattedCart,
    });
});

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    cart.items = cart.items.filter((item: any) => item._id.toString() !== itemId);
    await cart.save();

    // Populate and format cart
    await cart.populate('items.productId', 'name slug images stockStatus stock manageStock variants productOptions');
    const formattedCart = await formatCartResponse(cart);

    res.json({
        message: 'Item removed from cart',
        cart: formattedCart,
    });
});

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart cleared
 */
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    cart.items = [];
    await cart.save();

    // Populate and format cart
    await cart.populate('items.productId', 'name slug images stockStatus stock manageStock variants productOptions');
    const formattedCart = await formatCartResponse(cart);

    res.json({
        message: 'Cart cleared',
        cart: formattedCart,
    });
});

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart after login
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carts merged successfully
 */
export const mergeCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('User must be authenticated', 401);
    }

    // Get guest cart
    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) {
        // No guest cart to merge
        const userCart = await Cart.findOne({ userId });
        res.json({
            message: 'No guest cart to merge',
            cart: userCart,
        });
        return;
    }

    // Get or create user cart
    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
        // Convert guest cart to user cart
        guestCart.userId = userId as any;
        guestCart.sessionId = undefined;
        await guestCart.save();

        res.json({
            message: 'Cart merged successfully',
            cart: guestCart,
        });
        return;
    }

    // Merge items
    for (const guestItem of guestCart.items) {
        const existingItemIndex = userCart.items.findIndex(
            (item: any) =>
                item.productId.toString() === guestItem.productId.toString() &&
                item.variantId === guestItem.variantId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            userCart.items[existingItemIndex].quantity += guestItem.quantity;
        } else {
            // Add new item
            userCart.items.push(guestItem as any);
        }
    }

    await userCart.save();

    // Delete guest cart
    await guestCart.deleteOne();

    res.json({
        message: 'Cart merged successfully',
        cart: userCart,
    });
});

/**
 * @swagger
 * /api/cart/count:
 *   get:
 *     summary: Get cart item count
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart count retrieved
 */
export const getCartCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

    res.json({ count });
});

/**
 * @swagger
 * /api/cart/validate:
 *   post:
 *     summary: Validate cart items (check stock, prices)
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart validation results
 */
export const validateCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    const validationResults: any[] = [];
    let hasErrors = false;

    for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        const result: any = {
            itemId: (item as any)._id,
            productId: item.productId,
            valid: true,
            errors: [],
        };

        if (!product) {
            result.valid = false;
            result.errors.push('Product no longer exists');
            hasErrors = true;
        } else {
            // Check if product is active
            if (!product.isActive) {
                result.valid = false;
                result.errors.push('Product is no longer available');
                hasErrors = true;
            }

            // Check stock
            let availableStock = product.stock;
            let currentPrice = (product as any).getEffectivePrice();

            if (item.variantId && product.type === 'variable') {
                const variant = product.variants?.find((v: any) => v._id.toString() === item.variantId);
                if (!variant) {
                    result.valid = false;
                    result.errors.push('Variant no longer exists');
                    hasErrors = true;
                } else {
                    availableStock = variant.stock;
                    currentPrice = variant.salePrice || variant.price;
                }
            }

            if (product.manageStock && availableStock < item.quantity) {
                result.valid = false;
                result.errors.push(`Only ${availableStock} items available (you have ${item.quantity} in cart)`);
                result.availableStock = availableStock;
                hasErrors = true;
            }

            // Check if price changed
            if (currentPrice !== item.price) {
                result.priceChanged = true;
                result.oldPrice = item.price;
                result.newPrice = currentPrice;
                // Update price in cart
                item.price = currentPrice;
            }
        }

        validationResults.push(result);
    }

    // Save cart if prices were updated
    if (validationResults.some((r) => r.priceChanged)) {
        await cart.save();
    }

    res.json({
        valid: !hasErrors,
        cart,
        validationResults,
    });

    return;
});
