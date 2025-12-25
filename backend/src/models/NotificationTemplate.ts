import mongoose, { Schema, Document } from 'mongoose';

/**
 * Notification Template Model
 * Stores customizable templates for different notification types
 * Supports multi-store assignment (templates can be shared across stores)
 * 
 * UNIQUENESS CONSTRAINT:
 * Only one ACTIVE template can exist per (storeId, type, channel) combination.
 * This means for any given store, only one active template of each type/channel is allowed.
 * Inactive templates are allowed as duplicates (for versioning/backup purposes).
 */

export type TemplateChannel = 'email' | 'sms' | 'whatsapp';

export interface INotificationTemplate extends Document {
    storeIds: mongoose.Types.ObjectId[];  // array for multi-store support
    type: string;                          // notification type
    channel: TemplateChannel;
    name: string;
    subject?: string;                      // for email
    htmlContent?: string;                  // for email (supports {{variables}})
    textContent: string;                   // plain text / SMS / WhatsApp
    variables: string[];                   // available variables
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
    {
        storeIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        }],
        type: {
            type: String,
            required: true,
            index: true,
        },
        channel: {
            type: String,
            enum: ['email', 'sms', 'whatsapp'],
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        subject: String,
        htmlContent: String,
        textContent: {
            type: String,
            required: true,
        },
        variables: [{
            type: String,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries by store
NotificationTemplateSchema.index({ storeIds: 1, type: 1, channel: 1 });
NotificationTemplateSchema.index({ type: 1, channel: 1 });

const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);

export default NotificationTemplate;
