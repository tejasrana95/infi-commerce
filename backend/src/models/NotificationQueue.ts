import mongoose, { Schema, Document } from 'mongoose';

/**
 * Notification Queue Model
 * Stores all pending, processing, sent, and failed notifications
 * Supports email, SMS, and WhatsApp channels
 */

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'telegram';
export type NotificationPriority = 'high' | 'normal' | 'low';
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

// Notification types
export type NotificationType =
    | 'welcome'
    | 'verify_email'
    | 'password_reset'
    | 'order_created'
    | 'order_confirmed'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'order_refunded'
    | 'return_requested'
    | 'customer_signup'
    | 'admin_order_created'
    | 'admin_order_updated'
    | 'admin_return_requested'
    | 'admin_order_cancelled'
    | 'admin_customer_signup'
    | 'cart_abandoned'
    | 'review_request'
    | 'back_in_stock'
    | 'price_drop'
    | 'custom';

export interface INotificationQueue extends Document {
    storeId: mongoose.Types.ObjectId;
    channel: NotificationChannel;
    priority: NotificationPriority;
    type: NotificationType | string;

    // Recipient info
    recipient: string;           // email address or phone number
    recipientName?: string;      // for personalization

    // Content
    subject?: string;            // for email
    content: string;             // rendered HTML/text
    templateId?: mongoose.Types.ObjectId;
    templateData?: Record<string, any>;  // variables used

    // Processing
    attempts: number;
    maxAttempts: number;
    lastAttemptAt?: Date;
    scheduledAt?: Date;          // for delayed sending
    sentAt?: Date;               // when successfully sent
    status: NotificationStatus;
    error?: string;

    // References
    customerId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const NotificationQueueSchema = new Schema<INotificationQueue>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        channel: {
            type: String,
            enum: ['email', 'sms', 'whatsapp', 'telegram'],
            required: true,
            default: 'email',
        },
        priority: {
            type: String,
            enum: ['high', 'normal', 'low'],
            required: true,
            default: 'normal',
        },
        type: {
            type: String,
            required: true,
            index: true,
        },
        recipient: {
            type: String,
            required: true,
            index: true,
        },
        recipientName: String,
        subject: String,
        content: {
            type: String,
            required: true,
        },
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'NotificationTemplate',
        },
        templateData: {
            type: Schema.Types.Mixed,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        maxAttempts: {
            type: Number,
            default: 3,
        },
        lastAttemptAt: Date,
        scheduledAt: Date,
        sentAt: Date,
        status: {
            type: String,
            enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        error: String,
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        metadata: Schema.Types.Mixed,
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queue processing
NotificationQueueSchema.index({ status: 1, priority: 1, scheduledAt: 1 });
NotificationQueueSchema.index({ storeId: 1, status: 1 });
NotificationQueueSchema.index({ storeId: 1, createdAt: -1 });
NotificationQueueSchema.index({ customerId: 1, createdAt: -1 });

const NotificationQueue = mongoose.model<INotificationQueue>('NotificationQueue', NotificationQueueSchema);

export default NotificationQueue;
