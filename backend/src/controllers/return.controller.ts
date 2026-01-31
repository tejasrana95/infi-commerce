import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import ReturnRequest, { ReturnRequestStatus } from '../models/ReturnRequest';
import Order from '../models/Order';
import Store from '../models/Store';
import Product from '../models/Product';
import ReturnWindowService from '../services/return-window.service';
import ReturnCalculationService from '../services/return-calculation.service';
import { transactionalNotificationService } from '../services/transactional-notification.service';
import Customer from '../models/Customer';
import { InventoryService } from '../services/inventory.service';
import { AccountingService } from '../services/accounting.service';
import { AppError, asyncHandler } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';


/**
 * Return Request Controller
 * Handles all return/exchange operations for customers and admins
 */

/**
 * @route   POST /api/returns/check-eligibility
 * @desc    Check return eligibility for an order
 * @access  Private (Customer/Admin)
 */
export const checkEligibility = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const storeId = req.headers['x-store-id'] as string;

    if (!orderId) {
        throw new AppError('Order ID is required', 400);
    }

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const eligibility = await ReturnWindowService.checkOrderEligibility(orderId, storeId);

    res.status(200).json({
        success: true,
        data: eligibility,
    });
});

/**
 * @route   POST /api/returns/create
 * @desc    Create a return/exchange request (Customer)
 * @access  Private (Customer)
 */
