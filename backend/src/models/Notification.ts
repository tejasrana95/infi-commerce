import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'order' | 'customer' | 'return' | 'refund' | 'system';

export interface INotification extends Document {
    recipient?: string; // Optional: user ID if targeting specific admin, null for all
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>; // For linking to resources (e.g., { orderId: '123' })
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, required: true, enum: ['order', 'customer', 'return', 'refund', 'system'] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Index for efficient querying by recipient and read status
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
