/**
 * Return Request Controller
 * Handles all return/exchange operations for customers and admins
 * 
 * Features:
 * - Full and partial returns with transparent tax + shipping breakdown
 * - Exchange processing with price difference calculation
 * - Automatic inventory restoration on receipt
 * - Payment gateway refund integration
 * - Status tracking with notifications
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import ReturnRequest from '../models/ReturnRequest';
import Order from '../models/Order';
import Store from '../models/Store';
import Product from '../models/Product';
import Customer from '../models/Customer';
import ReturnWindowService from '../services/return-window.service';
import { transactionalNotificationService } from '../services/transactional-notification.service';
import { notificationService } from '../services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { AccountingService } from '../services/accounting.service';
import { AppError, asyncHandler } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';
import { emitOrderEvent } from '../events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ReturnItemInput {
    productId: string;
    variantId?: string;
    quantity: number;
    reason?: string;
    condition?: string;
    exchangeProductId?: string;
    exchangeVariantId?: string;
}

interface ReturnItemDetails {
    productId: mongoose.Types.ObjectId;
    variantId?: string;
    name: string;
    sku: string;
    image?: string;
    quantity: number;
    reason?: string;
    condition?: string;
    // Refund breakdown (transparent to customer)
    unitPrice: number;
    unitTax: number;
    unitShipping: number;
    subtotalRefund: number;
    taxRefund: number;
    shippingRefund: number;
    refundAmount: number;
    // Exchange details
    exchangeProductId?: mongoose.Types.ObjectId;
    exchangeVariantId?: string;
    exchangeSku?: string;
    exchangeName?: string;
    exchangePriceDifference?: number;
}

interface RefundBreakdown {
    itemsSubtotal: number;
    itemsTax: number;
    itemsShipping: number;
    totalRefund: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build return items with full refund breakdown including tax and shipping
 */
