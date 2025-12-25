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
                    // TODO: Implement in Phase 3
                    throw new Error('SMS not yet implemented');
                case 'whatsapp':
                    // TODO: Implement in Phase 3
                    throw new Error('WhatsApp not yet implemented');
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

        console.log(`[NotificationService] Email sent to ${notification.recipient} via ${provider}`);
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
}

export const notificationService = new NotificationService();
export default notificationService;
