import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import ProductOption from '../models/ProductOption';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import shippingCalculatorService from '../services/shipping-calculator.service';
import { PdfService } from '../services/pdf.service';
import { transactionalNotificationService } from '../services/transactional-notification.service';
import { notificationService } from '../services/notification.service';
import InventoryService from '../services/inventory.service';
import { emitOrderEvent } from '../events';

/**
 * Validation rules
 */
export const createOrderValidation = [
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('currency').trim().notEmpty().withMessage('Currency is required'),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.firstName').trim().notEmpty(),
    body('shippingAddress.lastName').trim().notEmpty(),
    body('shippingAddress.address1').trim().notEmpty(),
    body('shippingAddress.city').trim().notEmpty(),
    body('shippingAddress.state').trim().notEmpty(),
    body('shippingAddress.country').trim().notEmpty(),
    body('shippingAddress.postalCode').trim().notEmpty(),
    body('shippingAddress.phone').trim().notEmpty(),
    body('billingAddress').isObject().withMessage('Billing address is required'),
    body('paymentMethod')
        .isIn(['razorpay', 'stripe', 'paypal', 'cod'])
        .withMessage('Valid payment method is required'),
];

export const updateOrderStatusValidation = [
    param('id').isMongoId().withMessage('Valid order ID is required'),
    body('status')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('Valid status is required'),
];

export const adminCreateOrderValidation = [
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('guestEmail').optional().isEmail().withMessage('Valid email is required'),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.firstName').trim().notEmpty(),
    body('shippingAddress.lastName').trim().notEmpty(),
    body('shippingAddress.address1').trim().notEmpty(),
    body('shippingAddress.city').trim().notEmpty(),
    body('shippingAddress.state').trim().notEmpty(),
    body('shippingAddress.country').trim().notEmpty(),
    body('shippingAddress.postalCode').trim().notEmpty(),
    body('shippingAddress.phone').trim().notEmpty(),
    body('billingAddress').isObject().withMessage('Billing address is required'),
    body('paymentMethod')
        .isIn(['razorpay', 'stripe', 'paypal', 'cod'])
        .withMessage('Valid payment method is required'),
    body('paymentStatus')
        .optional()
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Valid payment status is required'),
    body('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('Valid status is required'),
];

/**
 * @route   POST /api/orders/admin/create
 * @desc    Admin creates order directly (no cart required)
 * @access  Private (Admin/Store Admin only)
 */
export const adminCreateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId,
        customerId, // Customer ID for registered customer orders
        items,
        guestEmail,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus = 'pending',
        status = 'pending',
        customerNote,
        adminNote,
        shippingCost = 0,
        tax = 0,
        discount = 0,
        currency = 'USD',
    } = req.body;

    // Fetch products and validate
    const orderItems = [];
    let subtotal = 0;

    // Get attribute names and value labels
    const allOptions = await ProductOption.find({ storeId });
    const optionMap: Record<string, { name: string, values: Record<string, string> }> = {};
    allOptions.forEach(opt => {
        const valueLabels: Record<string, string> = {};
        opt.values.forEach(v => {
            valueLabels[v.value] = v.label;
        });
        optionMap[opt._id.toString()] = { name: opt.name, values: valueLabels };
    });

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        // Get variant if specified
        let price = product.salePrice || product.price;
        let sku = product.sku;
        let variantAttributes: Record<string, string> = {};
        let itemImage = product.images?.[0] || '';

        if (item.variantId && product.variants) {
            const variant = product.variants.find((v: any) => v._id?.toString() === item.variantId);
            if (variant) {
                price = variant.salePrice || variant.price || price;
                sku = variant.sku || sku;
                if (variant.attributes) {
                    Object.entries(variant.attributes).forEach(([key, value]) => {
                        const option = optionMap[key];
                        const name = option ? option.name : key;
                        const label = option ? (option.values[value as string] || value) : value;
                        variantAttributes[name] = label as string;
                    });
                }
                if (variant.images && variant.images.length > 0) {
                    itemImage = variant.images[0];
                }
            }
        }

        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            productId: product._id,
            variantId: item.variantId,
            name: product.name,
            sku,
            price,
            quantity: item.quantity,
            image: itemImage,
            attributes: variantAttributes,
            weight: product.weight || 0,
        });
    }

    const total = subtotal + shippingCost + tax - discount;

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined, // Link to customer if provided
        guestEmail: customerId ? undefined : guestEmail?.toLowerCase(), // Only for guest orders
        orderNumber,
        items: orderItems,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        currency,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus,
        status,
        customerNote,
        adminNote,
    });

    // Reduce stock if payment is marked as paid
    if (paymentStatus === 'paid') {
        await InventoryService.reduceStock(orderItems);
    }

    // Emit order creation event
    emitOrderEvent('orderCreate', order, storeId, order._id.toString(), order.customerId?.toString());

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
    });
});