async function buildReturnItems(
    order: any,
    items: ReturnItemInput[],
    type: 'return' | 'exchange',
    globalReason?: string
): Promise<{ returnItems: ReturnItemDetails[]; breakdown: RefundBreakdown }> {
    const returnItems: ReturnItemDetails[] = [];
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalShipping = 0;

    for (const item of items) {
        const orderItem = order.items.find(
            (oi: any) =>
                oi.productId.toString() === item.productId &&
                oi.variantId === item.variantId
        );

        if (!orderItem) {
            throw new AppError(`Item not found in order: ${item.productId}`, 400);
        }

        // Validate return quantity
        const alreadyReturned = orderItem.returnedQuantity || 0;
        const maxReturnable = orderItem.quantity - alreadyReturned;

        if (item.quantity > maxReturnable) {
            throw new AppError(
                `Cannot return ${item.quantity} of ${orderItem.name}. Only ${maxReturnable} available.`,
                400
            );
        }

        if (item.quantity <= 0) {
            throw new AppError(`Return quantity must be positive for ${orderItem.name}`, 400);
        }

        // Get per-unit values (stored at order creation)
        const unitPrice = orderItem.price;
        const unitTax = orderItem.taxAmount || 0;
        const unitShipping = orderItem.shippingCost || 0;

        // Calculate refund amounts for this return quantity
        const subtotalRefund = parseFloat((unitPrice * item.quantity).toFixed(2));
        const taxRefund = parseFloat((unitTax * item.quantity).toFixed(2));
        const shippingRefund = parseFloat((unitShipping * item.quantity).toFixed(2));
        const refundAmount = parseFloat((subtotalRefund + taxRefund + shippingRefund).toFixed(2));

        totalSubtotal += subtotalRefund;
        totalTax += taxRefund;
        totalShipping += shippingRefund;

        const returnItem: ReturnItemDetails = {
            productId: new mongoose.Types.ObjectId(item.productId),
            variantId: item.variantId,
            name: orderItem.name,
            sku: orderItem.sku,
            image: orderItem.image,
            quantity: item.quantity,
            reason: item.reason || globalReason,
            condition: item.condition,
            // Transparent breakdown
            unitPrice,
            unitTax,
            unitShipping,
            subtotalRefund,
            taxRefund,
            shippingRefund,
            refundAmount,
        };

        // Handle exchange product details
        if (type === 'exchange' && item.exchangeProductId) {
            const exchangeProduct = await Product.findById(item.exchangeProductId);
            if (!exchangeProduct) {
                throw new AppError(`Exchange product not found: ${item.exchangeProductId}`, 400);
            }

            let exchangePrice = exchangeProduct.salePrice || exchangeProduct.price;
            let exchangeSku = exchangeProduct.sku;
            let exchangeName = exchangeProduct.name;

            if (item.exchangeVariantId && exchangeProduct.variants) {
                const variant = exchangeProduct.variants.find(
                    (v: any) => v._id?.toString() === item.exchangeVariantId
                );
                if (variant) {
                    exchangePrice = variant.salePrice || variant.price || exchangePrice;
                    exchangeSku = variant.sku || exchangeSku;
                    const attrValues = Object.values(variant.attributes || {}).join(' / ');
                    exchangeName = attrValues ? `${exchangeProduct.name} - ${attrValues}` : exchangeName;
                }
            }

            returnItem.exchangeProductId = new mongoose.Types.ObjectId(item.exchangeProductId);
            returnItem.exchangeVariantId = item.exchangeVariantId;
            returnItem.exchangeSku = exchangeSku;
            returnItem.exchangeName = exchangeName;
            returnItem.exchangePriceDifference = parseFloat((exchangePrice - unitPrice).toFixed(2));
        }

        returnItems.push(returnItem);
    }

    // Check for "Full Return" scenario
    // If the user is returning everything remaining in the order, we should ensure the full remaining shipping cost is refunded.
    // This handles cases where per-item shipping costs might not sum up to the total order shipping cost (data mismatch).
    let isFullReturn = true;
    for (const orderItem of order.items) {
        const returnItem = items.find(ri =>
            ri.productId === orderItem.productId.toString() &&
            ri.variantId === orderItem.variantId
        );
        const returningQty = returnItem ? returnItem.quantity : 0;
        const alreadyReturned = orderItem.returnedQuantity || 0;
        if (returningQty + alreadyReturned < orderItem.quantity) {
            isFullReturn = false;
            break;
        }
    }

    if (isFullReturn) {
        // Calculate how much shipping has already been refunded
        const previousShippingRefunds = (order.returns || []).reduce((sum: number, r: any) => sum + (r.refundBreakdown?.itemsShipping || 0), 0);
        const remainingGlobalShipping = Math.max(0, order.shippingCost - previousShippingRefunds);

        // If our calculated totalShipping (from items) is less than the actual remaining shipping cost, upgrade it.
        // We only upgrade, never downgrade (in case per-item calculation is intentionally higher for some reason, though unlikely)
        if (remainingGlobalShipping > totalShipping) {
            const diff = remainingGlobalShipping - totalShipping;
            totalShipping = remainingGlobalShipping;

            // Distribute the difference to the first item (simplest way to ensure item sum matches total)
            if (returnItems.length > 0) {
                returnItems[0].shippingRefund = parseFloat((returnItems[0].shippingRefund + diff).toFixed(2));
                returnItems[0].refundAmount = parseFloat((returnItems[0].refundAmount + diff).toFixed(2));
            }
        }
    }

    return {
        returnItems,
        breakdown: {
            itemsSubtotal: parseFloat(totalSubtotal.toFixed(2)),
            itemsTax: parseFloat(totalTax.toFixed(2)),
            itemsShipping: parseFloat(totalShipping.toFixed(2)),
            totalRefund: parseFloat((totalSubtotal + totalTax + totalShipping).toFixed(2)),
        },
    };
}

