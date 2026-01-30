import { Response } from 'express';
import { body } from 'express-validator';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Customer from '../models/Customer';
import Store from '../models/Store';
import ShippingRule from '../models/ShippingRule';
import TaxRate from '../models/TaxRate';
import Coupon from '../models/Coupon';
import ProductOption from '../models/ProductOption';

import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { queueOrderConfirmation } from '../services/notification-queue.service';
import { notificationService } from '../services/notification.service';
import InventoryService from '../services/inventory.service';
import { addPricingToProduct } from './product.controller';
import ReturnWindowService from '../services/return-window.service';

/**
 * Validation rules
 */
export const addAddressValidation = [
    body('type').isIn(['shipping', 'billing']).withMessage('Type must be shipping or billing'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('address1').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
];

export const applyCouponValidation = [
    body('couponCode').trim().notEmpty().withMessage('Coupon code is required'),
];

/**
 * @route   POST /api/checkout/validate
 * @desc    Validate cart before starting checkout
 * @access  Public (optionalAuth)
 */
export const validateCheckout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;

    if (!userId && !sessionId) {
        throw new AppError('User ID or session ID is required', 400);
    }

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    // Get store configuration
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId', 'name slug images price salePrice stock manageStock isActive variants');

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Validate cart items
    const issues: string[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
        // We need the full product with variants to validate correctly
        let product = item.productId as any;

        // Fetch fresh product to ensure variants are loaded
        if (product && (product._id || typeof product === 'string')) {
            const productId = product._id || product;
            // Explicitly fetch product to guarantee we have all fields including variants
            const freshProduct = await Product.findById(productId).populate('taxClassId');
            if (freshProduct) {
                product = freshProduct;
            }
        }

        if (!product) {
            issues.push(`Product not found for item: ${item.name}`);
            continue;
        }

        if (!product.isActive) {
            issues.push(`${product.name} is no longer available`);
            continue;
        }

        if (product.manageStock && product.stock < item.quantity) {
            issues.push(`Only ${product.stock} units available for ${product.name}`);
        }

        // Add pricing information to product (including variant sale prices)
        const productWithPricing = addPricingToProduct(product.toObject());

        // Get price - check for variant pricing first
        let itemPrice = productWithPricing.salePrice || productWithPricing.price;

        // Handle variant pricing
        if (item.variantId && productWithPricing.variants && productWithPricing.variants.length > 0) {
            const variant = productWithPricing.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                itemPrice = variant.pricing?.salePrice || variant.salePrice || variant.price;
            }
        }

        subtotal += itemPrice * item.quantity;
    }

    // Check min/max order amounts
    if (store.settings?.minOrderAmount && subtotal < store.settings.minOrderAmount) {
        issues.push(`Minimum order amount is ${store.settings.minOrderAmount}`);
    }

    if (store.settings?.maxOrderAmount && subtotal > store.settings.maxOrderAmount) {
        issues.push(`Maximum order amount is ${store.settings.maxOrderAmount}`);
    }

    res.json({
        valid: issues.length === 0,
        cart: {
            items: cart.items,
            subtotal,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        storeConfig: {
            guestCheckoutEnabled: store.settings?.allowGuestCheckout ?? true,
            shippingEnabled: store.settings?.shippingEnabled ?? true,
            minOrderAmount: store.settings?.minOrderAmount,
            maxOrderAmount: store.settings?.maxOrderAmount,
            requireEmailVerification: store.settings?.requireEmailVerification ?? false,
        },
        issues,
    });
});

/**
 * @route   GET /api/checkout/addresses
 * @desc    Get saved addresses for logged-in user
 * @access  Private
 */
export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    const customer = await Customer.findById(userId).select('addresses');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    res.json({
        addresses: customer.addresses || [],
    });
});

/**
 * @route   POST /api/checkout/addresses
 * @desc    Add new address for logged-in user
 * @access  Private
 */
