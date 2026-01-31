import { Request, Response } from 'express';
import Order from '../models/Order';
import Coupon from '../models/Coupon';
import { asyncHandler, AppError } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';
import InventoryService from '../services/inventory.service';
import { transactionalNotificationService } from '../services/transactional-notification.service';
import Store from '../models/Store';
import { AccountingService } from '../services/accounting.service';

/**
 * @route   POST /api/webhooks/razorpay
 * @desc    Handle Razorpay webhook
 * @access  Public (verified by signature)
 */
export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    // Extract store ID from order metadata (you'll need to include this when creating order)
    // IMPORTANT: Razorpay/PaymentService puts MongoID in 'orderId' and readable ID in 'orderNumber'
    const notes = payload.payload?.payment?.entity?.notes || {};
    const orderNumber = notes.orderNumber;
    const orderMongoId = notes.orderId;
    const razorpayOrderId = payload.payload?.payment?.entity?.order_id;

    let order;

    // 1. Try finding by readable order ID (best match)
    if (orderNumber) {
        order = await Order.findOne({ orderNumber: orderNumber });
    }

    // 2. Try finding by Mongo ID if provided (and valid MongoID format)
    if (!order && orderMongoId && orderMongoId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderMongoId);
    }

    // 3. Fallback: If no ID found in notes, try finding by Razorpay Order ID (stored in paymentId for pending orders)
    if (!order && razorpayOrderId) {
        order = await Order.findOne({ paymentId: razorpayOrderId });
    }

    if (!order) {
        console.error('Webhook Error: Order not found for payload:', JSON.stringify(payload, null, 2));
        throw new AppError('Order not found', 404);
    }

    // Get gateway config for webhook secret
    const config = await PaymentService.getGatewayConfig({
        storeId: order.storeId.toString(),
        gatewayType: 'razorpay',
    });

    // Get gateway instance and verify webhook
    const gateway = await PaymentService.getGatewayInstance({
        storeId: order.storeId.toString(),
        gatewayType: 'razorpay',
    });

    const verification = await gateway.verifyWebhook({
        signature,
        payload,
        webhookSecret: config.credentials.webhookSecret,
    });

    if (!verification.isValid) {
        throw new AppError('Invalid webhook signature', 401);
    }
    // Process webhook based on event
    if (verification.status === 'success') {
        await processSuccessfulPayment(order, verification.paymentId!, verification.data);
    } else if (verification.status === 'failed') {
        await processFailedPayment(order, verification.data);
    }

    res.json({ success: true, message: 'Webhook processed' });
});

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook
 * @access  Public (verified by signature)
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    // Extract order ID from metadata
    const metadata = payload.data?.object?.metadata || {};
    const orderNumber = metadata.orderNumber;
    const orderMongoId = metadata.orderId;

    let order;

    // 1. Try finding by readable order ID (best match)
    if (orderNumber) {
        order = await Order.findOne({ orderNumber: orderNumber });
    }

    // 2. Try finding by Mongo ID if provided
    if (!order && orderMongoId && orderMongoId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderMongoId);
    }

    if (!order) {
        console.error('Webhook Error: Order not found for payload:', JSON.stringify(payload, null, 2));
        throw new AppError('Order not found', 404);
    }

    // Get gateway config
    const config = await PaymentService.getGatewayConfig({
        storeId: order.storeId.toString(),
        gatewayType: 'stripe',
    });

    // Get gateway instance and verify webhook
    const gateway = await PaymentService.getGatewayInstance({
        storeId: order.storeId.toString(),
        gatewayType: 'stripe',
    });

    const verification = await gateway.verifyWebhook({
        signature,
        payload: JSON.stringify(payload),
        webhookSecret: config.credentials.webhookSecret,
    });

    if (!verification.isValid) {
        throw new AppError('Invalid webhook signature', 401);
    }

    // Process webhook based on event
    if (verification.status === 'success') {
        await processSuccessfulPayment(order, verification.paymentId!, verification.data);
    } else if (verification.status === 'failed') {
        await processFailedPayment(order, verification.data);
    }

    res.json({ success: true, message: 'Webhook processed' });
});

/**
 * @route   POST /api/webhooks/paypal
 * @desc    Handle PayPal webhook
 * @access  Public (verified by signature)
 */
