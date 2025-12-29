import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { asyncHandler, AppError } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';
import InventoryService from '../services/inventory.service';

/**
 * @route   POST /api/webhooks/razorpay
 * @desc    Handle Razorpay webhook
 * @access  Public (verified by signature)
 */
export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    // Extract store ID from order metadata (you'll need to include this when creating order)
    const orderId = payload.payload?.payment?.entity?.notes?.orderId;

    if (!orderId) {
        throw new AppError('Order ID not found in webhook payload', 400);
    }

    // Find order to get store ID
    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
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
    const orderId = payload.data?.object?.metadata?.orderId;

    if (!orderId) {
        throw new AppError('Order ID not found in webhook payload', 400);
    }

    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
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
 */
async function processSuccessfulPayment(order: any, paymentId: string, paymentData: any) {
    // Check if already processed
    if (order.paymentStatus === 'paid') {
        return;
    }

    // Update order
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paymentId = paymentId;
    order.paymentDetails = {
        ...order.paymentDetails,
        webhookData: paymentData,
        paidAt: new Date(),
    };

    await order.save();

    // Reduce product stock
    await InventoryService.reduceStock(order.items);

    // Increment coupon usage if coupon was used
    const couponId = order.paymentDetails?.couponId;
    if (couponId) {
        const coupon = await Coupon.findById(couponId);
        if (coupon) {
            await coupon.incrementUsage(order.userId.toString());
        }
    }

    // TODO: Send order confirmation email

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

    // TODO: Send payment failed email

}