/**
 * Admin Order Update Validation
 */
export const adminUpdateOrderValidation = [
    param('id').isMongoId().withMessage('Valid order ID is required'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('shippingAddress').optional().isObject(),
    body('billingAddress').optional().isObject(),
    body('paymentMethod').optional().isString(),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
    body('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    body('shippingCost').optional().isNumeric(),
    body('tax').optional().isNumeric(),
    body('discount').optional().isNumeric(),
    body('courierName').optional().isString(),
    body('trackingUrl').optional().isString(),
];

/**
 * @route   PUT /api/orders/admin/:id
 * @desc    Update order (Admin only)
 * @access  Private (Admin)
 */
export const adminUpdateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus,
        status,
        shippingCost,
        tax,
        discount,
        customerNote,
        adminNote,
        trackingNumber,
        courierName,
        trackingUrl,
    } = req.body;

    const order = await Order.findById(id).populate('storeId customerId');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
        const orderItems = [];
        let subtotal = 0;

        // Get attribute names and value labels
        const allOptions = await ProductOption.find({ storeId: order.storeId._id });
        const optionMap: Record<string, { name: string, values: Record<string, string> }> = {};
        allOptions.forEach(opt => {
            const valueLabels: Record<string, string> = {};
            opt.values.forEach(v => {
                valueLabels[v.value] = v.label;
            });
            optionMap[opt._id.toString()] = { name: opt.name, values: valueLabels };
        });

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            let price = product.salePrice || product.price;
            let sku = product.sku;
            let name = product.name;
            let attributes: Record<string, string> = {};
            let itemImage = product.images?.[0];

            if (item.variantId && product.variants) {
                const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
                if (variant) {
                    price = variant.salePrice || variant.price || price;
                    sku = variant.sku || sku;
                    if (variant.attributes) {
                        Object.entries(variant.attributes).forEach(([key, value]) => {
                            const option = optionMap[key];
                            const name = option ? option.name : key;
                            const label = option ? (option.values[value as string] || value) : value;
                            attributes[name] = label as string;
                        });
                    }
                    if (variant.images && variant.images.length > 0) {
                        itemImage = variant.images[0];
                    }
                }
            }

            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: product._id,
                variantId: item.variantId,
                name,
                sku,
                price,
                quantity: item.quantity,
                attributes,
                image: itemImage,
            });
        }

        order.items = orderItems;
        order.subtotal = subtotal;
    }

    const oldStatus = order.status;
    const oldTrackingNumber = order.trackingNumber;

    // Update other fields
    if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
    if (billingAddress !== undefined) order.billingAddress = billingAddress;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (status !== undefined) order.status = status;
    if (shippingCost !== undefined) order.shippingCost = shippingCost;
    if (tax !== undefined) order.tax = tax;
    if (discount !== undefined) order.discount = discount;
    if (customerNote !== undefined) order.customerNote = customerNote;
    if (adminNote !== undefined) order.adminNote = adminNote;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (courierName !== undefined) order.courierName = courierName;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;

    // Handle stock if payment status changed to paid
    if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
        await InventoryService.reduceStock(order.items);
    }

    // Recalculate total
    order.total = order.subtotal + order.shippingCost + order.tax - order.discount;

    await order.save();

    // Emit order update event
    emitOrderEvent('orderUpdate', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Send notifications if status or tracking number changed
    if (status && status !== oldStatus) {
        await transactionalNotificationService.sendOrderStatusUpdate(
            order.storeId._id.toString(),
            (order.storeId as any).name,
            order,
            status
        );
    } else if (trackingNumber && trackingNumber !== oldTrackingNumber) {
        // If only tracking changed but status is already shipped, send shipped update again
        if (order.status === 'shipped') {
            await transactionalNotificationService.sendOrderStatusUpdate(
                order.storeId._id.toString(),
                (order.storeId as any).name,
                order,
                'shipped'
            );
        }
    }


    // Notify Admin (General update)
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Updated',
        message: `Order #${order.orderNumber} details updated by admin`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            updatedBy: req.user?.id
        }
    });

    res.json({
        success: true,
        message: 'Order updated successfully',
        data: order,
    });
});

/**
 * Generate unique order number
 */
const generateOrderNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORD-${year}${month}`;

    // Find the last order of the current month by searching for order numbers with this prefix
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
};

/**
 * @route   POST /api/orders/create
 * @desc    Create order from cart (supports guest checkout)
 * @access  Public (optionalAuth)
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id; // Optional for guest checkout
    const {
        storeId,
        shippingAddress,
        billingAddress,
        paymentMethod,
        couponCode,
        customerNote,
        guestEmail,
        sessionId,
        currency, // Accept currency from frontend
    } = req.body;

    // Validate: Either logged in OR guest email provided
    if (!userId && !guestEmail) {
        throw new AppError('Email is required for guest checkout', 400);
    }

    // Get user's cart (user-based or session-based)
    let cart;
    if (userId) {
        cart = await Cart.findOne({ userId, storeId }).populate('items.productId');
    } else {
        // Guest cart - use sessionId
        if (!sessionId) {
            throw new AppError('Session ID is required for guest checkout', 400);
        }
        cart = await Cart.findOne({ sessionId, storeId }).populate('items.productId');
    }

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Validate product availability and stock
    // Get attribute names and value labels
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
        const product = await Product.findById(item.productId);

        if (!product) {
            throw new AppError(`Product ${item.name} not found`, 404);
        }

        if (!product.isActive) {
            throw new AppError(`Product ${item.name} is no longer available`, 400);
        }

        if (product.manageStock && product.stock < item.quantity) {
            throw new AppError(
                `Insufficient stock for ${item.name}. Available: ${product.stock}`,
                400
            );
        }
    }

    // Calculate shipping cost
    const shippingResult = await shippingCalculatorService.calculateShipping({
        storeId,
        items: cart.items.map((item) => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
        })),
        destination: {
            country: shippingAddress.country,
            state: shippingAddress.state,
            city: shippingAddress.city,
        },
        subtotal: cart.subtotal,
    });

    // Apply coupon if provided
    let discount = 0;
    let couponId = null;

    if (couponCode) {
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            storeId,
        });

        if (!coupon) {
            throw new AppError('Invalid coupon code', 400);
        }

        if (!coupon.isCurrentlyValid()) {
            throw new AppError('Coupon is no longer valid', 400);
        }

        // For guest users, use guestEmail for coupon usage check
        const customerIdentifier = userId || guestEmail;
        if (!coupon.canCustomerUse(customerIdentifier)) {
            throw new AppError('You have reached the usage limit for this coupon', 400);
        }

        // Calculate applicable amount
        let applicableAmount = 0;
        if (coupon.applyTo === 'store') {
            applicableAmount = cart.subtotal;
        } else if (coupon.applyTo === 'categories') {
            for (const item of cart.items) {
                const product = item.productId as any;
                if (product && product.categoryIds) {
                    const hasMatchingCategory = product.categoryIds.some((catId: any) =>
                        coupon.categoryIds?.some((couponCatId) => couponCatId.equals(catId))
                    );
                    if (hasMatchingCategory) {
                        applicableAmount += item.price * item.quantity;
                    }
                }
            }
        }

        if (coupon.minCartValue && cart.subtotal < coupon.minCartValue) {
            throw new AppError(
                `Minimum cart value of ${coupon.minCartValue} required for this coupon`,
                400
            );
        }

        discount = coupon.calculateDiscount(cart.subtotal, applicableAmount);
        couponId = coupon._id;
    }

    // Calculate total
    const subtotal = cart.subtotal;
    const shippingCost = shippingResult.cost;
    const tax = 0; // TODO: Implement tax calculation
    const total = subtotal + shippingCost + tax - discount;

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Currency must be provided from frontend
    if (!currency) {
        throw new AppError('Currency is required', 400);
    }

    // Create order
    const orderItems = cart.items.map((item) => {
        const product = item.productId as any;
        let itemImage = item.image;

        if (item.variantId && product.variants) {
            const variant = product.variants.find((v: any) => v._id?.toString() === item.variantId);
            if (variant) {
                if (variant.images && variant.images.length > 0) {
                    itemImage = variant.images[0];
                }
                if (variant.attributes) {
                    const resolvedAttributes: Record<string, string> = {};
                    Object.entries(variant.attributes).forEach(([key, value]) => {
                        const option = optionMap[key];
                        const name = option ? option.name : key;
                        const label = option ? (option.values[value as string] || value) : value;
                        resolvedAttributes[name] = label as string;
                    });
                    item.attributes = resolvedAttributes;
                }
            }
        }

        return {
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: itemImage,
            attributes: item.attributes,
            weight: product.weight,
        };
    });

    const order = await Order.create({
        storeId,
        customerId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        guestEmail: !userId ? guestEmail.toLowerCase() : undefined,
        orderNumber,
        items: orderItems,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        currency: currency.toUpperCase(),
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        customerNote,
    });

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    // Emit order creation event
    emitOrderEvent('orderCreate', order, storeId, order._id.toString(), order.customerId?.toString());

    // Increment coupon usage (we'll do this after successful payment)
    // Store coupon ID in order for later use
    if (couponId) {
        await Order.findByIdAndUpdate(order._id, {
            $set: { 'paymentDetails.couponId': couponId },
        });
    }

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                total: order.total,
                currency: order.currency,
                paymentMethod: order.paymentMethod,
                status: order.status,
                isGuest: !userId,
            },
        },
    });
});

/**
 * @route   POST /api/orders/:id/initialize-payment
 * @desc    Initialize payment with gateway (supports guest checkout)
 * @access  Public (optionalAuth)
 */
export const initializePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { guestEmail } = req.body; // For guest verification

    const order = await Order.findById(id).populate('storeId', 'name');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check authorization
    if (order.customerId) {
        // Logged-in user order - this check would need customerId from auth
        // For now, guest orders verify by email
    } else {
        // Guest order - verify by email
        if (!guestEmail || order.guestEmail !== guestEmail.toLowerCase()) {
            throw new AppError('Not authorized to access this order', 403);
        }
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
        throw new AppError('Order is already paid', 400);
    }

    // Skip payment initialization for COD
    if (order.paymentMethod === 'cod') {
        return res.json({
            success: true,
            message: 'Cash on Delivery - No payment initialization needed',
            data: {
                paymentMethod: 'cod',
                requiresPayment: false,
            },
        });
    }

    // Import PaymentService dynamically to avoid circular dependency
    const { PaymentService } = await import('../services/payment/payment.service');

    // Extract storeId - handle both populated and non-populated cases
    const storeIdValue = order.storeId as any;
    const storeId = storeIdValue?._id ? storeIdValue._id.toString() : storeIdValue.toString();

    // Get payment gateway instance
    const gateway = await PaymentService.selectGateway({
        storeId,
        country: order.billingAddress.country,
        currency: order.currency,
        preferredGateway: order.paymentMethod,
    });

    // Get base currency from Currency table
    const Currency = (await import('../models/Currency')).default;
    const baseCurrencyDoc = await Currency.findOne({ isBaseCurrency: true });

    if (!baseCurrencyDoc) {
        throw new AppError('Base currency not configured', 500);
    }

    const baseCurrency = baseCurrencyDoc.code;
    let paymentAmount = order.total;

    if (order.currency !== baseCurrency && order.exchangeRate) {
        // Convert from base currency to order currency using exchange rate
        paymentAmount = order.total * order.exchangeRate;
    }

    // Create payment with gateway
    const payment = await gateway.instance.createPayment({
        orderId: order.orderNumber,
        amount: paymentAmount,
        currency: order.currency,
        customerEmail: userId ? req.user!.email : order.guestEmail!,
        customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        description: `Order ${order.orderNumber}`,
        shippingAddress: order.shippingAddress,
        metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: userId || 'guest',
            guestEmail: order.guestEmail,
        },
    });

    if (!payment.success) {
        console.error('Payment initialization failed:', payment);
        const errorMessage = payment.gatewayResponse?.error?.description
            || payment.gatewayResponse?.message
            || 'Failed to initialize payment';
        throw new AppError(errorMessage, 500);
    }

    // Store payment ID in order
    order.paymentId = payment.paymentId;
    await order.save();

    // Return payment details based on gateway type
    const response: any = {
        success: true,
        message: 'Payment initialized successfully',
        data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: paymentAmount, // Use converted amount, not order.total
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            gatewayType: gateway.gatewayType,
            paymentId: payment.paymentId,
        },
    };

    // Add gateway-specific data
    if (gateway.gatewayType === 'razorpay') {
        // For Razorpay, frontend needs key and order ID
        const config = await PaymentService.getGatewayConfig({
            storeId,
            gatewayType: 'razorpay',
        });

        response.data.razorpay = {
            key: config.credentials.keyId,
            orderId: payment.paymentId,
            amount: order.total * 100, // Razorpay uses paise
            currency: order.currency,
            name: (order.storeId as any).name || 'Store',
            description: `Order ${order.orderNumber}`,
            prefill: {
                name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                email: userId ? req.user!.email : order.guestEmail,
                contact: order.shippingAddress.phone,
            },
        };
    } else if (gateway.gatewayType === 'stripe') {
        // For Stripe, frontend needs client secret
        response.data.stripe = {
            clientSecret: payment.clientSecret,
            publishableKey: (await PaymentService.getGatewayConfig({
                storeId,
                gatewayType: 'stripe',
            })).credentials.publishableKey,
        };
    } else if (gateway.gatewayType === 'paypal') {
        // For PayPal, frontend needs redirect URL
        response.data.paypal = {
            redirectUrl: payment.redirectUrl,
            orderId: payment.paymentId,
        };
    }

    return res.json(response);
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID (supports guest access via guestEmail query param)
 * @access  Public (optionalAuth)
 */
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id; // Optional for guest access
    const userRole = req.user?.role;

    const order = await Order.findById(id)
        .populate('items.productId', 'name slug images')
        .populate('customerId', 'firstName lastName email')
        .populate('storeId', 'name');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check authorization - user can only view their own orders unless admin
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');

    // Handle populated customerId
    const customerId = (order.customerId as any)?._id || order.customerId;
    const isOwner = userId && customerId && customerId.toString() === userId;

    // Check for guest access via email verification
    const guestEmail = req.query.guestEmail as string;
    const isGuestOwner = !order.customerId && order.guestEmail &&
        guestEmail && order.guestEmail.toLowerCase() === guestEmail.toLowerCase();

    if (!isAdmin && !isOwner && !isGuestOwner) {
        throw new AppError('Not authorized to view this order', 403);
    }

    res.json({
        success: true,
        data: order,
    });
});

/**
 * @route   GET /api/orders/user/me
 * @desc    Get current user's orders
 * @access  Private
 */
export const getUserOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 10, status } = req.query;

    const filter: any = { customerId: userId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('storeId', 'name')
            .populate('items.productId', 'name slug images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Order.countDocuments(filter),
    ]);

    res.json({
        success: true,
        orders,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin/Store Admin)
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        storeId,
        search,
        dateRange,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (storeId) filter.storeId = storeId;

    // Enhanced search - search across multiple fields
    if (search) {
        const searchStr = String(search);
        // Escape special regex characters for safe searching
        const escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
            // Order identifiers
            { orderNumber: { $regex: searchStr, $options: 'i' } },
            // Guest info
            { guestEmail: { $regex: escapedSearch, $options: 'i' } },
            // Shipping address
            { 'shippingAddress.firstName': { $regex: escapedSearch, $options: 'i' } },
            { 'shippingAddress.lastName': { $regex: escapedSearch, $options: 'i' } },
            { 'shippingAddress.email': { $regex: escapedSearch, $options: 'i' } },
            { 'shippingAddress.phone': { $regex: escapedSearch, $options: 'i' } },
            // Billing address
            { 'billingAddress.firstName': { $regex: escapedSearch, $options: 'i' } },
            { 'billingAddress.lastName': { $regex: escapedSearch, $options: 'i' } },
            { 'billingAddress.email': { $regex: escapedSearch, $options: 'i' } },
            { 'billingAddress.phone': { $regex: escapedSearch, $options: 'i' } },
        ];
    }
    // Date range filters
    if (dateRange || (startDate && endDate)) {
        const now = new Date();
        let dateFilter: { $gte?: Date; $lte?: Date } = {};

        switch (dateRange) {
            case 'today':
                dateFilter.$gte = new Date(now.setHours(0, 0, 0, 0));
                dateFilter.$lte = new Date();
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                dateFilter.$gte = new Date(yesterday.setHours(0, 0, 0, 0));
                dateFilter.$lte = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'last7days':
                const last7 = new Date(now);
                last7.setDate(last7.getDate() - 7);
                dateFilter.$gte = new Date(last7.setHours(0, 0, 0, 0));
                dateFilter.$lte = new Date();
                break;
            case 'last30days':
                const last30 = new Date(now);
                last30.setDate(last30.getDate() - 30);
                dateFilter.$gte = new Date(last30.setHours(0, 0, 0, 0));
                dateFilter.$lte = new Date();
                break;
            case 'ytd':
                dateFilter.$gte = new Date(now.getFullYear(), 0, 1);
                dateFilter.$lte = new Date();
                break;
            case 'custom':
                if (startDate) dateFilter.$gte = new Date(String(startDate));
                if (endDate) dateFilter.$lte = new Date(String(endDate));
                break;
        }

        if (dateFilter.$gte || dateFilter.$lte) {
            filter.createdAt = dateFilter;
        }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = String(sortBy);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // First, get all customer IDs that match the search query
    let customerIds: any[] = [];
    if (search) {
        const searchStr = String(search);
        // Escape special regex characters for safe searching
        const escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const Customer = (await import('../models/Customer')).default;
        const matchingCustomers = await Customer.find({
            $or: [
                { firstName: { $regex: escapedSearch, $options: 'i' } },
                { lastName: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } },
                { phone: { $regex: escapedSearch, $options: 'i' } },
            ]
        }).select('_id');
        customerIds = matchingCustomers.map(c => c._id);

        // Add customer IDs to search criteria
        if (customerIds.length > 0) {
            filter.$or.push({ customerId: { $in: customerIds } });
        }
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customerId', 'firstName lastName email phone')
            .populate('storeId', 'name')
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(Number(limit)),
        Order.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: orders,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin/Store Admin)
 */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, trackingNumber, courierName, trackingUrl, adminNote } = req.body;

    const order = await Order.findById(id).populate('storeId customerId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    order.status = status;
    if (adminNote) order.adminNote = adminNote;

    // Status specific updates
    if (status === 'shipped') {
        order.shippedAt = new Date();
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (courierName) order.courierName = courierName;
        if (trackingUrl) order.trackingUrl = trackingUrl;
    } else if (status === 'delivered') {
        order.deliveredAt = new Date();
    }

    await order.save();

    // Emit appropriate event based on status
    if (status === 'shipped') {
        emitOrderEvent('orderShipped', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    } else if (status === 'delivered') {
        emitOrderEvent('orderDelivered', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    } else if (status === 'cancelled') {
        emitOrderEvent('orderCancel', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    } else if (status === 'refunded') {
        emitOrderEvent('orderRefund', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    } else {
        emitOrderEvent('orderUpdate', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    }

    // Trigger notification
    await transactionalNotificationService.sendOrderStatusUpdate(
        order.storeId._id.toString(),
        (order.storeId as any).name,
        order,
        status
    );

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Status Updated',
        message: `Order #${order.orderNumber} status updated to ${status}`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: status
        }
    });

    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
    });
});

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Process order refund
 * @access  Private (Admin/Store Admin)
 */
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNote } = req.body; // Assuming refund details might come from req.body

    const order = await Order.findById(id).populate('storeId customerId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Only allow refund for paid or processing orders
    if (!['paid', 'processing', 'shipped', 'delivered'].includes(order.paymentStatus)) {
        throw new AppError('Cannot refund an order that is not paid or processing', 400);
    }

    // Update order status and payment status
    order.status = 'refunded';
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    if (adminNote) order.adminNote = adminNote;

    await order.save();

    // Emit order refund event
    emitOrderEvent('orderRefund', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Restore product stock (if not already done by cancellation)
    // This logic might need to be more sophisticated depending on partial refunds, etc.
    await InventoryService.restoreStock(order.items);

    // Trigger notification for refunded
    await transactionalNotificationService.sendOrderStatusUpdate(
        order.storeId._id.toString(),
        (order.storeId as any).name,
        order,
        'refunded'
    );

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Refunded',
        message: `Order #${order.orderNumber} has been refunded`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: 'refunded'
        }
    });

    res.json({
        success: true,
        message: 'Order marked as refunded',
        data: order
    });
});

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const order = await Order.findById(id).populate('storeId customerId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check authorization - support both logged-in users and guest orders
    const isAdmin = userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin';
    const isOwner = order.customerId && order.customerId._id.toString() === userId;

    // Check for guest access via email verification
    const guestEmailInput = req.query.guestEmail as string || req.body.guestEmail;
    const isGuestOwner = !order.customerId && order.guestEmail &&
        guestEmailInput && order.guestEmail.toLowerCase() === guestEmailInput.toLowerCase();

    if (!isAdmin && !isOwner && !isGuestOwner) {
        throw new AppError('Not authorized to cancel this order', 403);
    }

    // Can only cancel pending or processing orders
    if (!isAdmin && !['pending', 'processing'].includes(order.status)) {
        throw new AppError('Cannot cancel order in current status', 400);
    }

    order.status = 'cancelled';
    await order.save();

    // Emit order cancel event
    emitOrderEvent('orderCancel', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Send notification
    await transactionalNotificationService.sendOrderStatusUpdate(
        order.storeId._id.toString(),
        (order.storeId as any).name,
        order,
        'cancelled'
    );

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Cancelled',
        message: `Order #${order.orderNumber} has been cancelled`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: 'cancelled'
        }
    });

    // Restore product stock
    await InventoryService.restoreStock(order.items);

    // TODO: Process refund if payment was made

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order,
    });
});

