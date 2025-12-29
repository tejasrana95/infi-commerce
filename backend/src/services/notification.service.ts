import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import NotificationQueue, { INotificationQueue, NotificationChannel, NotificationPriority, NotificationType } from '../models/NotificationQueue';
import NotificationTemplate, { INotificationTemplate } from '../models/NotificationTemplate';
import Store from '../models/Store';
import Handlebars from 'handlebars';

// ============================================
// Email Provider Types
// ============================================

export type EmailProvider = 'smtp' | 'ses' | 'sendgrid' | 'mailjet';

export interface SMTPSettings {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
}

export interface SESSettings {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface SendGridSettings {
    apiKey: string;
}

export interface MailjetSettings {
    apiKey: string;
    secretKey: string;
}

export interface EmailSettings {
    provider: EmailProvider;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
    rateLimit: number;  // per minute
    smtp?: SMTPSettings;
    ses?: SESSettings;
    sendgrid?: SendGridSettings;
    mailjet?: MailjetSettings;
}

// ============================================
// SMS & WhatsApp Provider Types
// ============================================

export type SmsProvider = 'twilio' | 'msg91' | 'd7networks';

export interface SmsSettings {
    enabled: boolean;
    provider: SmsProvider;
    twilio?: { accountSid: string; authToken: string; fromNumber: string };
    msg91?: { apiKey: string; senderId: string; templateId?: string };
    d7networks?: { token: string; originator: string };
}

export type WhatsappProvider = 'meta' | 'twilio' | 'd7networks';

export interface WhatsappSettings {
    enabled: boolean;
    provider: WhatsappProvider;
    meta?: { phoneNumberId: string; accessToken: string; businessAccountId?: string };
    twilio?: { accountSid: string; authToken: string; fromWhatsAppNumber: string };
    d7networks?: { token: string; originator: string };
}

// ============================================
// Queue Notification Params
// ============================================

export interface QueueNotificationParams {
    storeId: string;
    channel?: NotificationChannel;
    priority?: NotificationPriority;
    type: NotificationType | string;
    recipient: string;
    recipientName?: string;
    subject?: string;
    content?: string;  // Direct content for 'custom' type
    templateData?: Record<string, any>;
    customerId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
    scheduledAt?: Date;
}

// ============================================
// Notification Service
// ============================================

class NotificationService {
    private transporters: Map<string, nodemailer.Transporter> = new Map();
    private sesClients: Map<string, SESClient> = new Map();

    /**
     * Queue a notification for sending
     */
    async queueNotification(params: QueueNotificationParams): Promise<INotificationQueue> {
        const {
            storeId,
            channel = 'email',
            priority = 'normal',
            type,
            recipient,
            recipientName,
            subject,
            content,
            templateData = {},
            customerId,
            orderId,
            metadata,
            scheduledAt,
        } = params;

        let renderedContent: string;
        let renderedSubject: string | undefined = subject;
        let templateId: any = null;

        // For 'custom' type, use provided content directly
        if (type === 'custom') {
            if (!content) {
                throw new Error('Content is required for custom notification type');
            }
            renderedContent = this.renderTemplate(content, templateData);
            if (subject) {
                renderedSubject = this.renderTemplate(subject, templateData);
            }
        } else {
            // Get template and render content
            const template = await this.getTemplate(storeId, type, channel);
            if (!template) {
                throw new Error(`Template not found for type: ${type}, channel: ${channel}`);
            }

            // Render content with template data
            renderedContent = this.renderTemplate(template.htmlContent || template.textContent, templateData);
            renderedSubject = subject || (template.subject ? this.renderTemplate(template.subject, templateData) : undefined);
            templateId = template._id;
        }

        // Create notification in queue
        const notification = await NotificationQueue.create({
            storeId,
            channel,
            priority,
            type,
            recipient,
            recipientName,
            subject: renderedSubject,
            content: renderedContent,
            templateId,
            templateData,
            customerId,
            orderId,
            metadata,
            scheduledAt: scheduledAt || new Date(),
            status: 'pending',
        });

        // If high priority, process immediately
        if (priority === 'high') {
            setImmediate(() => this.processNotification(notification._id.toString()));
        }

        return notification;
    }