/**
 * Validate order ownership and eligibility
 */
async function validateOrderForReturn(
    orderId: string,
    storeId: string,
    customerId?: string,
    isAdmin = false
): Promise<any> {
    const order = await Order.findOne({
        _id: orderId,
        storeId: new mongoose.Types.ObjectId(storeId),
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Non-admin customers can only return their own orders
    if (!isAdmin && customerId && order.customerId?.toString() !== customerId) {
        throw new AppError('You can only return your own orders', 403);
    }

    return order;
}

/**
 * Send return notification safely
 */
async function sendReturnNotification(
    returnRequest: any,
    order: any,
    store: any,
    notificationType: 'created' | 'status_update'
): Promise<void> {
    try {
        let customerData = null;

        if (order.customerId) {
            customerData = await Customer.findById(order.customerId);
        } else if (order.guestEmail && order.shippingAddress) {
            customerData = {
                email: order.guestEmail,
                firstName: order.shippingAddress.firstName,
                lastName: order.shippingAddress.lastName,
                phone: order.shippingAddress.phone,
            };
        }

        if (!customerData || store?.settings?.emailNotifications === false) {
            return;
        }

        const storeId = store._id?.toString() || returnRequest.storeId.toString();
        const storeName = store?.name || 'Store';

        if (notificationType === 'created') {
            await transactionalNotificationService.sendReturnRequestCreated(
                storeId,
                storeName,
                { ...returnRequest.toObject(), orderNumber: order.orderNumber },
                customerData
            );
        } else {
            await transactionalNotificationService.sendReturnStatusUpdate(
                storeId,
                storeName,
                returnRequest,
                customerData
            );
        }
    } catch (error) {
        console.error('Failed to send return notification:', error);
    }
}

/**
 * Sync return status to parent order
 */
async function syncOrderStatus(
    orderId: mongoose.Types.ObjectId,
    returnStatus: string,
    orderStatusOverride?: string
): Promise<void> {
    const updateData: any = { returnStatus };
    if (orderStatusOverride) {
        updateData.status = orderStatusOverride;
    }
    await Order.findByIdAndUpdate(orderId, updateData);
}

/**
 * Add status to history
 */
function addStatusHistory(returnRequest: any, status: string, details?: any): void {
    if (!returnRequest.statusHistory) {
        returnRequest.statusHistory = [];
    }
    const entry: any = { status, updatedAt: new Date() };
    if (details) {
        if (details.note) entry.note = details.note;
        if (details.updatedBy) entry.updatedBy = details.updatedBy;
        if (details.shipping) entry.shipping = details.shipping;
        if (details.pickup) entry.pickup = details.pickup;
    }
    returnRequest.statusHistory.push(entry);
}

/**
 * Mask sensitive data - show first character and last 2 characters only
 */
function maskSensitiveData(value: string | undefined): string | undefined {
    if (!value || value.length <= 3) return value;
    const first = value.charAt(0);
    const last2 = value.slice(-2);
    const middleLength = value.length - 3;
    const masked = 'x'.repeat(middleLength * 2); // Use 'xx' for each masked character
    return `${first}${masked}${last2}`;
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * @route   POST /api/returns/check-eligibility
 * @desc    Check return eligibility for an order
 * @access  Private (Customer/Admin)
 */
export const checkEligibility = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const storeId = req.headers['x-store-id'] as string;

    if (!orderId) throw new AppError('Order ID is required', 400);
    if (!storeId) throw new AppError('Store ID is required', 400);

    const eligibility = await ReturnWindowService.checkOrderEligibility(orderId, storeId);

    res.status(200).json({
        success: true,
        data: eligibility,
    });
});

/**
 * @route   POST /api/returns/calculate
 * @desc    Calculate refund amount for items (preview before creating return)
 * @access  Private (Customer/Admin)
 */
export const calculateRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, items } = req.body;
    const storeId = req.headers['x-store-id'] as string;
    const customerId = req.user?.id;
    const isAdmin = ['admin', 'store_admin', 'super_admin'].includes(req.user?.role || '');

    if (!orderId || !items?.length) {
        throw new AppError('Order ID and items are required', 400);
    }
    if (!storeId) throw new AppError('Store ID is required', 400);

    const order = await validateOrderForReturn(orderId, storeId, customerId, isAdmin);
    const { returnItems, breakdown } = await buildReturnItems(order, items, 'return');

    res.status(200).json({
        success: true,
        data: {
            items: returnItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitTax: item.unitTax,
                unitShipping: item.unitShipping,
                subtotalRefund: item.subtotalRefund,
                taxRefund: item.taxRefund,
                shippingRefund: item.shippingRefund,
                refundAmount: item.refundAmount,
            })),
            breakdown,
        },
    });
});

