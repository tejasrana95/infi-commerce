import { Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import ShippingRule from '../models/ShippingRule';
import GeoGroup from '../models/GeoGroup';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { invalidateShippingCache } from '../utils/cache-invalidation';
import { addPricingToProduct } from './product.controller';

// Validation rules
export const createShippingRuleValidation = [
    body('name').trim().notEmpty().withMessage('Shipping rule name is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('rateType').isIn(['flat', 'per_kg', 'free', 'percentage']).withMessage('Invalid rate type'),
    body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
];

export const updateShippingRuleValidation = [
    param('id').isMongoId().withMessage('Valid shipping rule ID is required'),
];

export const calculateShippingValidation = [
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
];

/**
 * @swagger
 * /api/shipping/rules:
 *   post:
 *     summary: Create a new shipping rule
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 */
export const createShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ruleData = req.body;

    // Verify store exists
    const store = await Store.findById(ruleData.storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Verify geoGroup if provided
    if (ruleData.geoGroupId) {
        const geoGroup = await GeoGroup.findById(ruleData.geoGroupId);
        if (!geoGroup) {
            throw new AppError('GeoGroup not found', 404);
        }
    }

    const shippingRule = await ShippingRule.create(ruleData);

    // Invalidate shipping cache for this store
    await invalidateShippingCache(ruleData.storeId);

    res.status(201).json({
        success: true,
        message: 'Shipping rule created successfully',
        data: shippingRule,
    });
});

/**
 * @swagger
 * /api/shipping/rules:
 *   get:
 *     summary: Get all shipping rules
 *     tags: [Shipping]
 */
export const getShippingRules = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const [shippingRules, total] = await Promise.all([
        ShippingRule.find(filter)
            .populate('storeId', 'name slug')
            .populate('geoGroupId', 'name countries')
            .populate('categoryIds', 'title')
            .sort({ priority: -1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        ShippingRule.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: shippingRules,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   get:
 *     summary: Get shipping rule by ID
 *     tags: [Shipping]
 */
export const getShippingRuleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findById(req.params.id)
        .populate('storeId', 'name slug')
        .populate('geoGroupId', 'name countries')
        .populate('categoryIds', 'title');

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    res.json({
        success: true,
        data: shippingRule
    });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   put:
 *     summary: Update shipping rule
 *     tags: [Shipping]
 */
export const updateShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate('storeId', 'name slug')
        .populate('geoGroupId', 'name countries')
        .populate('categoryIds', 'title');

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    // Invalidate shipping cache for this store
    await invalidateShippingCache(shippingRule.storeId.toString());

    res.json({
        success: true,
        message: 'Shipping rule updated successfully',
        data: shippingRule,
    });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   delete:
 *     summary: Delete shipping rule
 *     tags: [Shipping]
 */
export const deleteShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findByIdAndDelete(req.params.id);

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    // Invalidate shipping cache for this store
    await invalidateShippingCache(shippingRule.storeId.toString());

    res.json({
        success: true,
        message: 'Shipping rule deleted successfully',
    });
});

/**
 * Calculate total weight and value from cart items
 * Properly handles variant weights and prices
 */
const calculateCartTotals = async (cartItems: any[]) => {
    let totalWeight = 0;
    let totalValue = 0;
    const itemCategories: string[] = [];

    for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        // Skip digital products - they don't require shipping
        if (product.type === 'digital') {
            continue;
        }

        let itemWeight = product.weight || 0;
        let itemPrice = product.salePrice || product.price;

        // If it's a variable product with variant, get variant-specific values
        if (item.variantId && product.variants && product.variants.length > 0) {
            const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                if (variant.weight) itemWeight = variant.weight;
                if (variant.salePrice) itemPrice = variant.salePrice;
                else if (variant.price) itemPrice = variant.price;
            }
        }

        totalWeight += itemWeight * item.quantity;
        totalValue += itemPrice * item.quantity;

        // Collect category IDs
        if (product.categoryIds) {
            product.categoryIds.forEach((catId: any) => {
                const catIdStr = catId.toString();
                if (!itemCategories.includes(catIdStr)) {
                    itemCategories.push(catIdStr);
                }
            });
        }
    }

    return { totalWeight, totalValue, itemCategories };
};

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calculate shipping cost for cart
 *     tags: [Shipping]
 */
export const calculateShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { country, storeId, cartId, items } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    let cartItems: any[] = [];
    let orderValue = 0;

    // Get cart or use provided items
    if (items && Array.isArray(items)) {
        // Direct items from order creation
        cartItems = items;
        orderValue = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    } else {
        // Get from cart
        let cart;
        if (cartId) {
            cart = await Cart.findById(cartId).populate('items.productId');
        } else if (userId) {
            cart = await Cart.findOne({ userId, storeId }).populate('items.productId');
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId, storeId }).populate('items.productId');
        }

        if (!cart || cart.items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        cartItems = cart.items;
        orderValue = cart.subtotal;
    }

    // Calculate totals from cart items
    const { totalWeight, totalValue, itemCategories } = await calculateCartTotals(cartItems);
    const finalOrderValue = totalValue || orderValue;

    // Find applicable shipping rules
    const shippingRules = await ShippingRule.find({
        storeId,
        isActive: true,
    })
        .populate('geoGroupId')
        .sort({ priority: -1 });

    const applicableRules: any[] = [];

    for (const rule of shippingRules) {
        let isApplicable = true;

        // Check GeoGroup (country matching)
        if (rule.geoGroupId) {
            const geoGroup = rule.geoGroupId as any;
            if (geoGroup.countries && geoGroup.countries.length > 0) {
                if (!geoGroup.countries.includes(country.toUpperCase())) {
                    isApplicable = false;
                }
            }
        }

        // Check category restrictions
        if (isApplicable && rule.categoryIds && rule.categoryIds.length > 0) {
            const ruleCategoryIds = rule.categoryIds.map((id: any) => id.toString());
            const hasMatchingCategory = itemCategories.some(catId => ruleCategoryIds.includes(catId));
            if (!hasMatchingCategory) {
                isApplicable = false;
            }
        }

        // Check weight conditions
        if (isApplicable && rule.minWeight !== undefined) {
            if (totalWeight < rule.minWeight) isApplicable = false;
        }
        if (isApplicable && rule.maxWeight !== undefined) {
            if (totalWeight > rule.maxWeight) isApplicable = false;
        }

        // Check order value conditions
        if (isApplicable && rule.minOrderValue !== undefined) {
            if (finalOrderValue < rule.minOrderValue) isApplicable = false;
        }
        if (isApplicable && rule.maxOrderValue !== undefined) {
            if (finalOrderValue > rule.maxOrderValue) isApplicable = false;
        }

        if (isApplicable) {
            // Calculate shipping cost based on rate type
            let cost = 0;

            switch (rule.rateType) {
                case 'flat':
                    cost = rule.rate;
                    break;
                case 'per_kg':
                    // Rate per kg multiplied by total weight
                    cost = rule.rate * totalWeight;
                    break;
                case 'free':
                    cost = 0;
                    break;
                case 'percentage':
                    // Percentage of order value
                    cost = (finalOrderValue * rule.rate) / 100;
                    break;
            }

            applicableRules.push({
                ruleId: rule._id,
                name: rule.name,
                description: rule.description,
                cost: parseFloat(cost.toFixed(2)),
                rateType: rule.rateType,
                rate: rule.rate,
            });
        }
    }

    if (applicableRules.length === 0) {
        // Return empty options instead of error
        res.json({
            success: true,
            shippingOptions: [],
            orderSummary: {
                subtotal: finalOrderValue,
                totalWeight,
                itemCount: cartItems.length,
            },
        });
        return;
    }

    res.json({
        success: true,
        shippingOptions: applicableRules,
        orderSummary: {
            subtotal: finalOrderValue,
            totalWeight,
            itemCount: cartItems.length,
        },
    });
});