export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    const customer = await Customer.findById(userId);

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    const { type, firstName, lastName, address1, address2, city, state, country, postalCode, phone, isDefault } = req.body;

    // If this is set as default, unset other defaults of the same type
    if (isDefault) {
        customer.addresses.forEach((addr: any) => {
            if (addr.type === type) {
                addr.isDefault = false;
            }
        });
    }

    // Add new address
    customer.addresses.push({
        type,
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        country,
        postalCode,
        phone,
        isDefault: isDefault || false,
    } as any);

    await customer.save();

    res.status(201).json({
        success: true,
        message: 'Address added successfully',
        address: customer.addresses[customer.addresses.length - 1],
    });
});

/**
 * @route   POST /api/checkout/shipping-methods
 * @desc    Calculate available shipping methods
 * @access  Public (optionalAuth)
 */
export const getShippingMethods = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;
    const { shippingAddress } = req.body;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!shippingAddress || !shippingAddress.country) {
        throw new AppError('Shipping address is required', 400);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Calculate cart totals
    let totalWeight = 0;
    let totalValue = 0;
    const itemCategories: string[] = [];

    for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        // Check if product can ship to this location
        if (!product.canShipTo(shippingAddress.country, shippingAddress.state, shippingAddress.city)) {
            throw new AppError(`One or more products cannot ship to your selected location (${product.name})`, 400);
        }

        let itemWeight = product.weight || 0;
        let itemPrice = product.salePrice || product.price;

        // Handle variant-specific values
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

    // Find applicable shipping rules
    const shippingRules = await ShippingRule.find({
        storeId,
        isActive: true,
    })
        .populate('geoGroupId')
        .sort({ priority: -1 });

    const methods: any[] = [];

    for (const rule of shippingRules) {
        let isApplicable = true;

        // Check GeoGroup (country matching)
        if (rule.geoGroupId) {
            const geoGroup = rule.geoGroupId as any;
            if (geoGroup.countries && geoGroup.countries.length > 0) {
                if (!geoGroup.countries.includes(shippingAddress.country.toUpperCase())) {
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
        if (isApplicable && rule.minWeight !== undefined && totalWeight < rule.minWeight) {
            isApplicable = false;
        }
        if (isApplicable && rule.maxWeight !== undefined && totalWeight > rule.maxWeight) {
            isApplicable = false;
        }

        // Check order value conditions
        if (isApplicable && rule.minOrderValue !== undefined && totalValue < rule.minOrderValue) {
            isApplicable = false;
        }
        if (isApplicable && rule.maxOrderValue !== undefined && totalValue > rule.maxOrderValue) {
            isApplicable = false;
        }

        if (isApplicable) {
            // Calculate shipping cost
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
                    cost = (totalValue * rule.rate) / 100;
                    break;
            }

            methods.push({
                id: rule._id,
                name: rule.name,
                description: rule.description,
                cost: parseFloat(cost.toFixed(2)),
                estimatedDays: rule.estimatedDays || '3-7 business days',
            });
        }
    }

    res.json({
        methods,
    });
});

/**
 * @route   POST /api/checkout/calculate-tax
 * @desc    Calculate tax based on shipping address
 * @access  Public (optionalAuth)
 */
export const calculateTax = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;
    const { shippingAddress } = req.body;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!shippingAddress) {
        throw new AppError('Shipping address is required', 400);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Calculate subtotal
    let subtotal = 0;
    const itemsWithTax: any[] = [];

    for (const item of cart.items) {
        const product = await Product.findById(item.productId).populate('taxClassId');
        if (!product) continue;

        // Add pricing information to product (including variant sale prices)
        const productWithPricing = addPricingToProduct(product.toObject());

        let itemPrice = productWithPricing.salePrice || productWithPricing.price;

        // Handle variant pricing
        if (item.variantId && productWithPricing.variants && productWithPricing.variants.length > 0) {
            const variant = productWithPricing.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                itemPrice = variant.pricing?.salePrice || variant.salePrice || variant.price;
            }
        }

        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        itemsWithTax.push({
            productId: product._id,
            price: itemPrice,
            quantity: item.quantity,
            total: itemTotal,
            taxClassId: product.taxClassId,
        });
    }

    // Get applicable tax rates
    // For now, we'll use a simple approach - find tax rates that match the country
    // In a real implementation, you might have more complex geo-matching

    const taxBreakdown: any[] = [];
    let totalTax = 0;

    // Apply tax to items
    for (const item of itemsWithTax) {
        if (item.taxClassId) {
            const taxRate = await TaxRate.findById(item.taxClassId);
            if (taxRate) {
                const taxAmount = (item.total * taxRate.rate) / 100;
                totalTax += taxAmount;

                // Check if tax breakdown already exists for this rate
                const existingBreakdown = taxBreakdown.find(b => b.taxRateId === taxRate._id.toString());
                if (existingBreakdown) {
                    existingBreakdown.amount += taxAmount;
                } else {
                    taxBreakdown.push({
                        name: taxRate.name,
                        rate: taxRate.rate,
                        amount: parseFloat(taxAmount.toFixed(2)),
                        taxRateId: taxRate._id,
                        isSplit: taxRate.isSplit,
                        subTaxes: taxRate.isSplit ? taxRate.subTaxes : undefined,
                    });
                }
            }
        }
    }

    // Add tax on shipping if applicable (this can be configured per store)
    // For now, we'll skip shipping tax

    res.json({
        taxBreakdown,
        totalTax: parseFloat(totalTax.toFixed(2)),
        taxableAmount: subtotal,
        splitTax: taxBreakdown.some(t => t.isSplit),
    });
});