/**
 * @route   POST /api/returns/create
 * @desc    Create a return/exchange request (Customer)
 * @access  Private (Customer)
 */
export const createReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, type, items, reason, customerNotes, refundMethod, bankDetails } = req.body;
    const storeId = req.headers['x-store-id'] as string;
    const customerId = req.user?.id;

    // Validation
    if (!storeId) throw new AppError('Store ID is required', 400);
    if (!orderId || !items?.length) throw new AppError('Order ID and items are required', 400);
    if (!type || !['return', 'exchange'].includes(type)) {
        throw new AppError('Valid return type is required (return or exchange)', 400);
    }

    // Fetch and validate order
    const order = await validateOrderForReturn(orderId, storeId, customerId);

    // Validate return window eligibility
    const validation = await ReturnWindowService.validateReturnRequest(orderId, storeId, items);
    if (!validation.valid) {
        throw new AppError(`Return validation failed: ${validation.errors.join(', ')}`, 400);
    }

    // Get store settings
    const store = await Store.findById(storeId);
    const returnSettings = store?.settings?.returnSettings || ReturnWindowService.getDefaultSettings();

    if (!returnSettings.enabled) {
        throw new AppError('Returns and exchanges are currently disabled for this store', 400);
    }

    // Build return items with full breakdown
    const { returnItems, breakdown } = await buildReturnItems(order, items, type, reason);
    const initialStatus = returnSettings.autoApproveReturns ? 'approved' : 'pending';

    // Create the return request
    const returnRequest = await ReturnRequest.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber: order.orderNumber,
        customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
        type,
        status: initialStatus,
        items: returnItems,
        // Transparent refund breakdown
        refundBreakdown: breakdown,
        totalRefundAmount: breakdown.totalRefund,
        currency: order.currency,
        exchangeRate: order.exchangeRate,
        reason,
        customerNotes,
        requestedAt: new Date(),
        approvedAt: returnSettings.autoApproveReturns ? new Date() : undefined,
        refund: type === 'return' ? {
            method: refundMethod || 'original',
            amount: breakdown.totalRefund,
            subtotal: breakdown.itemsSubtotal,
            tax: breakdown.itemsTax,
            shipping: breakdown.itemsShipping,
            status: 'pending',
            ...(refundMethod === 'bank_transfer' && bankDetails && { bankDetails }),
        } : undefined,
        exchange: type === 'exchange' ? {
            priceDifference: returnItems.reduce((sum, item) => sum + (item.exchangePriceDifference || 0), 0),
            paymentRequired: returnItems.some(item => (item.exchangePriceDifference || 0) > 0),
            paymentStatus: 'pending',
        } : undefined,
        statusHistory: [{ status: initialStatus, updatedAt: new Date() }],
    });

    // Update order status
    order.status = type === 'exchange' ? 'exchange_requested' : 'return_requested';
    order.returnStatus = returnRequest.status;
    order.returnRequestId = returnRequest._id;
    await order.save();

    // Send notification
    await sendReturnNotification(returnRequest, order, store, 'created');

    // Create admin dashboard notification
    try {
        await notificationService.createAdminNotification({
            type: type === 'return' ? 'return' : 'exchange',
            title: type === 'return' ? 'New Return Request' : 'New Exchange Request',
            message: `${type === 'return' ? 'Return' : 'Exchange'} request #${returnRequest._id.toString().slice(-6)} for order ${order.orderNumber}`,
            data: {
                returnId: returnRequest._id.toString(),
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                type,
                amount: breakdown.totalRefund,
            },
        });
    } catch (notificationError) {
        console.error('Failed to send admin notifications:', notificationError);
    }

    // Emit order event for 3rd party integrations
    emitOrderEvent(
        'orderRefundRequest',
        order,
        storeId,
        order._id.toString(),
        customerId
    );

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
    const { orderId, type, items, reason, adminNotes, refundMethod, autoApprove = true } = req.body;
    const storeId = req.headers['x-store-id'] as string || req.body.storeId;
    const adminId = req.user?.id;

    if (!storeId) throw new AppError('Store ID is required', 400);
    if (!orderId || !items?.length) throw new AppError('Order ID and items are required', 400);

    const order = await validateOrderForReturn(orderId, storeId, undefined, true);
    const returnType = type || 'return';
    const { returnItems, breakdown } = await buildReturnItems(order, items, returnType, reason);
    const initialStatus = autoApprove ? 'approved' : 'pending';

    const returnRequest = await ReturnRequest.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: new mongoose.Types.ObjectId(orderId),
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        type: returnType,
        status: initialStatus,
        items: returnItems,
        refundBreakdown: breakdown,
        totalRefundAmount: breakdown.totalRefund,
        currency: order.currency,
        exchangeRate: order.exchangeRate,
        reason,
        adminNotes,
        requestedAt: new Date(),
        approvedAt: autoApprove ? new Date() : undefined,
        processedBy: new mongoose.Types.ObjectId(adminId),
        refund: {
            method: refundMethod || 'original',
            amount: breakdown.totalRefund,
            subtotal: breakdown.itemsSubtotal,
            tax: breakdown.itemsTax,
            shipping: breakdown.itemsShipping,
            status: 'pending',
        },
        statusHistory: [{ status: initialStatus, updatedAt: new Date() }],
    });

    order.status = 'return_requested';
    order.returnStatus = returnRequest.status;
    order.returnRequestId = returnRequest._id;
    await order.save();

    // Create admin dashboard notification
    try {
        await notificationService.createAdminNotification({
            type: returnType === 'return' ? 'return' : 'exchange',
            title: returnType === 'return' ? 'Return Created by Admin' : 'Exchange Created by Admin',
            message: `Admin created ${returnType} request #${returnRequest._id.toString().slice(-6)} for order ${order.orderNumber}`,
            data: {
                returnId: returnRequest._id.toString(),
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                type: returnType,
                amount: breakdown.totalRefund,
            },
        });

        // Trigger telegram notification
        await notificationService.triggerAdminNotifications(
            storeId,
            'returnRequest',
            {
                returnId: returnRequest._id.toString(),
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                customerName: order.shippingAddress?.firstName && order.shippingAddress?.lastName
                    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                    : 'Customer',
                type: returnType === 'return' ? 'Return (Admin)' : 'Exchange (Admin)',
                amount: breakdown.totalRefund,
                currency: order.currency,
                itemCount: returnItems.length,
            }
        );
    } catch (notificationError) {
        console.error('Failed to send admin notifications:', notificationError);
    }

    // Emit order event for 3rd party integrations
    emitOrderEvent(
        'orderRefundRequest',
        order,
        storeId,
        order._id.toString(),
        order.customerId?.toString()
    );

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
    if (storeId) query.storeId = new mongoose.Types.ObjectId(storeId);
    if (!isAdmin && userId) query.customerId = new mongoose.Types.ObjectId(userId);

    const returnRequest = await ReturnRequest.findOne(query)
        .populate('orderId', 'orderNumber total currency shippingAddress')
        .populate('customerId', 'firstName lastName email')
        .populate('statusHistory.updatedBy', 'firstName lastName')
        .populate('processedBy', 'firstName lastName');

    if (!returnRequest) throw new AppError('Return request not found', 404);

    // Mask sensitive bank details for non-admin users
    const returnData = returnRequest.toObject();
    if (!isAdmin && returnData.refund?.bankDetails) {
        const bankDetails = returnData.refund.bankDetails;
        returnData.refund.bankDetails = {
            ...bankDetails,
            accountHolderName: maskSensitiveData(bankDetails.accountHolderName),
            accountNumber: maskSensitiveData(bankDetails.accountNumber),
            bankName: maskSensitiveData(bankDetails.bankName),
            branchAddress: maskSensitiveData(bankDetails.branchAddress),
            routingNumber: maskSensitiveData(bankDetails.routingNumber),
            swiftBicCode: maskSensitiveData(bankDetails.swiftBicCode),
        };
    }

    res.status(200).json({ success: true, data: returnData });
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

    if (!customerId) throw new AppError('Authentication required', 401);

    const query: any = { customerId: new mongoose.Types.ObjectId(customerId) };
    if (storeId) query.storeId = new mongoose.Types.ObjectId(storeId);
    if (status) query.status = status;

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
    if (storeId) query.storeId = new mongoose.Types.ObjectId(storeId);
    if (status) query.status = status;
    if (type) query.type = type;
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
    if (!returnRequest) throw new AppError('Return request not found', 404);
    if (returnRequest.status !== 'pending') {
        throw new AppError('Only pending requests can be approved', 400);
    }

    returnRequest.status = 'approved';
    returnRequest.approvedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    addStatusHistory(returnRequest, 'approved');
    await returnRequest.save();

    await syncOrderStatus(returnRequest.orderId, 'approved');

    // Send notification
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

    // Emit order event for 3rd party integrations
    emitOrderEvent(
        'orderReturn',
        returnRequest.orderId as any,
        returnRequest.storeId.toString(),
        returnRequest.orderId.toString(),
        returnRequest.customerId?.toString()
    );

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
    if (!returnRequest) throw new AppError('Return request not found', 404);
    if (!['pending', 'approved'].includes(returnRequest.status)) {
        throw new AppError('This request cannot be rejected', 400);
    }

    returnRequest.status = 'rejected';
    returnRequest.rejectedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    returnRequest.adminNotes = adminNotes || reason || 'Request rejected by admin';
    addStatusHistory(returnRequest, 'rejected');
    await returnRequest.save();

    // Revert order status if needed
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
        order.returnStatus = 'rejected';
        if (['return_requested', 'exchange_requested'].includes(order.status)) {
            order.status = 'delivered';
        }
        await order.save();
    }

    // Send notification
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
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
    if (!returnRequest) throw new AppError('Return request not found', 404);
    if (!['approved', 'pickup_scheduled'].includes(returnRequest.status)) {
        throw new AppError('Only approved requests can have pickup scheduled', 400);
    }

    returnRequest.status = 'pickup_scheduled';
    const pickupDetails = {
        method: method || 'pickup',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledSlot,
        address,
        courierName,
        trackingNumber,
        trackingUrl,
        adminNotes,
    };
    returnRequest.pickup = pickupDetails;
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);

    // Add pickup details to history for customer tracking
    const pickupNote = `${method === 'dropoff' ? 'Drop-off' : 'Pickup'} scheduled${scheduledDate ? ` for ${new Date(scheduledDate).toLocaleDateString()}` : ''}${scheduledSlot ? ` ${scheduledSlot}` : ''}${courierName ? ` with ${courierName}` : ''} ${trackingNumber ? `(Tracking: ${trackingNumber})` : ''}`.trim();
    addStatusHistory(returnRequest, 'pickup_scheduled', {
        note: pickupNote,
        updatedBy: adminId,
        pickup: pickupDetails
    });
    await returnRequest.save();

    await syncOrderStatus(returnRequest.orderId, 'pickup_scheduled');

    // Send notification to customer
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

    res.status(200).json({
        success: true,
        message: 'Pickup scheduled',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/mark-received
 * @desc    Mark items as received and restore inventory
 * @access  Private (Admin)
 */
export const markReceived = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) throw new AppError('Return request not found', 404);

    returnRequest.status = 'received';
    if (returnRequest.pickup) {
        returnRequest.pickup.receivedAt = new Date();
    }
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    addStatusHistory(returnRequest, 'received');
    await returnRequest.save();

    await syncOrderStatus(returnRequest.orderId, 'received');

    // Restore inventory
    if (returnRequest.items?.length > 0) {
        try {
            await InventoryService.restoreStock(
                returnRequest.items.map((i: any) => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantity,
                }))
            );
        } catch (error) {
            console.error('Failed to restore inventory on return receipt:', error);
        }
    }

    // Send notification to customer
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

    res.status(200).json({
        success: true,
        message: 'Items marked as received',
        data: returnRequest,
    });
});