/**
 * @route   POST /api/orders/:id/payment-success
 * @desc    Handle successful payment
 * @access  Private
 */
export const handlePaymentSuccess = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { paymentId, paymentDetails } = req.body;
    const userId = req.user?.id;

    const order = await Order.findById(id).populate('storeId customerId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Verify ownership - either authenticated user or guest with matching email
    if (userId) {
        // Authenticated user - check if order belongs to them
        const orderCustomerId = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
        if (orderCustomerId && orderCustomerId !== userId) {
            throw new AppError('Unauthorized to access this order', 403);
        }
    } else {
        // Guest user - verify email from request body
        const guestEmail = req.body.guestEmail;
        if (!guestEmail || order.guestEmail !== guestEmail.toLowerCase()) {
            throw new AppError('Unauthorized to access this order', 403);
        }
    }

    // Update payment status
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paymentId = paymentId;
    order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };

    await order.save();

    // Emit order paid event
    emitOrderEvent('orderPaid', order, order.storeId.toString(), order._id.toString(), order.customerId?.toString());

    // Reduce product stock
    await InventoryService.reduceStock(order.items);

    // Increment coupon usage if coupon was used
    if (order.couponId) {
        const coupon = await (await import('../models/Coupon')).default.findById(order.couponId);
        if (coupon) {
            // Use customer ID or guest email as identifier
            const customerIdentifier = order.customerId?.toString() || order.guestEmail || '';
            await coupon.incrementUsage(customerIdentifier);
        }
    }

    // Send order confirmation/payment success notification
    try {
        console.log('Sending payment failed notification...');
        await transactionalNotificationService.sendOrderStatusUpdate(
            order.storeId._id.toString(),
            (order.storeId as any).name,
            order,
            'processing'
        );
    } catch (notificationError) {
        console.error('Failed to send payment success notification:', notificationError);
    }

    res.json({
        success: true,
        message: 'Payment processed successfully',
        data: order,
    });
});