/**
 * @route   POST /api/checkout/apply-coupon
 * @desc    Apply coupon code
 * @access  Public (optionalAuth)
 */
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;
    const channel = req.headers['x-channel'] as string;
    const { couponCode } = req.body;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Find coupon with channel filter
    const couponFilter: any = {
        code: couponCode.toUpperCase(),
        storeId,
    };
    console.log('Applying coupon with filter:', couponFilter);
    // Apply channel filter: coupon should be applicable to this channel or have no channel restriction
    if (channel) {
        couponFilter.$or = [
            { channels: channel },
            { channels: { $exists: false } },
            { channels: { $size: 0 } }
        ];
    }

    const coupon = await Coupon.findOne(couponFilter);

    if (!coupon) {
        throw new AppError('Invalid coupon code', 400);
    }

    // Validate coupon
    if (!coupon.isCurrentlyValid()) {
        throw new AppError('Coupon is no longer valid', 400);
    }

    // Check customer usage
    const customerIdentifier = userId || sessionId;
    if (!coupon.canCustomerUse(customerIdentifier)) {
        throw new AppError('You have reached the usage limit for this coupon', 400);
    }

    // Calculate subtotal (base price without tax)
    let subtotal = 0;
    const itemsWithTax: any[] = [];

    for (const item of cart.items) {
        // Fetch full product with tax information
        const product = await Product.findById(item.productId).populate('taxClassId');
        if (!product) continue;

        // Add pricing information to product (including variant sale prices)
        const productWithPricing = addPricingToProduct(product.toObject());

        let itemPrice = productWithPricing.salePrice || productWithPricing.price;

        // Handle variant pricing
        if (item.variantId && productWithPricing.variants && productWithPricing.variants.length > 0) {
            const variant = productWithPricing.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                itemPrice = variant.pricing?.salePrice || variant.salePrice || variant.price;
            }
        }

        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        // Calculate tax for this item
        let itemTax = 0;
        if (product.taxClassId) {
            const taxRate = await TaxRate.findById(product.taxClassId);
            if (taxRate) {
                itemTax = (itemTotal * taxRate.rate) / 100;
            }
        }

        itemsWithTax.push({
            productId: product._id,
            categoryIds: product.categoryIds || [],
            itemPrice,
            quantity: item.quantity,
            itemTotal,
            itemTax,
            itemWithTax: itemTotal + itemTax,
        });
    }

    // Check minimum cart value (before discount, before tax)
    if (coupon.minCartValue && subtotal < coupon.minCartValue) {
        throw new AppError(`Minimum cart value of ${coupon.minCartValue} required`, 400);
    }

    // Calculate applicable amount (including tax)
    let applicableAmount = 0;
    if (coupon.applyTo === 'store') {
        // For store-wide coupons, include all items with tax
        applicableAmount = itemsWithTax.reduce((sum, item) => sum + item.itemWithTax, 0);
    } else if (coupon.applyTo === 'categories') {
        // For category-specific coupons, only include matching items with tax
        for (const item of itemsWithTax) {
            const hasMatchingCategory = item.categoryIds.some((catId: any) =>
                coupon.categoryIds?.some((couponCatId) => couponCatId.equals(catId))
            );
            if (hasMatchingCategory) {
                applicableAmount += item.itemWithTax;
            }
        }
    }

    // Calculate discount on the applicable amount (which now includes tax)
    const discountAmount = coupon.calculateDiscount(applicableAmount);

    // Store coupon in session/cart (temporary)
    cart.appliedCoupon = {
        code: coupon.code,
        discountAmount,
    } as any;
    await cart.save();

    res.json({
        valid: true,
        coupon: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            description: coupon.description,
        },
        newSubtotal: subtotal - discountAmount,
    });
});