/**
 * @swagger
 * /api/shipping/apply:
 *   post:
 *     summary: Apply shipping method to cart
 *     tags: [Shipping]
 */
export const applyShippingToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingRuleId, shippingCost, shippingAddress, storeId } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    // Get shipping rule
    const shippingRule = await ShippingRule.findById(shippingRuleId);
    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    // Update cart with shipping information
    cart.shippingAddress = shippingAddress;
    cart.shippingMethod = {
        ruleId: shippingRule._id as any,
        name: shippingRule.name,
        cost: shippingCost,
        estimatedDays: '3-5 business days',
        rateType: shippingRule.rateType,
        rate: shippingRule.rate,
    };
    cart.shippingCost = shippingCost;

    await cart.save();

    res.json({
        success: true,
        message: 'Shipping applied to cart',
        data: cart,
    });
});

/**
 * @swagger
 * /api/shipping/cart/summary:
 *   get:
 *     summary: Get cart summary with shipping
 *     tags: [Shipping]
 */
export const getCartSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.query.storeId;

    const filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId', 'name images');

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    res.json({
        success: true,
        data: {
            subtotal: cart.subtotal,
            shippingCost: cart.shippingCost || 0,
            tax: cart.tax || 0,
            total: cart.total,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            shippingMethod: cart.shippingMethod,
            shippingAddress: cart.shippingAddress,
        },
    });
});