/**
 * @route   POST /api/orders/:id/payment-failed
 * @desc    Handle failed payment
 * @access  Private
 */
export const handlePaymentFailed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { paymentDetails } = req.body;

    const order = await Order.findById(id).populate('storeId customerId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const userId = req.user?.id;

    // Verify ownership - either authenticated user or guest with matching email
    if (userId) {
        // Authenticated user - check if order belongs to them
        const orderCustomerId = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
        if (orderCustomerId && orderCustomerId !== userId) {
            throw new AppError('Unauthorized to access this order', 403);
        }
    } else {
        // Guest user - verify email from request body
        const guestEmail = req.body.guestEmail;
        if (!guestEmail || order.guestEmail !== guestEmail.toLowerCase()) {
            throw new AppError('Unauthorized to access this order', 403);
        }
    }

    order.paymentStatus = 'failed';
    order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };

    await order.save();

    // Emit order failed event
    emitOrderEvent('orderFailed', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Send payment failed notification
    try {
        console.log('Sending payment failed notification...');
        await transactionalNotificationService.sendOrderStatusUpdate(
            order.storeId._id.toString(),
            (order.storeId as any).name,
            order,
            'failed'
        );
    } catch (notificationError) {
        console.error('Failed to send payment failure notification:', notificationError);
    }

    res.json({
        success: true,
        message: 'Payment status updated',
        data: order,
    });
});

