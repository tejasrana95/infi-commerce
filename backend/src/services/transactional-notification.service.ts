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
            console.error('Failed to queue notification:', error);
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

        // Trigger admin notification
        try {
            await notificationService.triggerAdminNotifications(storeId, 'newCustomer', { email, firstName, phone });
        } catch (error) {
            console.error('Failed to trigger admin welcome notification:', error);
        }
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
        const store = await Store.findById(storeId);
        if (!store || store.settings?.orderNotifications === false) {
            return;
        }

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
                total: `${order.currency} ${(order.total * (order.exchangeRate || 1)).toFixed(2)}`,
                status,
                orderUrl: `${frontendUrl}/orders/${order._id}`,
                order_items_table: await this.renderOrderItemsTable(order, storeId),
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingUrl || (order.trackingNumber ? `https://${(await Store.findById(storeId).select('domains').lean())?.domains?.[0]}/orders/${order._id}/track` : undefined),
                gmailMarkup: this.generateGmailMarkup(order, status, store.name || storeName),
            }
        });

        // Trigger admin notifications
        try {
            let adminEvent: 'newOrder' | 'orderStatus' | 'orderCancel' | 'returnRequest' | undefined;
            if (status === 'created') adminEvent = 'newOrder';
            else if (status === 'cancelled') adminEvent = 'orderCancel';
            else if (status === 'return_requested') adminEvent = 'returnRequest';
            else adminEvent = 'orderStatus';

            if (adminEvent) {
                await notificationService.triggerAdminNotifications(storeId, adminEvent, {
                    orderNumber: order.orderNumber,
                    customerName: recipientName,
                    total: `${order.currency} ${(order.total * (order.exchangeRate || 1)).toFixed(2)}`,
                    status,
                    orderId: order._id,
                    order_items_table: await this.renderOrderItemsTable(order, storeId)
                });
            }
        } catch (error) {
            console.error('Failed to trigger admin order notification:', error);
        }
    }

    /**
     * Send notification for new return request
     */
    async sendReturnRequestCreated(storeId: string, storeName: string, returnRequest: any, customer: any) {
        const type = 'return_created';

        // Determine recipient
        const recipientEmail = customer.email;
        const recipientName = `${customer.firstName} ${customer.lastName}`;
        const recipientPhone = customer.phone;

        await this.notify({
            storeId,
            storeName,
            recipientEmail,
            recipientPhone,
            recipientName,
            type,
            orderId: returnRequest.orderId,
            subject: `Return Request Received - ${returnRequest.requestNumber || returnRequest._id}`,
            templateData: {
                requestNumber: returnRequest.requestNumber || returnRequest._id,
                orderNumber: returnRequest.orderNumber,
                recipientName,
                returnItems: await this.renderReturnItemsTable(returnRequest, storeId),
                reason: returnRequest.reason,
                status: returnRequest.status,
                type: returnRequest.type // return or exchange
            }
        });

        // Trigger admin notification
        try {
            await notificationService.triggerAdminNotifications(storeId, 'returnRequest', {
                requestNumber: returnRequest.requestNumber || returnRequest._id,
                orderNumber: returnRequest.orderNumber,
                customerName: recipientName,
                amount: returnRequest.refund ? returnRequest.refund.amount : 0,
                type: returnRequest.type,
                reason: returnRequest.reason,
                items_table: await this.renderReturnItemsTable(returnRequest, storeId)
            });
        } catch (error) {
            console.error('Failed to trigger admin return notification:', error);
        }
    }

    /**
     * Send notification for return status update
     */
    async sendReturnStatusUpdate(storeId: string, storeName: string, returnRequest: any, customer: any) {
        const status = returnRequest.status;
        const type = `return_${status}`;

        // Determine recipient
        const recipientEmail = customer.email;
        const recipientName = `${customer.firstName} ${customer.lastName}`;
        const recipientPhone = customer.phone;

        await this.notify({
            storeId,
            storeName,
            recipientEmail,
            recipientPhone,
            recipientName,
            type,
            orderId: returnRequest.orderId,
            subject: `Return Request ${status.replace(/_/g, ' ').toUpperCase()} - ${returnRequest.requestNumber || returnRequest._id}`,
            templateData: {
                requestNumber: returnRequest.requestNumber || returnRequest._id,
                orderNumber: returnRequest.orderNumber,
                recipientName,
                status: status.replace(/_/g, ' '),
                adminNote: returnRequest.adminNote,
                returnItems: await this.renderReturnItemsTable(returnRequest, storeId),
            }
        });
    }

    /**
     * Helper to render return items table
     */
    private async renderReturnItemsTable(returnRequest: any, _storeId: string): Promise<string> {
        let itemsHtml = '';
        for (const item of returnRequest.items) {
            itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 10px; vertical-align: top;">
                    <div style="font-weight: 600; color: #333;">${item.name}</div>
                    ${item.sku ? `<div style="font-size: 11px; color: #999; margin-top: 2px;">SKU: ${item.sku}</div>` : ''}
                </td>
                <td style="padding: 12px 10px; text-align: right; vertical-align: top; color: #666;">${item.quantity}</td>
                <td style="padding: 12px 10px; text-align: right; vertical-align: top; color: #666;">${item.reason}</td>
            </tr>`;
        }

        return `
        <div style="margin: 24px 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5;">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e0e0e0; text-align: left;">
                        <th style="padding: 12px 10px; font-weight: 700; color: #333;">Product</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #333;">Qty</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #333;">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        `;
    }
    private async renderOrderItemsTable(order: any, _storeId: string): Promise<string> {
        let fullOrder = order;

        // Ensure we have items and pricing details
        if (!order.items || order.items.length === 0 || order.subtotal === undefined) {
            try {
                const OrderModel = (await import('../models/Order')).default;
                const fetchedOrder = await OrderModel.findById(order._id || order.id).lean();
                if (fetchedOrder) {
                    fullOrder = fetchedOrder;
                }
            } catch (error) {
                console.error('Failed to fetch full order for email table:', error);
            }
        }

        const currency = fullOrder.currency || 'USD';
        const rate = fullOrder.exchangeRate || 1;
        const format = (amt: number) => {
            if (amt === undefined || amt === null) return `${currency} 0.00`;
            return `${currency} ${(amt * rate).toFixed(2)}`;
        };

        let itemsHtml = '';
        const items = fullOrder.items || [];

        for (const item of items) {
            let attrHtml = '';
            if (item.attributes && typeof item.attributes === 'object') {
                const entries = Object.entries(item.attributes);
                if (entries.length > 0) {
                    attrHtml = `<div style="font-size: 12px; color: #666; margin-top: 4px;">` +
                        entries.map(([k, v]) => `<span style="margin-right: 8px;"><strong>${k}:</strong> ${v}</span>`).join(' ') +
                        `</div>`;
                }
            }

            itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 10px; vertical-align: top;">
                    <div style="font-weight: 600; color: #333;">${item.name}</div>
                    ${item.sku ? `<div style="font-size: 11px; color: #999; margin-top: 2px;">SKU: ${item.sku}</div>` : ''}
                    ${attrHtml}
                </td>
                <td style="padding: 12px 10px; text-align: right; vertical-align: top; color: #666;">${item.quantity}</td>
                <td style="padding: 12px 10px; text-align: right; vertical-align: top; color: #666;">${format(item.price)}</td>
                <td style="padding: 12px 10px; text-align: right; vertical-align: top; font-weight: 600; color: #333;">${format(item.price * item.quantity)}</td>
            </tr>
            `;
        }

        const summaryRow = (label: string, value: string, bold = false, isDiscount = false) => `
        <tr>
            <td colspan="3" style="padding: 6px 10px; text-align: right; color: ${bold ? '#333' : '#666'}; ${bold ? 'font-weight: 700;' : ''}">${label}</td>
            <td style="padding: 6px 10px; text-align: right; ${bold ? 'font-weight: 700; color: #000;' : `color: ${isDiscount ? '#d32f2f' : '#333'};`}${bold ? 'border-top: 1px solid #ddd;' : ''}">${value}</td>
        </tr>
        `;

        let summaryHtml = '';
        summaryHtml += summaryRow('Subtotal', format(fullOrder.subtotal || 0));

        if (fullOrder.shippingCost > 0) {
            summaryHtml += summaryRow('Shipping', format(fullOrder.shippingCost));
        }

        if (fullOrder.tax > 0) {
            summaryHtml += summaryRow('Tax', format(fullOrder.tax));
        }

        if (fullOrder.discount > 0) {
            const promoText = fullOrder.couponCode ? ` (Promo: ${fullOrder.couponCode})` : '';
            summaryHtml += summaryRow(`Discount${promoText}`, `-${format(fullOrder.discount)}`, false, true);
        }

        summaryHtml += `<tr><td colspan="4" style="height: 10px;"></td></tr>`;
        summaryHtml += summaryRow('Total', format(fullOrder.total || 0), true);

        return `
        <div style="margin: 24px 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5;">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e0e0e0; text-align: left;">
                        <th style="padding: 12px 10px; font-weight: 700; color: #333;">Product</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #333;">Qty</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #333;">Price</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #333;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot style="background-color: #fcfcfc; border-top: 1px solid #e0e0e0;">
                    ${summaryHtml}
                </tfoot>
            </table>
        </div>
        `;
    }

    /**
     * Generate Gmail JSON-LD Markup for order/shipment cards
     */
    private generateGmailMarkup(order: any, status: string, storeName: string): string {
        try {
            const orderNumber = order.orderNumber;
            const orderUrl = `${frontendUrl}/orders/${order._id}`;
            const sellerName = storeName;

            let schema: any = {
                "@context": "http://schema.org",
            };

            if (status === 'shipped') {
                schema["@type"] = "ParcelDelivery";
                schema["deliveryAddress"] = {
                    "@type": "PostalAddress",
                    "name": `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                    "streetAddress": order.shippingAddress.address1,
                    "addressLocality": order.shippingAddress.city,
                    "addressRegion": order.shippingAddress.state,
                    "addressCountry": order.shippingAddress.country,
                    "postalCode": order.shippingAddress.postalCode
                };
                schema["partOfOrder"] = {
                    "@type": "Order",
                    "orderNumber": orderNumber,
                    "merchant": {
                        "@type": "Organization",
                        "name": sellerName
                    }
                };
                if (order.trackingNumber) {
                    schema["trackingNumber"] = order.trackingNumber;
                    if (order.trackingUrl) {
                        schema["trackingUrl"] = order.trackingUrl;
                    }
                }
                if (order.courierName) {
                    schema["carrier"] = order.courierName;
                }
                // Default expected arrival to 7 days if not provided
                schema["expectedArrivalUntil"] = order.estimatedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            } else {
                schema["@type"] = "Order";
                schema["merchant"] = {
                    "@type": "Organization",
                    "name": sellerName
                };
                schema["orderNumber"] = orderNumber;
                schema["priceCurrency"] = order.currency;
                schema["price"] = order.total.toFixed(2);

                if (order.items && order.items.length > 0) {
                    schema["acceptedOffer"] = order.items.map((item: any) => ({
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Product",
                            "name": item.name,
                            "sku": item.sku,
                            "image": item.image
                        },
                        "price": item.price.toFixed(2),
                        "priceCurrency": order.currency,
                        "eligibleQuantity": {
                            "@type": "QuantitativeValue",
                            "value": item.quantity
                        }
                    }));
                }

                schema["url"] = orderUrl;

                // Map status to Schema.org order status
                const statusMap: Record<string, string> = {
                    created: 'OrderProcessing',
                    pending: 'OrderProcessing',
                    processing: 'OrderProcessing',
                    shipped: 'OrderInTransit',
                    delivered: 'OrderDelivered',
                    cancelled: 'OrderCancelled',
                    refunded: 'OrderCancelled'
                };
                const schemaStatus = statusMap[status.toLowerCase()] || 'OrderProcessing';
                schema["orderStatus"] = `http://schema.org/${schemaStatus}`;
            }

            const markup = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
            console.log(`[GmailMarkup] Generated for order ${orderNumber} (status: ${status})`);
            // console.log(`[GmailMarkup] Content:`, markup); // Optional: very verbose
            return markup;
        } catch (error) {
            console.error('Failed to generate Gmail markup:', error);
            return '';
        }
    }
}

export const transactionalNotificationService = new TransactionalNotificationService();