/**
 * @route   PATCH /api/returns/:id/process-refund
 * @desc    Process refund for return (with transparent breakdown)
 * @access  Private (Admin)
 */
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { transactionId, adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) throw new AppError('Return request not found', 404);
    if (returnRequest.type !== 'return') {
        throw new AppError('This is an exchange request, not a return', 400);
    }

    const order = await Order.findById(returnRequest.orderId);
    if (!order) throw new AppError('Order not found', 404);

    // Process refund via payment gateway if applicable
    let gatewayRefundResponse: any = null;

    if (
        returnRequest.refund?.method === 'original' &&
        order.paymentStatus === 'paid' &&
        order.paymentMethod &&
        ['razorpay', 'stripe', 'paypal'].includes(order.paymentMethod)
    ) {
        if (!order.paymentId) {
            throw new AppError('No payment ID found for this order. Cannot process refund.', 400);
        }

        try {
            const paymentService = await PaymentService.getGatewayInstance({
                storeId: order.storeId.toString(),
                gatewayType: order.paymentMethod,
            });

            // Apply exchange rate if needed
            const exchangeRate = returnRequest.exchangeRate || order.exchangeRate || 1;
            const refundAmountInGatewayCurrency = (returnRequest.refund?.amount || 0) * exchangeRate;
            const currency = returnRequest.currency || order.currency || 'USD';

            gatewayRefundResponse = await paymentService.processRefund({
                paymentId: order.paymentId,
                amount: refundAmountInGatewayCurrency,
                currency,
                reason: `Refund for returned order #${order.orderNumber}`,
            });

            if (gatewayRefundResponse.status !== 'success') {
                const errorMessage = gatewayRefundResponse.gatewayResponse?.message || 'Unknown error';
                throw new AppError(`Refund processing failed: ${errorMessage}`, 400);
            }
        } catch (error: any) {
            console.error('Payment gateway refund error:', error);
            throw new AppError(`Failed to process refund via ${order.paymentMethod}: ${error.message}`, 400);
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

    if (order.paymentStatus === 'paid') {
        order.paymentStatus = allReturned ? 'refunded' : 'partially_refunded';
        order.refundedAt = new Date();
    }

    if (gatewayRefundResponse?.refundId) {
        order.refundReferenceId = gatewayRefundResponse.refundId;
    }

    // Add to order returns history with full breakdown
    if (!order.returns) order.returns = [];
    order.returns.push({
        returnedAt: new Date(),
        items: returnRequest.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reason: item.reason,
            refundAmount: item.refundAmount || 0,
            subtotalRefund: item.subtotalRefund || 0,
            taxRefund: item.taxRefund || 0,
            shippingRefund: item.shippingRefund || 0,
        })),
        totalRefundAmount: returnRequest.refund?.amount || 0,
        refundBreakdown: returnRequest.refundBreakdown,
        refundMethod: returnRequest.refund?.method || 'original',
        processedBy: new mongoose.Types.ObjectId(adminId as string),
        refundReference: gatewayRefundResponse?.refundId || transactionId,
        note: adminNotes,
    });

    await order.save();

    // Sync accounting
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
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    addStatusHistory(returnRequest, 'refund_completed');
    await returnRequest.save();

    // Send notification
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

    // Emit order event for 3rd party integrations
    emitOrderEvent(
        'orderRefund',
        order,
        order.storeId.toString(),
        order._id.toString(),
        order.customerId?.toString()
    );

    res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
            returnRequest,
            refundBreakdown: returnRequest.refundBreakdown,
            gatewayRefund: gatewayRefundResponse ? {
                refundId: gatewayRefundResponse.refundId,
                status: gatewayRefundResponse.status,
            } : null,
        },
    });
});