/**
 * @route   GET /api/orders/:orderNumber/track
 * @desc    Track order by order number (public)
 * @access  Public
 */
export const trackOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber }).select(
        'orderNumber status paymentStatus trackingNumber shippedAt deliveredAt createdAt'
    );

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    res.json({
        success: true,
        data: order,
    });
});

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Download Order Invoice PDF
 * @access  Private (Owner/Admin)
 */
export const downloadInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const order = await Order.findById(id).populate('storeId');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Auth Check
    const isAdmin = userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin';
    const isOwner = userId && order.customerId?.toString() === userId;
    // Guest check
    const guestEmail = req.query.guestEmail as string;
    const isGuestOwner = !order.customerId && order.guestEmail && guestEmail &&
        order.guestEmail.toLowerCase() === guestEmail.toLowerCase();

    if (!isAdmin && !isOwner && !isGuestOwner) {
        throw new AppError('Not authorized', 403);
    }

    const pdfBuffer = await PdfService.generateInvoice(order);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${order.orderNumber}.pdf`,
        'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
});

/**
 * @route   GET /api/orders/:id/packing-slip
 * @desc    Download Packing Slip PDF
 * @access  Private (Admin only)
 */
export const downloadPackingSlip = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Auth Check: Admin only (handled by route middleware usually, but double check here if needed)

    const order = await Order.findById(id);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const pdfBuffer = await PdfService.generatePackingSlip(order);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=packing-slip-${order.orderNumber}.pdf`,
        'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
});