export const createReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        orderId,
        type, // 'return' | 'exchange'
        items, // Array of { productId, variantId, quantity, reason, exchangeProductId?, exchangeVariantId? }
        reason,
        customerNotes,
        refundMethod, // For returns: 'original' | 'store_credit' | 'bank_transfer'
    } = req.body;

    const storeId = req.headers['x-store-id'] as string;
    const customerId = req.user?.id;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!orderId || !items || items.length === 0) {
        throw new AppError('Order ID and items are required', 400);
    }

    if (!type || !['return', 'exchange'].includes(type)) {
        throw new AppError('Valid return type is required (return or exchange)', 400);
    }

    // Validate the order belongs to the customer
    const order = await Order.findOne({
        _id: orderId,
        storeId: new mongoose.Types.ObjectId(storeId),
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check if customer owns the order (if not admin)
    if (customerId && order.customerId && order.customerId.toString() !== customerId) {
        throw new AppError('You can only return your own orders', 403);
    }

    // Validate eligibility
    const validation = await ReturnWindowService.validateReturnRequest(orderId, storeId, items);

    if (!validation.valid) {
        throw new AppError(`Return validation failed: ${validation.errors.join(', ')}`, 400);
    }

    // Get store settings
    const store = await Store.findById(storeId);
    const returnSettings = store?.settings?.returnSettings || ReturnWindowService.getDefaultSettings();

    // Check if return settings are enabled
    if (!returnSettings.enabled) {
        throw new AppError('Returns and exchanges are currently disabled for this store', 400);
    }

    // Build return items with full details
    const returnItems = await Promise.all(
        items.map(async (item: any) => {
            const orderItem = order.items.find(
                (oi: any) =>
                    oi.productId.toString() === item.productId &&
                    oi.variantId === item.variantId
            );

            if (!orderItem) {
                throw new AppError(`Item not found in order: ${item.productId}`, 400);
            }

            // Calculate refund for this item
            const itemRefund = ReturnCalculationService.calculateItemRefund(
                {
                    productId: orderItem.productId.toString(),
                    variantId: orderItem.variantId,
                    name: orderItem.name,
                    sku: orderItem.sku,
                    originalPrice: orderItem.originalPrice || orderItem.price,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    taxRate: orderItem.taxRate || 0,
                    taxAmount: orderItem.taxAmount || 0,
                    discountAmount: orderItem.discountAmount || 0,
                    couponDiscount: orderItem.couponDiscount || 0,
                    manualDiscount: orderItem.manualDiscount || 0,
                    isCouponEligible: orderItem.isCouponEligible || false,
                    returnedQuantity: orderItem.returnedQuantity || 0,
                    refundedAmount: orderItem.refundedAmount || 0,
                },
                item.quantity
            );

            const returnItem: any = {
                productId: new mongoose.Types.ObjectId(item.productId),
                variantId: item.variantId,
                name: orderItem.name,
                sku: orderItem.sku,
                image: orderItem.image,
                quantity: item.quantity,
                reason: item.reason || reason,
                condition: item.condition,
                refundAmount: itemRefund.totalRefund,
            };

            // For exchange, add exchange product details
            if (type === 'exchange' && item.exchangeProductId) {
                const exchangeProduct = await Product.findById(item.exchangeProductId);
                if (!exchangeProduct) {
                    throw new AppError(`Exchange product not found: ${item.exchangeProductId}`, 400);
                }

                let exchangePrice = exchangeProduct.price;
                let exchangeSku = exchangeProduct.sku;
                let exchangeName = exchangeProduct.name;

                // If variant specified, get variant details
                if (item.exchangeVariantId && exchangeProduct.variants) {
                    const variant = exchangeProduct.variants.find(
                        (v: any) => v._id?.toString() === item.exchangeVariantId
                    );
                    if (variant) {
                        exchangePrice = variant.salePrice || variant.price || exchangePrice;
                        exchangeSku = variant.sku || exchangeSku;
                        exchangeName = `${exchangeProduct.name} - ${Object.values(variant.attributes || {}).join(' / ')}`;
                    }
                }

                returnItem.exchangeProductId = new mongoose.Types.ObjectId(item.exchangeProductId);
                returnItem.exchangeVariantId = item.exchangeVariantId;
                returnItem.exchangeSku = exchangeSku;
                returnItem.exchangeName = exchangeName;
                returnItem.exchangePriceDifference = exchangePrice - orderItem.price;
            }

            return returnItem;
        })
    );

    // Calculate total refund
    const totalRefundAmount = returnItems.reduce((sum: number, item: any) => sum + (item.refundAmount || 0), 0);

    // Create the return request
    const returnRequest = await ReturnRequest.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber: order.orderNumber,
        customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
        type,
        status: returnSettings.autoApproveReturns ? 'approved' : 'pending',
        items: returnItems,
        totalRefundAmount,
        currency: order.currency,
        exchangeRate: order.exchangeRate,
        reason,
        customerNotes,
        requestedAt: new Date(),
        approvedAt: returnSettings.autoApproveReturns ? new Date() : undefined,
        refund: type === 'return' ? {
            method: refundMethod || 'original',
            amount: totalRefundAmount,
            status: 'pending',
        } : undefined,
        exchange: type === 'exchange' ? {
            priceDifference: returnItems.reduce((sum: number, item: any) => sum + (item.exchangePriceDifference || 0), 0),
            paymentRequired: returnItems.some((item: any) => (item.exchangePriceDifference || 0) > 0),
            paymentStatus: 'pending',
        } : undefined,
        statusHistory: [{
            status: returnSettings.autoApproveReturns ? 'approved' : 'pending',
            updatedAt: new Date(),
        }],
    });

    // Sync status to Order
    order.status = type === 'exchange' ? 'exchange_requested' : 'return_requested';
    (order as any).returnStatus = returnRequest.status;
    (order as any).returnRequestId = returnRequest._id;
    await order.save();

    // Send Notification
    try {
        let customerData = null;
        if (order.customerId) {
            customerData = await Customer.findById(order.customerId);
        } else if (order.guestEmail && order.shippingAddress) {
            customerData = {
                email: order.guestEmail,
                firstName: order.shippingAddress.firstName,
                lastName: order.shippingAddress.lastName,
                phone: order.shippingAddress.phone
            } as any;
        }

        if (customerData && store?.settings?.emailNotifications !== false) {
            await transactionalNotificationService.sendReturnRequestCreated(
                storeId,
                store?.name || 'Store',
                // Populate order info for email template if needed, though service handles orderId
                { ...returnRequest.toObject(), orderNumber: order.orderNumber, orderId: order._id },
                customerData
            );
        }
    } catch (error) {
        console.error('Failed to send return notification:', error);
    }

    res.status(201).json({
        success: true,
        message: returnSettings.autoApproveReturns
            ? 'Return request created and auto-approved'
            : 'Return request created successfully',
        data: returnRequest,
    });
});

/**
 * @route   POST /api/returns/admin/create
 * @desc    Admin creates a return/exchange request
 * @access  Private (Admin)
 */