/**
 * @route   DELETE /api/checkout/remove-coupon
 * @desc    Remove applied coupon
 * @access  Public (optionalAuth)
 */
export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter);

    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    // Remove coupon
    cart.appliedCoupon = undefined as any;
    await cart.save();

    res.json({
        success: true,
        message: 'Coupon removed',
    });
});

/**
 * @route   POST /api/checkout/validate-coupon-pos
 * @desc    Validate coupon for POS (without cart requirement)
 * @access  Public (optionalAuth)
 */
export const validateCouponPOS = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;
    const channel = req.headers['x-channel'] as string;
    const { couponCode, items, subtotal } = req.body;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!couponCode) {
        throw new AppError('Coupon code is required', 400);
    }

    // Find coupon with channel filter
    const couponFilter: any = {
        code: couponCode.toUpperCase(),
        storeId,
    };

    // Apply channel filter: coupon should be applicable to this channel or have no channel restriction
    if (channel) {
        couponFilter.$or = [
            { channels: channel },
            { channels: { $exists: false } },
            { channels: { $size: 0 } }
        ];
    }

    const coupon = await Coupon.findOne(couponFilter);

    if (!coupon) {
        throw new AppError('Invalid coupon code', 400);
    }

    // Validate coupon
    if (!coupon.isCurrentlyValid()) {
        throw new AppError('Coupon is no longer valid', 400);
    }

    // Check customer usage
    const customerIdentifier = userId || sessionId;
    if (!coupon.canCustomerUse(customerIdentifier)) {
        throw new AppError('You have reached the usage limit for this coupon', 400);
    }

    // Check minimum cart value
    if (coupon.minCartValue && subtotal < coupon.minCartValue) {
        throw new AppError(`Minimum cart value of ${coupon.minCartValue} required`, 400);
    }

    // Calculate applicable amount based on coupon type
    let applicableAmount = 0;

    if (coupon.applyTo === 'store') {
        // For store-wide coupons, apply to subtotal
        applicableAmount = subtotal;
    } else if (coupon.applyTo === 'categories' && items && items.length > 0) {
        // For category-specific coupons, only include matching items
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product && product.categoryIds) {
                const hasMatchingCategory = product.categoryIds.some((catId: any) =>
                    coupon.categoryIds?.some((couponCatId) => couponCatId.equals(catId))
                );
                if (hasMatchingCategory) {
                    applicableAmount += (item.price || 0) * (item.quantity || 1);
                }
            }
        }
    }

    if (applicableAmount === 0) {
        throw new AppError('No items in cart are eligible for this coupon', 400);
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(applicableAmount);

    res.json({
        valid: true,
        coupon: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            description: coupon.description,
        },
        newSubtotal: subtotal - discountAmount,
    });
});