export const updateTrackingValidation = [
    param('id').isMongoId().withMessage('Valid order ID is required'),
    body('trackingNumber').trim().notEmpty().withMessage('Tracking number is required'),
    body('courierName').trim().notEmpty().withMessage('Courier name is required'),
    body('trackingUrl').optional().isURL().withMessage('Valid tracking URL is required'),
];

/**
 * @route   PATCH /api/orders/:id/tracking
 * @desc    Update tracking information
 * @access  Private (Admin only)
 */
export const updateTracking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { trackingNumber, courierName, trackingUrl } = req.body;

    const order = await Order.findById(id).populate('storeId customerId');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    order.trackingNumber = trackingNumber;
    order.courierName = courierName;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    // Automatically set status to shipped if it's currently pending or processing
    let statusToNotify = order.status;
    if (order.status === 'pending' || order.status === 'processing') {
        order.status = 'shipped';
        order.shippedAt = new Date();
        statusToNotify = 'shipped';
    }

    await order.save();

    // Emit order update or shipped event
    if (statusToNotify === 'shipped') {
        emitOrderEvent('orderShipped', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    } else {
        emitOrderEvent('orderUpdate', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    }

    // Send notification if status changed to shipped OR if tracking number changed and it's already shipped
    if (statusToNotify === 'shipped') {
        await transactionalNotificationService.sendOrderStatusUpdate(
            order.storeId._id.toString(),
            (order.storeId as any).name,
            order,
            'shipped'
        );
    }

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Tracking Updated',
        message: `Tracking info updated for Order #${order.orderNumber}`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            trackingNumber: trackingNumber
        }
    });

    res.json({
        success: true,
        message: 'Tracking information updated',
        data: order,
    });
});