    /**
     * Get template - store-specific or fall back to static default
     */
    async getTemplate(storeId: string, type: string, channel: NotificationChannel): Promise<INotificationTemplate | null> {
        // For 'custom' type, we don't need a template - content will be provided directly
        if (type === 'custom') {
            return null;
        }

        // Try to find a template that includes this store
        const mongoose = (await import('mongoose')).default;
        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        const template = await NotificationTemplate.findOne({
            storeIds: storeObjectId,
            type,
            channel,
            isActive: true,
        });

        if (template) {
            return template;
        }

        // Fall back to static defaults
        const { getDefaultTemplateContent } = await import('../utils/template-defaults');
        const defaultContent = getDefaultTemplateContent(type, channel);

        if (defaultContent) {
            // Return a template-like object with default content
            return {
                _id: null,
                storeIds: [],
                type: defaultContent.type,
                channel: defaultContent.channel,
                name: defaultContent.name,
                subject: defaultContent.subject,
                htmlContent: defaultContent.htmlContent,
                textContent: defaultContent.textContent,
                variables: defaultContent.variables,
                isActive: true,
            } as unknown as INotificationTemplate;
        }

        return null;
    }

    /**
     * Render template with Handlebars
     */
    renderTemplate(template: string, data: Record<string, any>): string {
        const compiled = Handlebars.compile(template);
        return compiled(data);
    }

    /**
     * Process a batch of notifications from the queue
     */
    async processQueue(priority: NotificationPriority, limit: number = 30): Promise<{ processed: number; failed: number }> {
        const now = new Date();

        // Get pending notifications
        const notifications = await NotificationQueue.find({
            status: 'pending',
            priority,
            scheduledAt: { $lte: now },
            attempts: { $lt: 3 },  // Max 3 attempts
        })
            .sort({ createdAt: 1 })
            .limit(limit);

        let processed = 0;
        let failed = 0;

        for (const notification of notifications) {
            try {
                await this.processNotification(notification._id.toString());
                processed++;
            } catch (error) {
                failed++;
            }
        }

        return { processed, failed };
    }

    /**
     * Process a single notification
     */
    async processNotification(notificationId: string): Promise<boolean> {
        const notification = await NotificationQueue.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.status !== 'pending') {
            return false;
        }

        // Mark as processing
        notification.status = 'processing';
        notification.attempts += 1;
        notification.lastAttemptAt = new Date();
        await notification.save();

        try {
            // Get store settings
            const store = await Store.findById(notification.storeId);
            if (!store) {
                throw new Error('Store not found');
            }

            const emailSettings = store.settings?.emailSettings as EmailSettings | undefined;
            if (!emailSettings) {
                throw new Error('Email settings not configured');
            }

            // Send based on channel
            switch (notification.channel) {
                case 'email':
                    await this.sendEmail(notification, emailSettings);
                    break;
                case 'sms':
                    const smsSettings = store.settings?.smsSettings as SmsSettings | undefined;
                    if (!smsSettings || !smsSettings.enabled) {
                        throw new Error('SMS settings not configured or disabled');
                    }
                    await this.sendSms(notification, smsSettings);
                    break;
                case 'whatsapp':
                    const whatsappSettings = store.settings?.whatsappSettings as WhatsappSettings | undefined;
                    if (!whatsappSettings || !whatsappSettings.enabled) {
                        throw new Error('WhatsApp settings not configured or disabled');
                    }
                    await this.sendWhatsapp(notification, whatsappSettings);
                    break;
                case 'telegram':
                    const telegramSettings = store.settings?.telegramSettings as any;
                    if (!telegramSettings || !telegramSettings.enabled || !telegramSettings.botToken || !telegramSettings.chatId) {
                        throw new Error('Telegram settings not configured or disabled');
                    }
                    await this.sendViaTelegram(notification, telegramSettings);
                    break;
            }

            // Mark as sent
            notification.status = 'sent';
            notification.sentAt = new Date();
            notification.error = undefined;
            await notification.save();

            return true;
        } catch (error: any) {
            notification.status = notification.attempts >= notification.maxAttempts ? 'failed' : 'pending';
            notification.error = error.message;
            await notification.save();

            console.error(`[NotificationService] Failed to send ${notification.channel}:`, error.message);
            return false;
        }
    }