export const adminCreateReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        orderId,
        type,
        items,
        reason,
        adminNotes,
        refundMethod,
        autoApprove = true,
    } = req.body;

    const storeId = req.headers['x-store-id'] as string;
    const adminId = req.user?.id;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    // Similar to customer create but with admin privileges
    const order = await Order.findOne({
        _id: orderId,
        storeId: new mongoose.Types.ObjectId(storeId),
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Build return items (same logic as customer)
    const returnItems = await Promise.all(
        items.map(async (item: any) => {
            const orderItem = order.items.find(
                (oi: any) =>
                    oi.productId.toString() === item.productId &&
                    oi.variantId === item.variantId
            );

            if (!orderItem) {
                throw new AppError(`Item not found in order: ${item.productId}`, 400);
            }

            const itemRefund = ReturnCalculationService.calculateItemRefund(
                {
                    productId: orderItem.productId.toString(),
                    variantId: orderItem.variantId,
                    name: orderItem.name,
                    sku: orderItem.sku,
                    originalPrice: orderItem.originalPrice || orderItem.price,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    taxRate: orderItem.taxRate || 0,
                    taxAmount: orderItem.taxAmount || 0,
                    discountAmount: orderItem.discountAmount || 0,
                    couponDiscount: orderItem.couponDiscount || 0,
                    manualDiscount: orderItem.manualDiscount || 0,
                    isCouponEligible: orderItem.isCouponEligible || false,
                    returnedQuantity: orderItem.returnedQuantity || 0,
                    refundedAmount: orderItem.refundedAmount || 0,
                },
                item.quantity
            );

            return {
                productId: new mongoose.Types.ObjectId(item.productId),
                variantId: item.variantId,
                name: orderItem.name,
                sku: orderItem.sku,
                image: orderItem.image,
                quantity: item.quantity,
                reason: item.reason || reason,
                condition: item.condition,
                refundAmount: itemRefund.totalRefund,
            };
        })
    );

    const totalRefundAmount = returnItems.reduce((sum: number, item: any) => sum + (item.refundAmount || 0), 0);

    const returnRequest = await ReturnRequest.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        type,
        status: autoApprove ? 'approved' : 'pending',
        items: returnItems,
        totalRefundAmount,
        reason,
        adminNotes,
        requestedAt: new Date(),
        approvedAt: autoApprove ? new Date() : undefined,
        processedBy: new mongoose.Types.ObjectId(adminId),
        refund: type === 'return' ? {
            method: refundMethod || 'original',
            amount: totalRefundAmount,
            status: 'pending',
        } : undefined,
    });

    // Sync status to Order
    order.status = 'return_requested';
    (order as any).returnStatus = returnRequest.status;
    (order as any).returnRequestId = returnRequest._id;
    await order.save();

    res.status(201).json({
        success: true,
        message: 'Return request created by admin',
        data: returnRequest,
    });
});

/**
 * @route   GET /api/returns/:id
 * @desc    Get return request details
 * @access  Private (Customer/Admin)
 */
export const getReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const storeId = req.headers['x-store-id'] as string;
    const userId = req.user?.id;
    const isAdmin = ['admin', 'store_admin', 'super_admin'].includes(req.user?.role || '');

    const query: any = { _id: id };
    if (storeId) {
        query.storeId = new mongoose.Types.ObjectId(storeId);
    }
    if (!isAdmin && userId) {
        query.customerId = new mongoose.Types.ObjectId(userId);
    }

    const returnRequest = await ReturnRequest.findOne(query)
        .populate('orderId', 'orderNumber total currency shippingAddress')
        .populate('customerId', 'firstName lastName email')
        .populate('processedBy', 'firstName lastName');

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    res.status(200).json({
        success: true,
        data: returnRequest,
    });
});

/**
 * @route   GET /api/returns/user/me
 * @desc    Get customer's return requests
 * @access  Private (Customer)
 */