/**
 * Middleware to inject storeId from header into body before validation
 * This allows validation to pass when storeId is sent via X-Store-ID header
 */
export const injectStoreIdFromHeader = (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.body.storeId && req.headers['x-store-id']) {
        req.body.storeId = req.headers['x-store-id'];
    }
    next();
};

/**
 * Validation for smart shipping calculation
 * Note: storeId can come from either body or X-Store-ID header (injected by middleware)
 */
export const calculateSmartShippingValidation = [
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

/**
 * @swagger
 * /api/shipping/calculate-smart:
 *   post:
 *     summary: Calculate shipping with split calculation (category priority > geo > fallback)
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeId: { type: string }
 *               country: { type: string }
 *               items: { type: array, items: { type: object, properties: { productId: { type: string }, variantId: { type: string }, quantity: { type: integer } } } }
 */
export const calculateSmartShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
    // storeId is now guaranteed to be in body (injected from header if needed)
    const { country, storeId, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Items are required', 400);
    }

    // Step 1: Fetch all products with their categories and weights
    interface ItemDetails {
        productId: string;
        variantId?: string;
        quantity: number;
        weight: number;
        price: number;
        categoryIds: string[];
        product: any;
    }

    const itemDetails: ItemDetails[] = [];
    let totalSubtotal = 0;
    const restrictedItems: string[] = []; // Track restricted items

    for (const item of items) {
        const product = await Product.findById(item.productId).populate('taxClassId');
        if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        // Skip digital products - they don't require shipping
        if (product.type === 'digital') {
            continue;
        }

        // Check if product can ship to this location
        // Note: country is available from req.body
        if (!product.canShipTo(country)) {
            restrictedItems.push(product.name);
        }

        // Add pricing information to product (including variant sale prices)
        const productWithPricing = addPricingToProduct(product.toObject());

        let itemWeight = productWithPricing.weight || 0;
        let itemPrice = productWithPricing.salePrice || productWithPricing.price;

        // Handle variant-specific values
        if (item.variantId && productWithPricing.variants && productWithPricing.variants.length > 0) {
            const variant = productWithPricing.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                if (variant.weight) itemWeight = variant.weight;
                itemPrice = variant.pricing?.salePrice || variant.salePrice || variant.price;
            }
        }

        const categoryIds = product.categoryIds?.map((id: any) => id.toString()) || [];

        itemDetails.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            weight: itemWeight * item.quantity,
            price: itemPrice * item.quantity,
            categoryIds,
            product,
        });

        totalSubtotal += itemPrice * item.quantity;
    }

    // If there are restricted items, return them
    if (restrictedItems.length > 0) {
        res.status(200).json({
            success: false,
            restrictedItems,
            shippingMethods: []
        });
        return;
    }

    // Step 2: Fetch all active shipping rules for the store
    const shippingRules = await ShippingRule.find({
        storeId,
        isActive: true,
    })
        .populate('geoGroupId')
        .sort({ priority: -1 });

    if (shippingRules.length === 0) {
        res.json({
            success: true,
            message: 'No shipping rules configured',
            shippingCost: 0,
            breakdown: [],
            orderSummary: { subtotal: totalSubtotal, totalWeight: itemDetails.reduce((sum, i) => sum + i.weight, 0) },
        });
        return;
    }

    // Step 3: Categorize rules into category-specific and geo-based
    interface RuleInfo {
        rule: any;
        categoryIds: string[];
        matchesGeo: boolean;
        isUniversal: boolean; // No category or geo restriction
    }

    const categorizedRules: RuleInfo[] = [];

    for (const rule of shippingRules) {
        let matchesGeo = true;

        // Check geo matching
        if (rule.geoGroupId) {
            const geoGroup = rule.geoGroupId as any;
            if (geoGroup.countries && geoGroup.countries.length > 0) {
                matchesGeo = geoGroup.countries.includes(country.toUpperCase());
            }
        }

        const ruleCategories = rule.categoryIds?.map((id: any) => id.toString()) || [];
        const hasCategories = ruleCategories.length > 0;
        const hasGeo = !!rule.geoGroupId;

        // Only include rules that match geo (or have no geo restriction)
        if (!hasGeo || matchesGeo) {
            categorizedRules.push({
                rule,
                categoryIds: ruleCategories,
                matchesGeo,
                isUniversal: !hasCategories && !hasGeo,
            });
        }
    }

    // Step 4: Apply split calculation with priority
    interface ShippingBreakdown {
        itemProductIds: string[];
        ruleName: string;
        ruleDescription?: string;
        ruleId: string;
        ruleType: 'category' | 'geo' | 'universal';
        weight: number;
        value: number;
        cost: number;
        rateType: string;
        rate: number;
    }

    const breakdown: ShippingBreakdown[] = [];
    const processedItems = new Set<number>();

    interface ItemShippingAllocation {
        productId: string;
        variantId?: string;
        quantity: number;
        shippingCostPerUnit: number;
        shippingCostTotal: number;
        ruleId: string;
        ruleName: string;
    }

    const itemShippingAllocations: ItemShippingAllocation[] = [];

    // Helper function to calculate cost for a group of items
    const calculateCostForItems = (
        itemsToProcess: ItemDetails[],
        rule: any
    ): number => {
        const groupWeight = itemsToProcess.reduce((sum, item) => sum + item.weight, 0);
        const groupValue = itemsToProcess.reduce((sum, item) => sum + item.price, 0);

        let cost = 0;
        switch (rule.rateType) {
            case 'flat':
                cost = rule.rate;
                break;
            case 'per_kg':
                cost = rule.rate * groupWeight;
                break;
            case 'free':
                cost = 0;
                break;
            case 'percentage':
                cost = (groupValue * rule.rate) / 100;
                break;
        }

        // Apply minimum charge if specified and cost is below it
        if (rule.minCharge !== undefined && rule.minCharge > 0 && cost < rule.minCharge) {
            cost = rule.minCharge;
        }

        return parseFloat(cost.toFixed(2));
    };

    // Allocate rule cost to individual items based on rate type
    const allocateCostToItems = (
        itemsToProcess: ItemDetails[],
        rule: any,
        groupCost: number
    ) => {
        if (!itemsToProcess.length || groupCost <= 0) return;

        const totalQty = itemsToProcess.reduce((sum, i) => sum + i.quantity, 0);
        const totalWeight = itemsToProcess.reduce((sum, i) => sum + i.weight, 0);
        const totalValue = itemsToProcess.reduce((sum, i) => sum + i.price, 0);

        // Basis selection: flat -> quantity, per_kg -> weight (fallback to qty), percentage -> value (fallback to qty)
        let basis: 'quantity' | 'weight' | 'value' = 'quantity';
        if (rule.rateType === 'per_kg' && totalWeight > 0) basis = 'weight';
        else if (rule.rateType === 'percentage' && totalValue > 0) basis = 'value';

        const denominator = basis === 'weight' ? totalWeight : basis === 'value' ? totalValue : totalQty;
        let remaining = groupCost;

        itemsToProcess.forEach((item, idx) => {
            const numerator = basis === 'weight' ? item.weight : basis === 'value' ? item.price : item.quantity;

            let itemShare = 0;
            if (denominator > 0) {
                if (idx === itemsToProcess.length - 1) {
                    // Give remainder to last item to preserve totals after rounding
                    itemShare = parseFloat(remaining.toFixed(2));
                } else {
                    itemShare = parseFloat(((groupCost * numerator) / denominator).toFixed(2));
                    remaining -= itemShare;
                }
            }

            const perUnitShare = item.quantity > 0 ? parseFloat((itemShare / item.quantity).toFixed(4)) : 0;

            itemShippingAllocations.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                shippingCostPerUnit: perUnitShare,
                shippingCostTotal: itemShare,
                ruleId: rule._id.toString(),
                ruleName: rule.name,
            });
        });
    };

    // Priority 1: Category-specific rules (most specific)
    const categoryRules = categorizedRules.filter(r => r.categoryIds.length > 0);

    for (const ruleInfo of categoryRules) {
        const matchingItems: { item: ItemDetails; index: number }[] = [];

        itemDetails.forEach((item, idx) => {
            if (processedItems.has(idx)) return;

            // Check if any of item's categories match rule's categories
            const hasMatchingCategory = item.categoryIds.some(catId =>
                ruleInfo.categoryIds.includes(catId)
            );

            if (hasMatchingCategory) {
                matchingItems.push({ item, index: idx });
            }
        });

        if (matchingItems.length > 0) {
            const itemsToProcess = matchingItems.map(m => m.item);
            const cost = calculateCostForItems(itemsToProcess, ruleInfo.rule);

            allocateCostToItems(itemsToProcess, ruleInfo.rule, cost);

            breakdown.push({
                itemProductIds: itemsToProcess.map(i => i.productId),
                ruleName: ruleInfo.rule.name,
                ruleDescription: ruleInfo.rule.description,
                ruleId: ruleInfo.rule._id.toString(),
                ruleType: 'category',
                weight: itemsToProcess.reduce((sum, i) => sum + i.weight, 0),
                value: itemsToProcess.reduce((sum, i) => sum + i.price, 0),
                cost,
                rateType: ruleInfo.rule.rateType,
                rate: ruleInfo.rule.rate,
            });

            // Mark items as processed
            matchingItems.forEach(m => processedItems.add(m.index));
        }
    }

    // Priority 2: Geo-based rules (for remaining items)
    const geoRules = categorizedRules.filter(r => r.categoryIds.length === 0 && r.matchesGeo && !r.isUniversal);

    const remainingItems = itemDetails.filter((_, idx) => !processedItems.has(idx));

    if (remainingItems.length > 0 && geoRules.length > 0) {
        // Use highest priority geo rule
        const geoRule = geoRules[0];
        const cost = calculateCostForItems(remainingItems, geoRule.rule);

        allocateCostToItems(remainingItems, geoRule.rule, cost);

        breakdown.push({
            itemProductIds: remainingItems.map(i => i.productId),
            ruleName: geoRule.rule.name,
            ruleDescription: geoRule.rule.description,
            ruleId: geoRule.rule._id.toString(),
            ruleType: 'geo',
            weight: remainingItems.reduce((sum, i) => sum + i.weight, 0),
            value: remainingItems.reduce((sum, i) => sum + i.price, 0),
            cost,
            rateType: geoRule.rule.rateType,
            rate: geoRule.rule.rate,
        });

        remainingItems.forEach((_, idx) => {
            const originalIdx = itemDetails.findIndex(item =>
                item === remainingItems[idx]
            );
            processedItems.add(originalIdx);
        });
    }

    // Priority 3: Universal fallback rules (no category, no geo - store default)
    const stillRemaining = itemDetails.filter((_, idx) => !processedItems.has(idx));
    const universalRules = categorizedRules.filter(r => r.isUniversal);

    if (stillRemaining.length > 0 && universalRules.length > 0) {
        const universalRule = universalRules[0];
        const cost = calculateCostForItems(stillRemaining, universalRule.rule);

        allocateCostToItems(stillRemaining, universalRule.rule, cost);

        breakdown.push({
            itemProductIds: stillRemaining.map(i => i.productId),
            ruleName: universalRule.rule.name,
            ruleDescription: universalRule.rule.description,
            ruleId: universalRule.rule._id.toString(),
            ruleType: 'universal',
            weight: stillRemaining.reduce((sum, i) => sum + i.weight, 0),
            value: stillRemaining.reduce((sum, i) => sum + i.price, 0),
            cost,
            rateType: universalRule.rule.rateType,
            rate: universalRule.rule.rate,
        });
    }

    // Calculate total shipping cost
    const totalShippingCost = breakdown.reduce((sum, b) => sum + b.cost, 0);
    const totalWeight = itemDetails.reduce((sum, i) => sum + i.weight, 0);

    // Items without any applicable rule
    const itemsWithoutRule = itemDetails.filter((_, idx) => !processedItems.has(idx));


    // Determine generic or specific name/description
    let methodName = 'Standard Shipping';
    let methodDescription = 'Calculated based on your order items';

    if (breakdown.length === 1) {
        methodName = breakdown[0].ruleName;
        methodDescription = breakdown[0].ruleDescription || methodDescription;
    } else if (breakdown.length > 1) {
        methodName = 'Combined Shipping';
        methodDescription = 'Optimized shipping for different items';
    }

    res.json({
        success: true,
        shippingCost: parseFloat(totalShippingCost.toFixed(2)),
        name: methodName,
        description: methodDescription,
        breakdown,
        itemShippingAllocations,
        itemsWithoutShipping: itemsWithoutRule.length > 0 ? itemsWithoutRule.map(i => ({
            productId: i.productId,
            productName: i.product.name,
        })) : [],
        orderSummary: {
            subtotal: totalSubtotal,
            totalWeight: parseFloat(totalWeight.toFixed(2)),
            itemCount: items.length,
            shippingCost: parseFloat(totalShippingCost.toFixed(2)),
            total: parseFloat((totalSubtotal + totalShippingCost).toFixed(2)),
        },
        calculationMethod: 'split_with_priority',
        priorityExplanation: 'Category-specific rules applied first, then geo-based rules for remaining items, then universal fallback rules.',
    });
});
