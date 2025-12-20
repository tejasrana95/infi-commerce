import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import shippingCalculatorService from '../services/shipping-calculator.service';

/**
 * Validation rules
 */
export const createOrderValidation = [
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
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

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        // Get variant if specified
        let price = product.salePrice || product.price;
        let sku = product.sku;
        let variantAttributes: Record<string, string> = {};

        if (item.variantId && product.variants) {
            const variant = product.variants.find((v: any) => v._id?.toString() === item.variantId);
            if (variant) {
                price = variant.salePrice || variant.price || price;
                sku = variant.sku || sku;
                variantAttributes = variant.attributes || {};
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
            image: product.images?.[0] || '',
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
        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product && product.manageStock) {
                product.stock = Math.max(0, product.stock - item.quantity);
                await product.save();
            }
        }
    }

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
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            let price = product.salePrice || product.price;
            let sku = product.sku;
            let name = product.name;
            let attributes = {};

            if (item.variantId && product.variants) {
                const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
                if (variant) {
                    price = variant.salePrice || variant.price || price;
                    sku = variant.sku || sku;
                    attributes = variant.attributes || {};
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
                image: product.images?.[0],
            });
        }

        order.items = orderItems;
        order.subtotal = subtotal;
    }

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

    // Recalculate total
    order.total = order.subtotal + order.shippingCost + order.tax - order.discount;

    await order.save();

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

    // Create order
    const order = await Order.create({
        storeId,
        customerId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        guestEmail: !userId ? guestEmail.toLowerCase() : undefined,
        orderNumber,
        items: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            attributes: item.attributes,
            weight: (item.productId as any).weight,
        })),
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        currency: shippingResult.currency,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        customerNote,
    });

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

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

    // Get payment gateway instance
    const gateway = await PaymentService.selectGateway({
        storeId: order.storeId.toString(),
        country: order.billingAddress.country,
        currency: order.currency,
        preferredGateway: order.paymentMethod,
    });

    // Create payment with gateway
    const payment = await gateway.instance.createPayment({
        orderId: order.orderNumber,
        amount: order.total,
        currency: order.currency,
        customerEmail: userId ? req.user!.email : order.guestEmail!,
        customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        description: `Order ${order.orderNumber}`,
        metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: userId || 'guest',
            guestEmail: order.guestEmail,
        },
    });

    if (!payment.success) {
        throw new AppError('Failed to initialize payment', 500);
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
            amount: order.total,
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
            storeId: order.storeId.toString(),
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
                email: req.user!.email,
                contact: order.shippingAddress.phone,
            },
        };
    } else if (gateway.gatewayType === 'stripe') {
        // For Stripe, frontend needs client secret
        response.data.stripe = {
            clientSecret: payment.clientSecret,
            publishableKey: (await PaymentService.getGatewayConfig({
                storeId: order.storeId.toString(),
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
 * @desc    Get order by ID
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const order = await Order.findById(id)
        .populate('items.productId', 'name slug images')
        .populate('customerId', 'firstName lastName email')
        .populate('storeId', 'name');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check authorization - user can only view their own orders unless admin
    const isAdmin = userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin';
    const isOwner = order.customerId && order.customerId.toString() === userId;

    if (!isAdmin && !isOwner) {
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

    const filter: any = { userId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('storeId', 'name')
            .sort({ createdAt: -1 })
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
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin/Store Admin)
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status, paymentStatus, storeId, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (storeId) filter.storeId = storeId;
    if (search) {
        filter.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
            { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customerId', 'firstName lastName email')
            .populate('storeId', 'name')
            .sort({ createdAt: -1 })
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
    const { status, trackingNumber, adminNote } = req.body;

    const order = await Order.findById(id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Update status
    order.status = status;
    if (adminNote) order.adminNote = adminNote;

    // Set timestamps based on status
    if (status === 'shipped' && !order.shippedAt) {
        order.shippedAt = new Date();
        if (trackingNumber) order.trackingNumber = trackingNumber;
    }

    if (status === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date();
    }

    await order.save();

    // TODO: Send email notification to customer

    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
    });
});

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const order = await Order.findById(id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check authorization
    if (userRole !== 'admin' && userRole !== 'store_admin' && order.customerId?.toString() !== userId) {
        throw new AppError('Not authorized to cancel this order', 403);
    }

    // Can only cancel pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
        throw new AppError('Cannot cancel order in current status', 400);
    }

    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
        });
    }

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

    const order = await Order.findById(id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Update payment status
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paymentId = paymentId;
    order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };

    await order.save();

    // Reduce product stock
    for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.manageStock) {
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
        }
    }

    // Increment coupon usage if coupon was used
    const couponId = order.paymentDetails?.couponId;
    if (couponId) {
        const coupon = await Coupon.findById(couponId);
        if (coupon) {
            await coupon.incrementUsage(order.customerId?.toString() || '');
        }
    }

    // TODO: Send order confirmation email

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

    const order = await Order.findById(id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    order.paymentStatus = 'failed';
    order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };

    await order.save();

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