export const getUserReturnRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const customerId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    if (!customerId) {
        throw new AppError('Authentication required', 401);
    }

    const query: any = {
        customerId: new mongoose.Types.ObjectId(customerId),
    };

    if (storeId) {
        query.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (status) {
        query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [returnRequests, total] = await Promise.all([
        ReturnRequest.find(query)
            .sort({ requestedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('orderId', 'orderNumber total currency'),
        ReturnRequest.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        data: returnRequests,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/returns
 * @desc    Get all return requests (Admin)
 * @access  Private (Admin)
 */
export const getAllReturnRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const { status, type, search, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (storeId) {
        query.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (status) {
        query.status = status;
    }

    if (type) {
        query.type = type;
    }

    if (search) {
        query.$or = [
            { requestNumber: { $regex: search, $options: 'i' } },
            { orderNumber: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [returnRequests, total] = await Promise.all([
        ReturnRequest.find(query)
            .sort({ requestedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('customerId', 'firstName lastName email')
            .populate('orderId', 'orderNumber total currency'),
        ReturnRequest.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        data: returnRequests,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   PATCH /api/returns/:id/approve
 * @desc    Approve return request
 * @access  Private (Admin)
 */
export const approveReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    if (returnRequest.status !== 'pending') {
        throw new AppError('Only pending requests can be approved', 400);
    }

    returnRequest.status = 'approved';
    returnRequest.approvedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
        returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    // Sync status to Order
    await Order.findByIdAndUpdate(returnRequest.orderId, { returnStatus: 'approved' });

    // Send Notification
    try {
        const fullRequest = await ReturnRequest.findById(id)
            .populate('customerId')
            .populate('orderId');

        if (fullRequest && fullRequest.customerId) {
            const store = await Store.findById(fullRequest.storeId);
            await transactionalNotificationService.sendReturnStatusUpdate(
                fullRequest.storeId.toString(),
                store?.name || 'Store',
                fullRequest,
                fullRequest.customerId
            );
        }
    } catch (error) {
        console.error('Failed to send return approval notification:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Return request approved',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/reject
 * @desc    Reject return request
 * @access  Private (Admin)
 */
export const rejectReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNotes, reason } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    if (!['pending', 'approved'].includes(returnRequest.status)) {
        throw new AppError('This request cannot be rejected', 400);
    }

    returnRequest.status = 'rejected';
    returnRequest.rejectedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    returnRequest.adminNotes = adminNotes || reason || 'Request rejected by admin';

    await returnRequest.save();

    // Sync status to Order
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
        (order as any).returnStatus = 'rejected';
        if (order.status === 'return_requested') {
            order.status = 'delivered'; // Revert to delivered if it was return_requested
        }
        await order.save();
    }

    // Send Notification
    try {
        const fullRequest = await ReturnRequest.findById(id)
            .populate('customerId')
            .populate('orderId');

        if (fullRequest && fullRequest.customerId) {
            const store = await Store.findById(fullRequest.storeId);
            await transactionalNotificationService.sendReturnStatusUpdate(
                fullRequest.storeId.toString(),
                store?.name || 'Store',
                fullRequest,
                fullRequest.customerId
            );
        }
    } catch (error) {
        console.error('Failed to send return rejection notification:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Return request rejected',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/schedule-pickup
 * @desc    Schedule pickup for return items
 * @access  Private (Admin)
 */
export const schedulePickup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { method, scheduledDate, scheduledSlot, address, courierName, trackingNumber, trackingUrl, adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    if (!['approved', 'pickup_scheduled'].includes(returnRequest.status)) {
        throw new AppError('Only approved requests can have pickup scheduled', 400);
    }

    returnRequest.status = 'pickup_scheduled';
    returnRequest.pickup = {
        method: method || 'pickup',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledSlot,
        address,
        courierName,
        trackingNumber,
        trackingUrl,
        adminNotes,
    };
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);

    await returnRequest.save();

    // Sync status to Order
    await Order.findByIdAndUpdate(returnRequest.orderId, { returnStatus: 'pickup_scheduled' });

    res.status(200).json({
        success: true,
        message: 'Pickup scheduled',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/mark-received
 * @desc    Mark items as received
 * @access  Private (Admin)
 */
export const markReceived = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    returnRequest.status = 'received';
    if (returnRequest.pickup) {
        returnRequest.pickup.receivedAt = new Date();
    }
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
        returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    // Sync status to Order
    await Order.findByIdAndUpdate(returnRequest.orderId, { returnStatus: 'received' });

    // Restore Inventory logic
    if (returnRequest.items && returnRequest.items.length > 0) {
        try {
            await InventoryService.restoreStock(returnRequest.items.map(i => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity
            })));
        } catch (error) {
            console.error('Failed to restore inventory on return receipt:', error);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Items marked as received',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/process-refund
 * @desc    Process refund for return
 * @access  Private (Admin)
 */
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { transactionId, adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    if (returnRequest.type !== 'return') {
        throw new AppError('This is an exchange request, not a return', 400);
    }

    const order = await Order.findById(returnRequest.orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    console.log('📦 Processing refund for order:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: order.paymentId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
    });

    // Process refund via payment gateway if refund method is 'original'
    let gatewayRefundResponse = null;
    if (returnRequest.refund?.method === 'original' && order.paymentStatus === 'paid') {
        // Only process refund for paid orders with gateway payments
        if (order.paymentMethod && ['razorpay', 'stripe', 'paypal'].includes(order.paymentMethod)) {
            try {
                // Validate that we have a valid payment ID
                if (!order.paymentId) {
                    throw new AppError(
                        'No payment ID found for this order. Cannot process refund.',
                        400
                    );
                }

                // Get the appropriate payment service gateway instance
                const paymentService = await PaymentService.getGatewayInstance({
                    storeId: order.storeId.toString(),
                    gatewayType: order.paymentMethod,
                });

                // Convert refund amount using exchange rate from return request or order
                let refundAmountInGatewayCurrency = returnRequest.refund.amount || 0;

                // Use exchange rate from return request (captured at return creation) or fallback to order's exchange rate
                const exchangeRateToUse = returnRequest.exchangeRate || order.exchangeRate || 1;

                // If exchange rate is not 1, convert the amount
                if (exchangeRateToUse && exchangeRateToUse !== 1) {
                    refundAmountInGatewayCurrency = refundAmountInGatewayCurrency * exchangeRateToUse;
                }

                // Get currency from return request or order
                const currencyToUse = returnRequest.currency || order.currency || 'USD';

                // Process refund via gateway
                gatewayRefundResponse = await paymentService.processRefund({
                    paymentId: order.paymentId,
                    amount: refundAmountInGatewayCurrency,
                    currency: currencyToUse,
                    reason: `Refund for returned order #${order.orderNumber}`,
                });
                if (gatewayRefundResponse.status !== 'success') {
                    const errorMessage =
                        gatewayRefundResponse.gatewayResponse?.message ||
                        gatewayRefundResponse.gatewayResponse?.raw?.message ||
                        gatewayRefundResponse.gatewayResponse?.toString() ||
                        'Unknown error';

                    throw new AppError(
                        `Refund processing failed: ${errorMessage}`,
                        400
                    );
                }
            } catch (error: any) {
                console.error('Payment gateway refund error:', error);
                throw new AppError(
                    `Failed to process refund via ${order.paymentMethod}: ${error.message}`,
                    400
                );
            }
        }
    }

    // Update order items with returned quantities
    for (const returnItem of returnRequest.items) {
        const orderItem = order.items.find(
            (oi: any) =>
                oi.productId.toString() === returnItem.productId.toString() &&
                oi.variantId === returnItem.variantId
        );
        if (orderItem) {
            orderItem.returnedQuantity = (orderItem.returnedQuantity || 0) + returnItem.quantity;
            orderItem.refundedAmount = (orderItem.refundedAmount || 0) + (returnItem.refundAmount || 0);
        }
    }

    // Check if all items are returned
    const allReturned = order.items.every((i: any) => (i.returnedQuantity || 0) >= i.quantity);
    order.status = allReturned ? 'returned' : 'partially_returned';
    order.refundStatus = 'processed';
    (order as any).returnStatus = 'refund_completed';

    // Update paymentStatus based on full or partial return
    if (order.paymentStatus === 'paid') {
        order.paymentStatus = allReturned ? 'refunded' : 'partially_refunded';
        order.refundedAt = new Date();
    }

    // Store gateway refund reference for future tracking
    if (gatewayRefundResponse?.refundId) {
        order.refundReferenceId = gatewayRefundResponse.refundId;
    }

    // Add to order returns history
    if (!order.returns) {
        order.returns = [];
    }
    order.returns.push({
        returnedAt: new Date(),
        items: returnRequest.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reason: item.reason,
            refundAmount: item.refundAmount || 0,
        })),
        totalRefundAmount: returnRequest.refund?.amount || 0,
        refundMethod: returnRequest.refund?.method || 'original',
        processedBy: new mongoose.Types.ObjectId(adminId as string),
        refundReference: gatewayRefundResponse?.refundId || transactionId,
        note: adminNotes
    });

    await order.save();

    // Sync Accounting
    try {
        await AccountingService.syncReturnsToAccounting(order._id.toString());
    } catch (error) {
        console.error('Failed to sync accounting for return:', error);
    }

    // Update return request
    returnRequest.status = 'refund_completed';
    returnRequest.completedAt = new Date();
    if (returnRequest.refund) {
        returnRequest.refund.status = 'completed';
        returnRequest.refund.processedAt = new Date();
        returnRequest.refund.transactionId = gatewayRefundResponse?.refundId || transactionId;
    }
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
        returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    try {
        const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
        if (fullRequest && fullRequest.customerId) {
            const store = await Store.findById(fullRequest.storeId);
            await transactionalNotificationService.sendReturnStatusUpdate(
                fullRequest.storeId.toString(),
                store?.name || 'Store',
                fullRequest,
                fullRequest.customerId
            );
        }
    } catch { }

    res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/ship-exchange
 * @desc    Ship exchange order
 * @access  Private (Admin)
 */
export const shipExchange = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newOrderId, newOrderNumber, trackingNumber, courierName, adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    if (returnRequest.type !== 'exchange') {
        throw new AppError('This is a return request, not an exchange', 400);
    }

    // Update exchange details
    if (!returnRequest.exchange) {
        returnRequest.exchange = {};
    }
    returnRequest.exchange.newOrderId = newOrderId ? new mongoose.Types.ObjectId(newOrderId) : undefined;
    returnRequest.exchange.newOrderNumber = newOrderNumber;

    returnRequest.status = 'exchange_shipped';
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
        returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    // Sync status to Order
    await Order.findByIdAndUpdate(returnRequest.orderId, { returnStatus: 'exchange_shipped' });

    try {
        const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
        if (fullRequest && fullRequest.customerId) {
            const store = await Store.findById(fullRequest.storeId);
            await transactionalNotificationService.sendReturnStatusUpdate(
                fullRequest.storeId.toString(),
                store?.name || 'Store',
                fullRequest,
                fullRequest.customerId
            );
        }
    } catch { }

    res.status(200).json({
        success: true,
        message: 'Exchange order shipped',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/complete
 * @desc    Complete return/exchange request
 * @access  Private (Admin)
 */
export const completeReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    returnRequest.status = 'completed';
    returnRequest.completedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
        returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    // Sync status to Order
    await Order.findByIdAndUpdate(returnRequest.orderId, { returnStatus: 'completed' });

    res.status(200).json({
        success: true,
        message: 'Return request completed',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/cancel
 * @desc    Cancel return request
 * @access  Private (Customer/Admin)
 */
export const cancelReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const isAdmin = ['admin', 'store_admin', 'super_admin'].includes(req.user?.role || '');

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
        throw new AppError('Return request not found', 404);
    }

    // Customers can only cancel their own pending requests
    if (!isAdmin) {
        if (returnRequest.customerId?.toString() !== userId) {
            throw new AppError('You can only cancel your own requests', 403);
        }
        if (!['pending', 'approved'].includes(returnRequest.status)) {
            throw new AppError('You can only cancel pending or approved requests', 400);
        }
    }

    returnRequest.status = 'cancelled';
    returnRequest.adminNotes = reason || 'Cancelled by ' + (isAdmin ? 'admin' : 'customer');
    returnRequest.processedBy = new mongoose.Types.ObjectId(userId);

    await returnRequest.save();

    // Sync status to Order
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
        (order as any).returnStatus = 'cancelled';
        if (order.status === 'return_requested') {
            order.status = 'delivered'; // Revert to delivered if it was return_requested
        }
        await order.save();
    }

    res.status(200).json({
        success: true,
        message: 'Return request cancelled',
        data: returnRequest,
    });
});
