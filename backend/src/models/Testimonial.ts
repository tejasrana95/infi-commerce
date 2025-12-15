import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
    storeId: mongoose.Types.ObjectId;
    customerName: string;
    customerTitle?: string;
    customerImage?: string;
    content: string;
    rating?: number;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        customerTitle: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        customerImage: {
            type: String,
        },
        content: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

TestimonialSchema.index({ storeId: 1, isActive: 1, order: 1 });

export default mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