/**
 * @route   PATCH /api/returns/:id/ship-exchange
 * @desc    Ship exchange order
 * @access  Private (Admin)
 */
export const shipExchange = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newOrderId, newOrderNumber, adminNotes } = req.body;
    const adminId = req.user?.id;

    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) throw new AppError('Return request not found', 404);
    if (returnRequest.type !== 'exchange') {
        throw new AppError('This is a return request, not an exchange', 400);
    }

    if (!returnRequest.exchange) returnRequest.exchange = {};
    returnRequest.exchange.newOrderId = newOrderId ? new mongoose.Types.ObjectId(newOrderId) : undefined;
    returnRequest.exchange.newOrderNumber = newOrderNumber;

    returnRequest.status = 'exchange_shipped';
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    addStatusHistory(returnRequest, 'exchange_shipped');
    await returnRequest.save();

    await syncOrderStatus(returnRequest.orderId, 'exchange_shipped');

    // Send notification
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

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
    if (!returnRequest) throw new AppError('Return request not found', 404);

    returnRequest.status = 'completed';
    returnRequest.completedAt = new Date();
    returnRequest.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    addStatusHistory(returnRequest, 'completed');
    await returnRequest.save();

    await syncOrderStatus(returnRequest.orderId, 'completed');

    // Send notification to customer
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

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
    if (!returnRequest) throw new AppError('Return request not found', 404);

    // Customers can only cancel their own pending/approved requests
    if (!isAdmin) {
        if (returnRequest.customerId?.toString() !== userId) {
            throw new AppError('You can only cancel your own requests', 403);
        }
        if (!['pending', 'approved'].includes(returnRequest.status)) {
            throw new AppError('You can only cancel pending or approved requests', 400);
        }
    }

    returnRequest.status = 'cancelled';
    returnRequest.adminNotes = reason || `Cancelled by ${isAdmin ? 'admin' : 'customer'}`;
    returnRequest.processedBy = new mongoose.Types.ObjectId(userId);
    addStatusHistory(returnRequest, 'cancelled');
    await returnRequest.save();

    // Revert order status
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
        (order as any).returnStatus = 'cancelled';
        if (['return_requested', 'exchange_requested'].includes(order.status)) {
            order.status = 'delivered';
        }
        await order.save();
    }

    // Send notification
    const fullRequest = await ReturnRequest.findById(id).populate('customerId').populate('orderId');
    if (fullRequest?.customerId) {
        const store = await Store.findById(fullRequest.storeId);
        await sendReturnNotification(fullRequest, fullRequest.orderId, store, 'status_update');
    }

    res.status(200).json({
        success: true,
        message: 'Return request cancelled',
        data: returnRequest,
    });
});
