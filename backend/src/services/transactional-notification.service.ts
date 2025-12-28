import { notificationService } from './notification.service';
import Store from '../models/Store';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export interface NotificationPayload {
    storeId: string;
    storeName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientName: string;
    type: string;
    templateData: Record<string, any>;
    subject?: string;
    orderId?: string;
}

/**
 * Unified Transactional Notification Service
 * Handles Email, SMS, and WhatsApp notifications for business events.
 */
export class TransactionalNotificationService {
    /**
     * Send notification across all enabled channels
     */
    private async notify(payload: NotificationPayload): Promise<void> {
        const { storeId, storeName, recipientEmail, recipientPhone, recipientName, type, templateData, subject, orderId } = payload;

        try {
            // Fetch store settings to check enabled channels
            const store = await Store.findById(storeId);
            if (!store) {
                return;
            }

            const emailEnabled = store.settings?.emailNotifications !== false && !!store.settings?.emailSettings?.provider;
            const smsEnabled = store.settings?.smsNotifications && store.settings?.smsSettings?.enabled;
            const whatsappEnabled = store.settings?.whatsappNotifications && store.settings?.whatsappSettings?.enabled;

            // 1. Email Notification
            if (emailEnabled && recipientEmail) {
                await notificationService.queueNotification({
                    storeId,
                    channel: 'email',
                    priority: type === 'welcome' ? 'normal' : 'high',
                    type,
                    recipient: recipientEmail,
                    recipientName,
                    subject: subject || `${storeName} - Notification`,
                    templateData: {
                        ...templateData,
                        storeName: store.name || storeName,
                    },
                    orderId,
                });
            }

            // 2. SMS Notification
            if (smsEnabled && recipientPhone) {
                await notificationService.queueNotification({
                    storeId,
                    channel: 'sms',
                    priority: type === 'welcome' ? 'normal' : 'high', // Retained priority from original
                    type,
                    recipient: recipientPhone,
                    recipientName,
                    templateData: {
                        ...templateData,
                        storeName: store.name || storeName,
                    },
                    orderId,
                });
            }

            // 3. WhatsApp Notification
            if (whatsappEnabled && recipientPhone) {
                await notificationService.queueNotification({
                    storeId,
                    channel: 'whatsapp',
                    priority: type === 'welcome' ? 'normal' : 'high', // Retained priority from original
                    type,
                    recipient: recipientPhone,
                    recipientName,
                    templateData: {
                        ...templateData,
                        storeName: store.name || storeName,
                    },
                    orderId,
                });
            }
        } catch (error) {
            // Log the error but don't rethrow, as queuing failures shouldn't block main process
        }
    }

    /**
     * Specific helper for welcome notification
     */
    async sendWelcome(storeId: string, storeName: string, email: string, firstName: string, phone?: string) {
        await this.notify({
            storeId,
            storeName,
            recipientEmail: email,
            recipientPhone: phone,
            recipientName: firstName,
            type: 'welcome',
            subject: `Welcome to ${storeName}!`,
            templateData: {
                firstName,
                loginUrl: `${frontendUrl}/login`,
            }
        });
    }

    /**
     * Specific helper for password reset
     */
    async sendPasswordReset(storeId: string, storeName: string, email: string, firstName: string, resetToken: string, phone?: string) {
        await this.notify({
            storeId,
            storeName,
            recipientEmail: email,
            recipientPhone: phone,
            recipientName: firstName,
            type: 'password_reset',
            subject: 'Reset your password',
            templateData: {
                firstName,
                resetUrl: `${frontendUrl}/reset-password?token=${resetToken}`,
            }
        });
    }

    /**
     * Specific helper for email verification
     */
    async sendEmailVerification(storeId: string, storeName: string, email: string, firstName: string, verificationToken: string, phone?: string) {
        await this.notify({
            storeId,
            storeName,
            recipientEmail: email,
            recipientPhone: phone,
            recipientName: firstName,
            type: 'verify_email',
            subject: 'Verify your email address',
            templateData: {
                firstName,
                verifyUrl: `${frontendUrl}/verify-email?token=${verificationToken}`,
            }
        });
    }

    /**
     * Specific helper for order status update
     */
    async sendOrderStatusUpdate(storeId: string, storeName: string, order: any, status: string) {
        const type = `order_${status.toLowerCase()}`;

        // Extract recipient info robustly
        let recipientEmail = order.guestEmail;
        let recipientPhone = order.shippingAddress?.phone;
        let recipientName = order.shippingAddress ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'Customer';

        // Fix for guest email potentially being in shippingAddress if not at top level
        if (!recipientEmail && (order.shippingAddress as any).email) {
            recipientEmail = (order.shippingAddress as any).email;
        }

        // If it's a registered customer and we don't have enough info from shippingAddress or guestEmail
        if (order.customerId && (!recipientEmail || !recipientPhone)) {
            let customer = order.customerId;

            // If customerId is an object (already populated)
            if (typeof customer === 'object' && customer.email) {
                recipientEmail = recipientEmail || customer.email;
                recipientPhone = recipientPhone || customer.phone;
                recipientName = recipientName !== 'Customer' ? recipientName : `${customer.firstName} ${customer.lastName}`;
            }
            // If customerId is just an ID (not populated, though it should be), fetch it
            else if (typeof customer === 'string' || (customer && customer._id)) {
                const Customer = (await import('../models/Customer')).default;
                const customerIdValue = typeof customer === 'string' ? customer : customer._id;
                const customerDoc = await Customer.findById(customerIdValue).lean() as any;

                if (customerDoc) {
                    recipientEmail = recipientEmail || customerDoc.email;
                    recipientPhone = recipientPhone || customerDoc.phone;
                    recipientName = recipientName !== 'Customer' ? recipientName : `${customerDoc.firstName} ${customerDoc.lastName}`;
                }
            }
        }

        await this.notify({
            storeId,
            storeName,
            recipientEmail,
            recipientPhone,
            recipientName,
            type,
            orderId: order._id,
            subject: `Order ${status} - ${order.orderNumber}`,
            templateData: {
                orderNumber: order.orderNumber,
                firstName: order.shippingAddress?.firstName || recipientName.split(' ')[0],
                total: `${order.currency} ${order.total}`,
                status,
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingNumber ? `/orders/${order._id}/track` : undefined,
            }
        });
    }
}

export const transactionalNotificationService = new TransactionalNotificationService();