export const handlePayPalWebhook = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    // Extract order ID
    const orderId = payload.resource?.custom_id || payload.resource?.purchase_units?.[0]?.reference_id;

    if (!orderId) {
        throw new AppError('Order ID not found in webhook payload', 400);
    }

    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Get gateway instance
    const gateway = await PaymentService.getGatewayInstance({
        storeId: order.storeId.toString(),
        gatewayType: 'paypal',
    });

    // Verify webhook (PayPal verification is simplified here)
    const verification = await gateway.verifyWebhook({
        signature: '',
        payload,
        webhookSecret: '',
    });

    // Process webhook based on event
    if (verification.status === 'success') {
        await processSuccessfulPayment(order, verification.paymentId!, verification.data);
    } else if (verification.status === 'failed') {
        await processFailedPayment(order, verification.data);
    }

    res.json({ success: true, message: 'Webhook processed' });
});

/**
 * Process successful payment
 * 
 * NOTE: For Stripe, the successful PaymentIntent ID is already stored by handlePaymentSuccess
 * when the frontend confirms payment. This webhook is a backup confirmation/notification.
 * We verify the payment is in the database before processing stock/notifications.
 */
async function processSuccessfulPayment(order: any, paymentId: string, paymentData: any) {
    // Check if already processed
    if (order.paymentStatus === 'paid') {
        console.log(`✅ Webhook: Order ${order.orderNumber} already processed (paymentStatus = paid)`);
        return;
    }

    // For Stripe: Verify the PaymentIntent stored in database matches and is succeeded
    if (order.paymentMethod === 'stripe') {
        if (order.paymentId !== paymentId) {
            console.warn(`⚠️ Webhook PaymentIntent ${paymentId} differs from stored ${order.paymentId} for order ${order.orderNumber}`);
            // If webhook has a different (newer) successful intent, update it
            if (!order.paymentId || order.paymentId.startsWith('pi_')) {
                console.log(`📝 Updating stored PaymentIntent from webhook data`);
                order.paymentId = paymentId;
            }
        } else {
            console.log(`✅ Webhook: PaymentIntent ${paymentId} matches stored payment for order ${order.orderNumber}`);
        }
    }

    // Update order if not already paid
    order.paymentStatus = 'paid';
    order.status = 'processing';
    
    // Only update paymentId if not already set (for other gateways or backup for Stripe)
    if (!order.paymentId) {
        order.paymentId = paymentId;
    }
    
    order.paymentDetails = {
        ...order.paymentDetails,
        webhookData: paymentData,
        paidAt: new Date(),
    };

    // If POS Order with QR details, update that too
    if (order.posPaymentDetails?.qrDetails?.gatewayDetails) {
        order.posPaymentDetails.qrDetails.gatewayDetails.status = 'completed';
        order.posPaymentDetails.qrDetails.gatewayDetails.gatewayPaymentId = paymentId;
    }

    await order.save();

    // Reduce product stock
    await InventoryService.reduceStock(order.items);

    // Increment coupon usage if coupon was used
    const couponId = order.paymentDetails?.couponId || order.couponId;
    if (couponId) {
        const coupon = await Coupon.findById(couponId);
        if (coupon) {
            const customerId = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
            await coupon.incrementUsage(customerId || order.guestEmail || '');
        }
    }

    // Send order confirmation email
    try {
        const store = await Store.findById(order.storeId);
        if (store) {
            await transactionalNotificationService.sendOrderStatusUpdate(
                order.storeId.toString(),
                store.name,
                order,
                'processing'
            );
        }
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
    }

    // Create accounting record for the order
    try {
        await AccountingService.createAccountingRecord(order._id.toString());
        console.log(`Accounting record created for order ${order.orderNumber}`);
    } catch (error) {
        console.error('Failed to create accounting record:', error);
    }

}

/**
 * Process failed payment
 */
async function processFailedPayment(order: any, paymentData: any) {
    order.paymentStatus = 'failed';
    order.paymentDetails = {
        ...order.paymentDetails,
        webhookData: paymentData,
        failedAt: new Date(),
    };

    await order.save();

    // Send payment failed email
    try {
        const store = await Store.findById(order.storeId);
        if (store) {
            await transactionalNotificationService.sendOrderStatusUpdate(
                order.storeId.toString(),
                store.name,
                order,
                'failed'
            );
        }
    } catch (error) {
        console.error('Failed to send payment failed email:', error);
    }

}
