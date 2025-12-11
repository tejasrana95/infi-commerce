import { Response } from 'express';
import { body } from 'express-validator';
import ShippingRule from '../models/ShippingRule';
import Cart from '../models/Cart';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createShippingRuleValidation = [
    body('name').trim().notEmpty().withMessage('Shipping rule name is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('rateType').isIn(['flat', 'per_kg', 'free', 'percentage']).withMessage('Invalid rate type'),
    body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - storeId
 *               - rateType
 *               - rate
 *               - currency
 *             properties:
 *               name:
 *                 type: string
 *                 example: Standard Shipping
 *               storeId:
 *                 type: string
 *               rateType:
 *                 type: string
 *                 enum: [flat, per_kg, free, percentage]
 *               rate:
 *                 type: number
 *                 example: 10
 *               currency:
 *                 type: string
 *                 example: USD
 *               conditions:
 *                 type: object
 *                 properties:
 *                   countries:
 *                     type: array
 *                     items:
 *                       type: string
 *                   minOrderValue:
 *                     type: number
 *     responses:
 *       201:
 *         description: Shipping rule created successfully
 */
export const createShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ruleData = req.body;

    // Verify store exists
    const store = await Store.findById(ruleData.storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const shippingRule = await ShippingRule.create(ruleData);

    res.status(201).json({
        message: 'Shipping rule created successfully',
        shippingRule,
    });
});

/**
 * @swagger
 * /api/shipping/rules:
 *   get:
 *     summary: Get all shipping rules
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Shipping rules retrieved successfully
 */
export const getShippingRules = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    const shippingRules = await ShippingRule.find(filter)
        .populate('storeId', 'name slug')
        .sort({ priority: -1, createdAt: -1 });

    res.json({ shippingRules });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   get:
 *     summary: Get shipping rule by ID
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping rule retrieved successfully
 */
export const getShippingRuleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findById(req.params.id).populate('storeId', 'name slug');

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    res.json({ shippingRule });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   put:
 *     summary: Update shipping rule
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Shipping rule updated successfully
 */
export const updateShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    res.json({
        message: 'Shipping rule updated successfully',
        shippingRule,
    });
});

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   delete:
 *     summary: Delete shipping rule
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping rule deleted successfully
 */
export const deleteShippingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shippingRule = await ShippingRule.findByIdAndDelete(req.params.id);

    if (!shippingRule) {
        throw new AppError('Shipping rule not found', 404);
    }

    res.json({
        message: 'Shipping rule deleted successfully',
    });
});

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calculate shipping cost for cart
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *               - storeId
 *             properties:
 *               country:
 *                 type: string
 *                 example: US
 *               state:
 *                 type: string
 *                 example: CA
 *               city:
 *                 type: string
 *               storeId:
 *                 type: string
 *               cartId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping cost calculated successfully
 */
export const calculateShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { country, state, city, storeId, cartId } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get cart
    let cart;
    if (cartId) {
        cart = await Cart.findById(cartId).populate('items.productId');
    } else {
        const filter: any = userId ? { userId } : { sessionId };
        cart = await Cart.findOne(filter).populate('items.productId');
    }

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Calculate total weight and order value
    let totalWeight = 0;
    const orderValue = cart.subtotal;

    for (const item of cart.items) {
        const product = item.productId as any;
        if (product && product.weight) {
            totalWeight += product.weight * item.quantity;
        }
    }

    // Find applicable shipping rules
    const shippingRules = await ShippingRule.find({
        storeId,
        isActive: true,
    }).sort({ priority: -1 });

    const applicableRules: any[] = [];

    for (const rule of shippingRules) {
        let isApplicable = true;

        // Check country
        if (rule.conditions.countries && rule.conditions.countries.length > 0) {
            if (!rule.conditions.countries.includes(country.toUpperCase())) {
                isApplicable = false;
            }
        }

        // Check state
        if (isApplicable && rule.conditions.states && rule.conditions.states.length > 0) {
            if (!state || !rule.conditions.states.includes(state.toUpperCase())) {
                isApplicable = false;
            }
        }

        // Check city
        if (isApplicable && rule.conditions.cities && rule.conditions.cities.length > 0) {
            if (!city || !rule.conditions.cities.includes(city)) {
                isApplicable = false;
            }
        }

        // Check weight
        if (isApplicable && rule.conditions.minWeight !== undefined) {
            if (totalWeight < rule.conditions.minWeight) {
                isApplicable = false;
            }
        }
        if (isApplicable && rule.conditions.maxWeight !== undefined) {
            if (totalWeight > rule.conditions.maxWeight) {
                isApplicable = false;
            }
        }

        // Check order value
        if (isApplicable && rule.conditions.minOrderValue !== undefined) {
            if (orderValue < rule.conditions.minOrderValue) {
                isApplicable = false;
            }
        }
        if (isApplicable && rule.conditions.maxOrderValue !== undefined) {
            if (orderValue > rule.conditions.maxOrderValue) {
                isApplicable = false;
            }
        }

        if (isApplicable) {
            // Calculate shipping cost based on rate type
            let cost = 0;

            switch (rule.rateType) {
                case 'flat':
                    cost = rule.rate;
                    break;
                case 'per_kg':
                    cost = rule.rate * totalWeight;
                    break;
                case 'free':
                    cost = 0;
                    break;
                case 'percentage':
                    cost = (orderValue * rule.rate) / 100;
                    break;
            }

            applicableRules.push({
                ruleId: rule._id,
                name: rule.name,
                description: rule.description,
                cost: parseFloat(cost.toFixed(2)),
                currency: rule.currency,
                rateType: rule.rateType,
                estimatedDays: '3-5 business days', // Can be customized per rule
            });
        }
    }

    if (applicableRules.length === 0) {
        throw new AppError('No shipping options available for this location', 400);
    }

    res.json({
        shippingOptions: applicableRules,
        orderSummary: {
            subtotal: cart.subtotal,
            totalWeight,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
    });
});

/**
 * @swagger
 * /api/shipping/apply:
 *   post:
 *     summary: Apply shipping method to cart
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingRuleId
 *               - shippingCost
 *               - shippingAddress
 *             properties:
 *               shippingRuleId:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shipping applied to cart
 */
export const applyShippingToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingRuleId, shippingCost, shippingAddress } = req.body;
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    // Get cart
    const filter: any = userId ? { userId } : { sessionId };
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
    };
    cart.shippingCost = shippingCost;

    await cart.save();

    res.json({
        message: 'Shipping applied to cart',
        cart,
    });
});

/**
 * @swagger
 * /api/shipping/cart/summary:
 *   get:
 *     summary: Get cart summary with shipping
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: Cart summary retrieved
 */
export const getCartSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const filter: any = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(filter).populate('items.productId', 'name images');

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    res.json({
        summary: {
            subtotal: cart.subtotal,
            shippingCost: cart.shippingCost || 0,
            tax: cart.tax || 0,
            total: cart.total,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            shippingMethod: cart.shippingMethod,
            shippingAddress: cart.shippingAddress,
        },
        cart,
    });
});