/**
 * @route   POST /api/orders/:id/return-request
 * @desc    Request a return for an order
 * @access  Private (Owner only)
 */
export const requestReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Auth check: Owner
    if (order.customerId?.toString() !== userId) {
        // Also allow if guest email matches? For now assume logged in user or strict owner.
        // If guest, they can't easily call this API without auth token anyway unless we open it up.
        // User said "customer can initiate", usually implies logged in.
        throw new AppError('Not authorized', 403);
    }

    // Check status
    if (order.status !== 'delivered') {
        throw new AppError('Return can only be requested for delivered orders', 400);
    }

    order.status = 'return_requested';
    // Append return note to customer note
    const returnNote = `[Return Request] Reason: ${reason || 'No reason provided'}. Note: ${note || ''}`;
    order.customerNote = order.customerNote ? `${order.customerNote}\n${returnNote}` : returnNote;

    await order.save();

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'return',
        title: 'Return Requested',
        message: `Return requested for Order #${order.orderNumber}`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            reason: reason
        }
    });

    emitOrderEvent('orderReturn', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());
    res.json({
        success: true,
        message: 'Return requested successfully',
        data: order,
    });
});

/**
 * @route   PATCH /api/orders/:id/return-status
 * @desc    Update return status (Complete return)
 * @access  Private (Admin only)
 */
export const updateReturnStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['returned', 'return_requested'].includes(status)) {
        throw new AppError('Invalid return status', 400);
    }

    const order = await Order.findById(id).populate('storeId customerId');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    order.status = status;
    await order.save();

    // Send notification
    await transactionalNotificationService.sendOrderStatusUpdate(
        order.storeId._id.toString(),
        (order.storeId as any).name,
        order,
        status
    );

    res.json({
        success: true,
        message: 'Return status updated',
        data: order
    });
});

/**
 * @route   PATCH /api/orders/:id/refund
 * @desc    Mark order as refunded
 * @access  Private (Admin only)
 */
export const markOrderAsRefunded = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('storeId customerId');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // "If order is cancelled then admin can set flag as refund"
    // Allow refund for cancelled or returned orders
    if (!['cancelled', 'returned'].includes(order.status)) {
        throw new AppError('Refund is only allowed for cancelled or returned orders', 400);
    }

    order.paymentStatus = 'refunded';
    // We should also have a notification for refunded
    await order.save();

    // Emit order refund event
    emitOrderEvent('orderRefund', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Trigger notification for refunded
    await transactionalNotificationService.sendOrderStatusUpdate(
        order.storeId._id.toString(),
        (order.storeId as any).name,
        order,
        'refunded'
    );

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'order',
        title: 'Order Refunded',
        message: `Order #${order.orderNumber} has been refunded`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: 'refunded'
        }
    });

    res.json({
        success: true,
        message: 'Order marked as refunded',
        data: order
    });
});

/**
 * @route   POST /api/orders/:id/refund-request
 * @desc    Request a refund for an order
 * @access  Private (Owner only)
 */
export const requestRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason, note } = req.body;

    const order = await Order.findById(id).populate('storeId customerId');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Auth check: Owner
    const orderCustomerId = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
    if (orderCustomerId !== userId) {
        throw new AppError('Not authorized', 403);
    }

    // Check payment status
    if (order.paymentStatus !== 'paid') {
        throw new AppError('Refund can only be requested for paid orders', 400);
    }

    // Persist refund request data
    order.refundStatus = 'requested';
    order.refundReason = reason;
    order.refundRequestedAt = new Date();

    await order.save();

    // Emit refund request event
    emitOrderEvent('orderRefundRequest', order, order.storeId._id.toString(), order._id.toString(), order.customerId?.toString());

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'refund',
        title: 'Refund Requested',
        message: `Refund requested for Order #${order.orderNumber}`,
        data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            reason: reason,
            note: note
        }
    });

    res.json({
        success: true,
        message: 'Refund request submitted successfully'
    });
});

/**
 * @desc Update refund status (Admin only)
 * @route PATCH /api/orders/:id/refund-status
 * @access Private/Admin
 */
export const updateRefundStatus = asyncHandler(async (req: any, res: Response) => {
    const { status, adminNote } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (!['requested', 'approved', 'rejected', 'processed', 'none'].includes(status)) {
        throw new AppError('Invalid refund status', 400);
    }

    order.refundStatus = status as any;
    if (adminNote !== undefined) {
        order.adminNote = adminNote;
    }

    // If status is processed, we also update the order payment status and order status
    if (status === 'processed') {
        order.paymentStatus = 'refunded';
        order.status = 'refunded';
        order.refundedAt = new Date();
    }

    await order.save();

    res.json({
        success: true,
        data: order,
        message: `Refund request updated to ${status}`
    });
});
