import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    image: string;
    mobileImage?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment: 'left' | 'center' | 'right';
    overlay: {
        enabled: boolean;
        color: string;
        opacity: number;
    };
    textColor?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        image: {
            type: String,
            required: true,
        },
        mobileImage: {
            type: String,
        },
        title: {
            type: String,
            maxlength: 200,
        },
        subtitle: {
            type: String,
            maxlength: 500,
        },
        ctaText: {
            type: String,
            maxlength: 50,
        },
        ctaLink: {
            type: String,
        },
        alignment: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center',
        },
        overlay: {
            enabled: {
                type: Boolean,
                default: false,
            },
            color: {
                type: String,
                default: '#000000',
            },
            opacity: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.3,
            },
        },
        textColor: {
            type: String,
            default: '#ffffff',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for store + active banners
BannerSchema.index({ storeId: 1, isActive: 1 });

export default mongoose.model<IBanner>('Banner', BannerSchema);
