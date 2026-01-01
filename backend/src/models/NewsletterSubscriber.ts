import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
    email: string;
    storeId: mongoose.Types.ObjectId;
    status: 'subscribed' | 'unsubscribed';
    createdAt: Date;
    updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['subscribed', 'unsubscribed'],
            default: 'subscribed',
        },
    },
    {
        timestamps: true,
    }
);

// Unique index for email + storeId
NewsletterSubscriberSchema.index({ email: 1, storeId: 1 }, { unique: true });

const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);

export default NewsletterSubscriber;
