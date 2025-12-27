/**
 * Notification Queue Wrapper for Checkout
 * Uses the existing notification service instead of Bull
 */

import { notificationService } from './notification.service';

export interface OrderNotificationData {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    total: number;
    currency: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        address1: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
}

/**
 * Queue order confirmation notifications
 */
export async function queueOrderConfirmation(
    data: OrderNotificationData & { storeId?: string },
    channels: {
        email?: boolean;
        sms?: boolean;
        whatsapp?: boolean;
    }
) {
    try {
        const storeId = data.storeId || data.orderId; // Fallback to orderId if storeId not provided

        // Email notification
        if (channels.email && data.customerEmail) {
            await notificationService.queueNotification({
                storeId,
                channel: 'email',
                priority: 'high',
                type: 'order_confirmed',
                recipient: data.customerEmail,
                recipientName: data.customerName,
                subject: `Order Confirmation - ${data.orderNumber}`,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    total: data.total,
                    currency: data.currency,
                    items: data.items,
                    shippingAddress: data.shippingAddress,
                },
                orderId: data.orderId,
            });
            console.log(`[Email] Queued order confirmation to ${data.customerEmail}`);
        }

        // SMS notification
        if (channels.sms && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'sms',
                priority: 'high',
                type: 'order_confirmed',
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    total: data.total,
                    currency: data.currency,
                },
                orderId: data.orderId,
            });
            console.log(`[SMS] Queued order confirmation to ${data.customerPhone}`);
        }

        // WhatsApp notification
        if (channels.whatsapp && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'whatsapp',
                priority: 'high',
                type: 'order_confirmed',
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    total: data.total,
                    currency: data.currency,
                    items: data.items,
                },
                orderId: data.orderId,
            });
            console.log(`[WhatsApp] Queued order confirmation to ${data.customerPhone}`);
        }
    } catch (error) {
        console.error('Error queuing order confirmation:', error);
        // Don't throw - notifications are not critical
    }
}

/**
 * Queue order status update notifications
 */
export async function queueOrderStatusUpdate(
    data: OrderNotificationData & { status: string; storeId?: string },
    channels: {
        email?: boolean;
        sms?: boolean;
        whatsapp?: boolean;
    }
) {
    try {
        const storeId = data.storeId || data.orderId;

        if (channels.email && data.customerEmail) {
            await notificationService.queueNotification({
                storeId,
                channel: 'email',
                priority: 'normal',
                type: 'order_' + data.status.toLowerCase(),
                recipient: data.customerEmail,
                recipientName: data.customerName,
                subject: `Order ${data.status} - ${data.orderNumber}`,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    status: data.status,
                },
                orderId: data.orderId,
            });
        }

        if (channels.sms && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'sms',
                priority: 'normal',
                type: 'order_' + data.status.toLowerCase(),
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    status: data.status,
                },
                orderId: data.orderId,
            });
        }

        if (channels.whatsapp && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'whatsapp',
                priority: 'normal',
                type: 'order_' + data.status.toLowerCase(),
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    status: data.status,
                },
                orderId: data.orderId,
            });
        }
    } catch (error) {
        console.error('Error queuing status update:', error);
    }
}

/**
 * Queue shipping notification
 */
export async function queueShippingNotification(
    data: OrderNotificationData & { trackingNumber: string; carrier: string; storeId?: string },
    channels: {
        email?: boolean;
        sms?: boolean;
        whatsapp?: boolean;
    }
) {
    try {
        const storeId = data.storeId || data.orderId;

        if (channels.email && data.customerEmail) {
            await notificationService.queueNotification({
                storeId,
                channel: 'email',
                priority: 'normal',
                type: 'order_shipped',
                recipient: data.customerEmail,
                recipientName: data.customerName,
                subject: `Your Order Has Shipped - ${data.orderNumber}`,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    trackingNumber: data.trackingNumber,
                    carrier: data.carrier,
                },
                orderId: data.orderId,
            });
        }

        if (channels.sms && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'sms',
                priority: 'normal',
                type: 'order_shipped',
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    trackingNumber: data.trackingNumber,
                },
                orderId: data.orderId,
            });
        }

        if (channels.whatsapp && data.customerPhone) {
            await notificationService.queueNotification({
                storeId,
                channel: 'whatsapp',
                priority: 'normal',
                type: 'order_shipped',
                recipient: data.customerPhone,
                recipientName: data.customerName,
                templateData: {
                    orderNumber: data.orderNumber,
                    customerName: data.customerName,
                    trackingNumber: data.trackingNumber,
                    carrier: data.carrier,
                },
                orderId: data.orderId,
            });
        }
    } catch (error) {
        console.error('Error queuing shipping notification:', error);
    }
}