    /**
     * Send email via configured provider
     */
    async sendEmail(notification: INotificationQueue, settings: EmailSettings): Promise<void> {
        const { provider, fromEmail, fromName, replyTo } = settings;
        const from = `${fromName} <${fromEmail}>`;

        switch (provider) {
            case 'smtp':
                await this.sendViaSMTP(notification, settings.smtp!, from, replyTo);
                break;
            case 'ses':
                await this.sendViaSES(notification, settings.ses!, from, replyTo);
                break;
            case 'sendgrid':
                await this.sendViaSendGrid(notification, settings.sendgrid!, from, replyTo);
                break;
            case 'mailjet':
                await this.sendViaMailjet(notification, settings.mailjet!, from, fromName, fromEmail, replyTo);
                break;
            default:
                throw new Error(`Unknown email provider: ${provider}`);
        }


    }

    /**
     * Send via SMTP (Nodemailer)
     */
    private async sendViaSMTP(
        notification: INotificationQueue,
        smtp: SMTPSettings,
        from: string,
        replyTo?: string
    ): Promise<void> {
        const cacheKey = `smtp-${smtp.host}-${smtp.port}-${smtp.user}`;
        let transporter = this.transporters.get(cacheKey);

        if (!transporter) {
            transporter = nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                auth: {
                    user: smtp.user,
                    pass: smtp.password,
                },
            });
            this.transporters.set(cacheKey, transporter);
        }

        await transporter.sendMail({
            from,
            to: notification.recipient,
            replyTo,
            subject: notification.subject || 'Notification',
            html: notification.content,
        });
    }

    /**
     * Send via AWS SES
     */
    private async sendViaSES(
        notification: INotificationQueue,
        ses: SESSettings,
        from: string,
        replyTo?: string
    ): Promise<void> {
        const cacheKey = `ses-${ses.region}-${ses.accessKeyId}`;
        let client = this.sesClients.get(cacheKey);

        if (!client) {
            client = new SESClient({
                region: ses.region,
                credentials: {
                    accessKeyId: ses.accessKeyId,
                    secretAccessKey: ses.secretAccessKey,
                },
            });
            this.sesClients.set(cacheKey, client);
        }

        const command = new SendEmailCommand({
            Source: from,
            Destination: {
                ToAddresses: [notification.recipient],
            },
            ReplyToAddresses: replyTo ? [replyTo] : undefined,
            Message: {
                Subject: { Data: notification.subject || 'Notification' },
                Body: {
                    Html: { Data: notification.content },
                },
            },
        });

        await client.send(command);
    }

    /**
     * Send via SendGrid
     */
    private async sendViaSendGrid(
        notification: INotificationQueue,
        sendgrid: SendGridSettings,
        from: string,
        replyTo?: string
    ): Promise<void> {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgrid.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: notification.recipient }] }],
                from: { email: from.match(/<(.+)>/)?.[1] || from, name: from.match(/^(.+) </)?.[1] },
                reply_to: replyTo ? { email: replyTo } : undefined,
                subject: notification.subject || 'Notification',
                content: [{ type: 'text/html', value: notification.content }],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`SendGrid error: ${error}`);
        }
    }

    /**
     * Send via Mailjet
     */
    private async sendViaMailjet(
        notification: INotificationQueue,
        mailjet: MailjetSettings,
        _from: string,  // unused but kept for consistent interface
        fromName: string,
        fromEmail: string,
        replyTo?: string
    ): Promise<void> {
        const auth = Buffer.from(`${mailjet.apiKey}:${mailjet.secretKey}`).toString('base64');

        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Messages: [{
                    From: { Email: fromEmail, Name: fromName },
                    To: [{ Email: notification.recipient, Name: notification.recipientName }],
                    ReplyTo: replyTo ? { Email: replyTo } : undefined,
                    Subject: notification.subject || 'Notification',
                    HTMLPart: notification.content,
                }],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Mailjet error: ${error}`);
        }
    }

    /**
     * Send SMS via configured provider
     */
    async sendSms(notification: INotificationQueue, settings: SmsSettings): Promise<void> {
        const { provider } = settings;

        switch (provider) {
            case 'd7networks':
                await this.sendViaD7SMS(notification, settings.d7networks!);
                break;
            case 'twilio':
                await this.sendViaTwilioSMS(notification, settings.twilio!);
                break;
            case 'msg91':
                await this.sendViaMSG91SMS(notification, settings.msg91!);
                break;
            default:
                throw new Error(`Unknown SMS provider: ${provider}`);
        }


    }

    /**
     * Send via D7Networks SMS
     */
    private async sendViaD7SMS(notification: INotificationQueue, config: { token: string; originator: string }): Promise<void> {
        const response = await fetch('https://api.d7networks.com/messages/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        channel: 'sms',
                        recipients: [notification.recipient],
                        content: notification.content,
                        msg_type: 'text',
                        data_coding: 'text',
                        originator: config.originator,
                    }
                ]
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`D7Networks SMS error: ${error}`);
        }
    }

    /**
     * Send WhatsApp via configured provider
     */
    async sendWhatsapp(notification: INotificationQueue, settings: WhatsappSettings): Promise<void> {
        const { provider } = settings;

        switch (provider) {
            case 'd7networks':
                await this.sendViaD7WhatsApp(notification, settings.d7networks!);
                break;
            case 'meta':
                await this.sendViaMetaWhatsApp(notification, settings.meta!);
                break;
            case 'twilio':
                await this.sendViaTwilioWhatsApp(notification, settings.twilio!);
                break;
            default:
                throw new Error(`Unknown WhatsApp provider: ${provider}`);
        }


    }

    /**
     * Send via D7Networks WhatsApp
     */
    private async sendViaD7WhatsApp(notification: INotificationQueue, config: { token: string; originator: string }): Promise<void> {
        const response = await fetch('https://api.d7networks.com/messages/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        channel: 'whatsapp',
                        recipients: [notification.recipient],
                        content: notification.content,
                        msg_type: 'text',
                        originator: config.originator,
                    }
                ]
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`D7Networks WhatsApp error: ${error}`);
        }
    }

    /**
     * Send via Meta WhatsApp
     */
    private async sendViaMetaWhatsApp(notification: INotificationQueue, config: { phoneNumberId: string; accessToken: string }): Promise<void> {
        // Meta requires phone number without any symbols like + or ()
        const to = notification.recipient.replace(/\D/g, '');

        const response = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: notification.content }
            }),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(`Meta WhatsApp error: ${JSON.stringify(error)}`);
        }
    }

    /**
     * Send via Twilio WhatsApp
     */
    private async sendViaTwilioWhatsApp(notification: INotificationQueue, config: { accountSid: string; authToken: string; fromWhatsAppNumber: string }): Promise<void> {
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
        const params = new URLSearchParams();

        // E.164 format for Twilio: +[country code][number]
        const digits = notification.recipient.replace(/\D/g, '');
        params.append('To', `whatsapp:+${digits}`);
        params.append('From', `whatsapp:${config.fromWhatsAppNumber.startsWith('+') ? config.fromWhatsAppNumber : '+' + config.fromWhatsAppNumber}`);
        params.append('Body', notification.content);

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(`Twilio WhatsApp error: ${error.message}`);
        }
    }

    /**
     * Send via Twilio SMS
     */
    private async sendViaTwilioSMS(notification: INotificationQueue, config: { accountSid: string; authToken: string; fromNumber: string }): Promise<void> {
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', notification.recipient);
        params.append('From', config.fromNumber);
        params.append('Body', notification.content);

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(`Twilio SMS error: ${error.message}`);
        }
    }

    /**
     * Send via MSG91 SMS
     */
    private async sendViaMSG91SMS(notification: INotificationQueue, config: { apiKey: string; senderId: string; templateId?: string }): Promise<void> {
        // Handle flow-based (transactional) if templateId exists, otherwise simple SMS
        const url = config.templateId
            ? 'https://api.msg91.com/api/v5/flow/'
            : 'https://control.msg91.com/api/v5/otp/send'; // Using OTP API as simpler transaction for plain text

        const body = config.templateId
            ? {
                template_id: config.templateId,
                sender: config.senderId,
                short_url: '0',
                recipients: [
                    {
                        mobiles: notification.recipient,
                        // If it's a template, we'd need mapped variables, but here we only have content.
                        // For simplicity in this generic implementation, we'll try to pass content if possible.
                        // Most users will use templates for fixed messages.
                        content: notification.content
                    }
                ]
            }
            : {
                template_id: '', // Not used for direct OTP-like send
                mobile: notification.recipient,
                authkey: config.apiKey,
                message: notification.content,
                sender: config.senderId
            };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authkey': config.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`MSG91 error: ${error}`);
        }
    }

    /**
     * Send via Telegram
     */
    private async sendViaTelegram(notification: INotificationQueue, config: { botToken: string; chatId: string }): Promise<void> {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: notification.content,
                parse_mode: 'HTML',
            }),
        });

        if (!response.ok) {
            const error = await response.json() as any;
            throw new Error(`Telegram error: ${error.description || JSON.stringify(error)}`);
        }
    }

    /**
     * Trigger admin notifications for a specific event
     */
    async triggerAdminNotifications(
        storeId: string,
        event: 'newOrder' | 'orderStatus' | 'returnRequest' | 'orderCancel' | 'newCustomer',
        data: Record<string, any>
    ) {
        const Store = (await import('../models/Store')).default;
        const store = await Store.findById(storeId);
        if (!store) return;

        const adminSettings = store.settings?.adminNotificationSettings;
        const telegramSettings = store.settings?.telegramSettings;

        // Map event keys to notification types
        const eventTypeMap: Record<string, string> = {
            newOrder: 'admin_order_created',
            orderStatus: 'admin_order_updated',
            returnRequest: 'admin_return_requested',
            orderCancel: 'admin_order_cancelled',
            newCustomer: 'admin_customer_signup',
        };

        const type = eventTypeMap[event];

        // 1. Admin Email Notifications
        if (adminSettings?.notifications?.emailEnabled && adminSettings?.notifications[event]) {
            const emails = adminSettings.emails?.split(',').map((e: string) => e.trim()).filter((e: string) => e) || [];
            for (const email of emails) {
                try {
                    await this.queueNotification({
                        storeId: storeId.toString(),
                        channel: 'email',
                        priority: 'high',
                        type,
                        recipient: email,
                        templateData: {
                            ...data,
                            storeName: store.name,
                        },
                    });
                } catch (error) {
                    console.error(`Failed to queue admin email for ${event}:`, error);
                }
            }
        }

        // 2. Telegram Notifications
        if (telegramSettings?.enabled && telegramSettings?.notifications[event]) {
            try {
                await this.queueNotification({
                    storeId: storeId.toString(),
                    channel: 'telegram',
                    priority: 'high',
                    type,
                    recipient: telegramSettings.chatId || '',
                    templateData: {
                        ...data,
                        storeName: store.name,
                    },
                });
            } catch (error) {
                console.error(`Failed to queue telegram notification for ${event}:`, error);
            }
        }
    }

    /**
     * Retry a failed notification
     */
    async retryNotification(notificationId: string): Promise<boolean> {
        const notification = await NotificationQueue.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.status !== 'failed') {
            throw new Error('Can only retry failed notifications');
        }

        notification.status = 'pending';
        notification.attempts = 0;
        notification.error = undefined;
        await notification.save();

        return this.processNotification(notificationId);
    }

    /**
     * Cancel a pending notification
     */
    async cancelNotification(notificationId: string): Promise<INotificationQueue> {
        const notification = await NotificationQueue.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.status !== 'pending') {
            throw new Error('Can only cancel pending notifications');
        }

        notification.status = 'cancelled';
        await notification.save();

        return notification;
    }

    /**
     * Get queue statistics for a store
     */
    async getQueueStats(storeId?: string): Promise<Record<string, number>> {
        const matchStage = storeId ? { storeId: storeId } : {};
        const stats = await NotificationQueue.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const result: Record<string, number> = {
            pending: 0,
            processing: 0,
            sent: 0,
            failed: 0,
            cancelled: 0,
        };

        stats.forEach(s => {
            result[s._id] = s.count;
        });

        return result;
    }

    // ============================================
    // Admin Notification Methods
    // ============================================

    /**
     * Create a notification for admin(s)
     */
    async createAdminNotification(params: {
        type: string;
        title: string;
        message: string;
        data?: Record<string, any>;
        recipient?: string;
    }): Promise<any> { // Using any temporarily to avoid circular dep issues on import if strict
        const Notification = (await import('../models/Notification')).default;

        const notification = await Notification.create({
            type: params.type,
            title: params.title,
            message: params.message,
            data: params.data,
            recipient: params.recipient || null,
            isRead: false
        });

        return notification;
    }

    /**
     * Get admin notifications
     */
    async getAdminNotifications(params: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        recipient?: string;
    }): Promise<{ notifications: any[], total: number, unreadCount: number }> {
        const Notification = (await import('../models/Notification')).default;

        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const query: any = {};

        if (params.unreadOnly) {
            query.isRead = false;
        }

        // If recipient provided, match recipient OR global (null)
        // If no recipient provided (super admin viewing all?), might want to fit logic
        // usually admin panel calls this with current user ID
        if (params.recipient) {
            query.$or = [
                { recipient: params.recipient },
                { recipient: null }
            ];
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);

        // Always get total unread count for badge
        const unreadQuery = { ...query };
        unreadQuery.isRead = false;
        // If we were filtering by unreadOnly, query is same. if not, we need to ensure unread.
        // But above 'query' might have $or for recipient.
        // Let's reset unread query to be safe
        const unreadMatch: any = { isRead: false };
        if (params.recipient) {
            unreadMatch.$or = [
                { recipient: params.recipient },
                { recipient: null }
            ];
        }
        const unreadCount = await Notification.countDocuments(unreadMatch);

        return { notifications, total, unreadCount };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string): Promise<boolean> {
        const Notification = (await import('../models/Notification')).default;

        const result = await Notification.updateOne(
            { _id: id },
            { $set: { isRead: true } }
        );

        return result.modifiedCount > 0;
    }

    /**
     * Mark all notifications as read for a recipient
     */
    async markAllAsRead(recipient: string): Promise<boolean> {
        const Notification = (await import('../models/Notification')).default;

        const query: any = {
            isRead: false,
            $or: [
                { recipient: recipient },
                { recipient: null }
            ]
        };

        const result = await Notification.updateMany(
            query,
            { $set: { isRead: true } }
        );

        return result.modifiedCount > 0;
    }
}

export const notificationService = new NotificationService();
export default notificationService;