/**
 * @route   POST /api/checkout/create-order
 * @desc    Create order with full validation
 * @access  Public (optionalAuth)
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;
    const storeId = req.headers['x-store-id'] as string;

    const {
        shippingAddress,
        billingAddress,
        paymentMethod,
        currency,
        customerNote,
        guestEmail,
        saveAddress = false,
    } = req.body;

    // Validate required fields
    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!userId && !guestEmail) {
        throw new AppError('Email is required for guest checkout', 400);
    }

    if (!shippingAddress || !billingAddress) {
        throw new AppError('Shipping and billing addresses are required', 400);
    }

    if (!paymentMethod) {
        throw new AppError('Payment method is required', 400);
    }

    // Get store configuration
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Check if guest checkout is allowed
    if (!userId && !store.settings?.allowGuestCheckout) {
        throw new AppError('Guest checkout is not allowed', 403);
    }

    // Get cart
    const filter: any = { storeId };
    if (userId) filter.userId = userId;
    else filter.sessionId = sessionId;

    const cart = await Cart.findOne(filter).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // ===== STEP 1: RE-VALIDATE CART =====
    const issues: string[] = [];
    let subtotal = 0;
    const orderItems: any[] = [];

    // Get all attributes for this store to resolve IDs to names and values to labels
    const allOptions = await ProductOption.find({ storeId });
    const optionMap: Record<string, { name: string, values: Record<string, string> }> = {};
    allOptions.forEach(opt => {
        const valueLabels: Record<string, string> = {};
        opt.values.forEach(v => {
            valueLabels[v.value] = v.label;
        });
        optionMap[opt._id.toString()] = { name: opt.name, values: valueLabels };
    });

    for (const item of cart.items) {
        const product = await Product.findById(item.productId).populate('taxClassId');

        if (!product) {
            issues.push(`Product ${item.name} not found`);
            continue;
        }

        if (!product.isActive) {
            issues.push(`${product.name} is no longer available`);
            continue;
        }

        // Check if product can ship to this location
        if (!product.canShipTo(shippingAddress.country, shippingAddress.state, shippingAddress.city)) {
            issues.push(`${product.name} cannot be shipped to your selected location`);
            continue;
        }

        // Check stock
        if (product.manageStock && product.stock < item.quantity) {
            issues.push(`Only ${product.stock} units available for ${product.name}`);
            continue;
        }

        // Add pricing information to product (including variant sale prices)
        const productWithPricing = addPricingToProduct(product.toObject());

        // Get current price (sale price if applicable)
        let itemPrice = productWithPricing.salePrice || productWithPricing.price;
        let itemSku = productWithPricing.sku;
        let itemAttributes: Record<string, string> = {};
        let itemWeight = productWithPricing.weight || 0;
        let itemImage = productWithPricing.images?.[0] || item.image;

        // Handle variant pricing
        if (item.variantId && productWithPricing.variants && productWithPricing.variants.length > 0) {
            const variant = productWithPricing.variants.find((v: any) => v._id.toString() === item.variantId);
            if (variant) {
                itemPrice = variant.pricing?.salePrice || variant.salePrice || variant.price;
                if (variant.sku) itemSku = variant.sku;
                if (variant.attributes) {
                    // Resolve attribute IDs to names and values to labels
                    Object.entries(variant.attributes).forEach(([key, value]) => {
                        const option = optionMap[key];
                        const name = option ? option.name : key;
                        const label = option ? (option.values[value as string] || value) : value;
                        itemAttributes[name] = label as string;
                    });
                }
                if (variant.weight) itemWeight = variant.weight;
                if (variant.images && variant.images.length > 0) {
                    itemImage = variant.images[0];
                }
            }
        }

        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        // Calculate download expiry if applicable
        let downloadExpiresAt = undefined;
        if (product.downloadable && product.downloadExpiry) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + product.downloadExpiry);
            downloadExpiresAt = expiryDate;
        }

        // Get return window snapshot for this product
        const returnWindowData = await ReturnWindowService.getProductReturnWindow(
            product._id.toString(),
            storeId
        );

        orderItems.push({
            productId: product._id,
            variantId: item.variantId,
            name: product.name,
            sku: itemSku,
            hsnCode: product.hsnCode || '',
            originalPrice: itemPrice,           // Price before discount (per unit)
            price: itemPrice,                   // Will be adjusted after coupon calculation
            costPrice: product.costPrice || 0,  // Snapshot for accounting COGS
            quantity: item.quantity,
            image: itemImage,
            attributes: itemAttributes,
            weight: itemWeight,
            categoryIds: product.categoryIds || [],
            // Discount fields - will be populated during coupon application
            discountAmount: 0,
            couponDiscount: 0,
            manualDiscount: 0,
            isCouponEligible: false,
            // Digital product fields
            downloadable: product.downloadable,
            downloadFiles: product.downloadFiles,
            downloadLimit: product.downloadLimit,
            downloadExpiresAt,
            // Return window snapshot
            returnWindowDays: returnWindowData.returnWindowDays,
            exchangeWindowDays: returnWindowData.exchangeWindowDays,
            isReturnable: returnWindowData.isReturnable,
        });
    }

    if (issues.length > 0) {
        throw new AppError(`Cart validation failed: ${issues.join(', ')}`, 400);
    }

    // Check min/max order amounts
    if (store.settings?.minOrderAmount && subtotal < store.settings.minOrderAmount) {
        throw new AppError(`Minimum order amount is ${store.settings.minOrderAmount}`, 400);
    }

    if (store.settings?.maxOrderAmount && subtotal > store.settings.maxOrderAmount) {
        throw new AppError(`Maximum order amount is ${store.settings.maxOrderAmount}`, 400);
    }

    // ===== STEP 2: CALCULATE SHIPPING =====
    // Use ShippingCalculatorService for consistent logic
    const shippingCalculatorService = (await import('../services/shipping-calculator.service')).default;

    const shippingResult = await shippingCalculatorService.calculateShipping({
        storeId,
        items: orderItems.map(item => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
        })),
        destination: {
            country: shippingAddress.country,
            state: shippingAddress.state,
            city: shippingAddress.city,
        },
        subtotal,
    });

    const shippingCost = shippingResult.cost;


    // ===== STEP 3: CALCULATE TAX =====
    const taxBreakdown: any[] = [];
    let totalTax = 0;

    for (const item of orderItems) {
        const product = await Product.findById(item.productId);

        if (product && product.taxClassId) {
            const taxRate = await TaxRate.findById(product.taxClassId);

            if (taxRate) {
                const itemTotal = item.price * item.quantity;
                const taxAmount = (itemTotal * taxRate.rate) / 100;
                totalTax += taxAmount;

                // Set item tax details (per-unit values as per Order model)
                item.taxRate = taxRate.rate;
                item.taxAmount = parseFloat((item.price * taxRate.rate / 100).toFixed(2));

                // Check if tax breakdown already exists for this rate
                const existingBreakdown = taxBreakdown.find(b => b.taxRateId.toString() === taxRate._id.toString());
                if (existingBreakdown) {
                    existingBreakdown.amount += taxAmount;
                    existingBreakdown.amount = parseFloat(existingBreakdown.amount.toFixed(2));
                } else {
                    taxBreakdown.push({
                        name: taxRate.name,
                        rate: taxRate.rate,
                        amount: parseFloat(taxAmount.toFixed(2)),
                        taxRateId: taxRate._id,
                        isSplit: taxRate.isSplit,
                        subTaxes: taxRate.isSplit ? taxRate.subTaxes : undefined,
                    });
                }
            }
        }
    }

    // ===== STEP 4: APPLY COUPON & DISTRIBUTE DISCOUNT TO ITEMS =====
    let discount = 0;
    let couponId = null;
    let couponCode = null;

    if (cart.appliedCoupon && cart.appliedCoupon.code) {
        const channel = req.headers['x-channel'] as string;

        // Build coupon filter with channel consideration
        const couponFilter: any = {
            code: cart.appliedCoupon.code.toUpperCase(),
            storeId,
        };

        // Apply channel filter: coupon should be applicable to this channel or have no channel restriction
        if (channel) {
            couponFilter.$or = [
                { channels: channel },
                { channels: { $exists: false } },
                { channels: { $size: 0 } }
            ];
        }

        const coupon = await Coupon.findOne(couponFilter);

        if (coupon && coupon.isCurrentlyValid()) {
            const customerIdentifier = userId || guestEmail;
            if (coupon.canCustomerUse(customerIdentifier)) {
                // Determine which items are eligible for this coupon
                const couponCategoryIds = coupon.categoryIds?.map(id => id.toString()) || [];

                // Mark items as eligible and calculate eligible total
                let eligibleTotal = 0;
                for (const item of orderItems) {
                    const itemCategoryIds = (item.categoryIds || []).map((id: any) => id.toString());

                    if (coupon.applyTo === 'store') {
                        // All items eligible for store-wide coupons
                        item.isCouponEligible = true;
                    } else if (coupon.applyTo === 'categories') {
                        // Only items in matching categories are eligible
                        item.isCouponEligible = couponCategoryIds.length === 0 ||
                            itemCategoryIds.some((catId: string) => couponCategoryIds.includes(catId));
                    } else {
                        item.isCouponEligible = true; // Default to eligible
                    }

                    if (item.isCouponEligible) {
                        const itemTotal = item.price * item.quantity;
                        const itemTaxAmount = (item.taxAmount || 0) * item.quantity;
                        eligibleTotal += itemTotal + itemTaxAmount;
                    }
                }

                if (!coupon.minCartValue || subtotal >= coupon.minCartValue) {
                    // Calculate total discount
                    discount = coupon.calculateDiscount(eligibleTotal);
                    couponId = coupon._id;
                    couponCode = coupon.code;

                    // Distribute coupon discount proportionally among eligible items
                    if (discount > 0 && eligibleTotal > 0) {
                        let remainingDiscount = discount;
                        const eligibleItems = orderItems.filter(item => item.isCouponEligible);

                        for (let i = 0; i < eligibleItems.length; i++) {
                            const item = eligibleItems[i];
                            const itemTotal = item.price * item.quantity;
                            const itemTaxAmount = (item.taxAmount || 0) * item.quantity;
                            const itemTotalWithTax = itemTotal + itemTaxAmount;

                            let itemCouponDiscount: number;
                            if (i === eligibleItems.length - 1) {
                                // Last item gets remainder to avoid rounding issues
                                itemCouponDiscount = remainingDiscount;
                            } else {
                                // Pro-rata share
                                itemCouponDiscount = (itemTotalWithTax / eligibleTotal) * discount;
                                itemCouponDiscount = parseFloat(itemCouponDiscount.toFixed(2));
                            }

                            // Store per-unit coupon discount
                            item.couponDiscount = parseFloat((itemCouponDiscount / item.quantity).toFixed(4));
                            item.discountAmount = item.couponDiscount; // No manual discount in website checkout
                            remainingDiscount -= itemCouponDiscount;
                        }
                    }
                }
            }
        }
    }

    // Finalize originalPrice and price for all items
    for (const item of orderItems) {
        // originalPrice is the price before any coupon discount
        item.originalPrice = item.price;
        // Final price = originalPrice - couponDiscount (per unit)
        item.price = parseFloat((item.originalPrice - (item.couponDiscount || 0)).toFixed(2));
        // Ensure non-negative
        if (item.price < 0) item.price = 0;
    }

    // ===== STEP 5: CALCULATE TOTAL =====
    const total = subtotal + shippingCost + totalTax - discount;

    // ===== STEP 6: GENERATE ORDER NUMBER =====
    const orderNumber = await generateOrderNumber();

    // Validate currency
    if (!currency) {
        throw new AppError('Currency is required', 400);
    }

    // Fetch exchange rate from Currency model
    const Currency = (await import('../models/Currency')).default;
    const currencyDoc = await Currency.findOne({
        code: currency.toUpperCase(),
        isActive: true
    });

    const exchangeRate = currencyDoc?.exchangeRate || 1;

    // ===== STEP 7: CREATE ORDER =====
    const order = await (await import('../models/Order')).default.create({
        storeId,
        customerId: userId ? userId : undefined,
        guestEmail: !userId ? guestEmail.toLowerCase() : undefined,
        orderNumber,
        items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        tax: parseFloat(totalTax.toFixed(2)),
        taxBreakdown,
        discount: parseFloat(discount.toFixed(2)),
        couponId,
        couponCode,
        total: parseFloat(total.toFixed(2)),
        currency: currency.toUpperCase(),
        exchangeRate: exchangeRate || 1, // Store exchange rate, default to 1 if not provided
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        customerNote,
    });

    // ===== STEP 7.1: REDUCE STOCK FOR COD =====
    if (paymentMethod === 'cod') {
        await InventoryService.reduceStock(orderItems);
    }

    // ===== STEP 8: SAVE ADDRESS (if requested) =====
    if (userId && saveAddress) {
        const customer = await Customer.findById(userId);
        if (customer) {
            // Check if address already exists
            const addressExists = customer.addresses.some((addr: any) =>
                addr.address1 === shippingAddress.address1 &&
                addr.postalCode === shippingAddress.postalCode
            );

            if (!addressExists) {
                customer.addresses.push({
                    type: 'shipping',
                    ...shippingAddress,
                    isDefault: customer.addresses.length === 0,
                } as any);
                await customer.save();
            }
        }
    }

    // ===== STEP 9: INCREMENT COUPON USAGE (will be done after payment success) =====
    // Store coupon ID in order for later use

    // ===== STEP 10: QUEUE NOTIFICATIONS =====
    try {
        // 1. Customer Notification (Email)
        await queueOrderConfirmation(
            {
                storeId,
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                customerEmail: !userId ? guestEmail : undefined,
                customerPhone: shippingAddress.phone,
                total: order.total,
                currency: order.currency,
                exchangeRate: order.exchangeRate,
                items: orderItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingAddress: {
                    address1: shippingAddress.address1,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    country: shippingAddress.country,
                    postalCode: shippingAddress.postalCode,
                },
            }
        );

        // 2. Admin Notification (Dashboard)
        await notificationService.createAdminNotification({
            type: 'order',
            title: 'New Order',
            message: `New order ${order.orderNumber} placed by ${shippingAddress.firstName} ${shippingAddress.lastName}`,
            data: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber
            }
        });
    } catch (notificationError) {
        // Log error but don't fail the order
        console.error('Failed to queue notifications:', notificationError);
    }

    // ===== STEP 11: CLEAR CART =====
    await Cart.findByIdAndDelete(cart._id);

    // ===== STEP 12: DETERMINE IF PAYMENT IS REQUIRED =====
    // Check if the payment gateway is online or offline
    const gatewayConfig = await (await import('../models/PaymentGatewayConfig')).default.findOne({
        storeId,
        gatewayType: paymentMethod,
        isActive: true,
    });

    // Determine if payment is required (online gateways require payment, offline like COD don't)
    const paymentRequired = gatewayConfig ? gatewayConfig.gatewayType !== 'cod' : paymentMethod !== 'cod';

    // ===== STEP 13: RETURN ORDER DETAILS =====
    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            paymentRequired,
            status: order.status,
        },
    });
});

/**
 * Generate unique order number
 */
async function generateOrderNumber(): Promise<string> {
    const Order = (await import('../models/Order')).default;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORD-${year}${month}`;

    const startOfMonth = new Date(year, now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastOrder = await Order.findOne({
        orderNumber: { $regex: `^${prefix}` },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    return `${prefix}-${String(sequence).padStart(6, '0')}`;
}

