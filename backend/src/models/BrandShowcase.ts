import mongoose, { Schema, Document } from 'mongoose';

export interface IBrandLogo {
    image: string;
    alt: string;
    link?: string;
    order: number;
}

export interface IBrandShowcase extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    logos: IBrandLogo[];
    settings: {
        layout: 'grid' | 'carousel';
        columns: number;
        grayscale: boolean;
        hoverEffect: boolean;
        autoplay: boolean;
        interval: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BrandLogoSchema = new Schema<IBrandLogo>(
    {
        image: {
            type: String,
            required: true,
        },
        alt: {
            type: String,
            required: true,
            maxlength: 100,
        },
        link: String,
        order: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const BrandShowcaseSchema = new Schema<IBrandShowcase>(
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
        logos: [BrandLogoSchema],
        settings: {
            layout: {
                type: String,
                enum: ['grid', 'carousel'],
                default: 'grid',
            },
            columns: {
                type: Number,
                min: 2,
                max: 8,
                default: 6,
            },
            grayscale: {
                type: Boolean,
                default: false,
            },
            hoverEffect: {
                type: Boolean,
                default: true,
            },
            autoplay: {
                type: Boolean,
                default: false,
            },
            interval: {
                type: Number,
                default: 3000,
                min: 1000,
                max: 10000,
            },
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

BrandShowcaseSchema.index({ storeId: 1, isActive: 1 });

export default mongoose.model<IBrandShowcase>('BrandShowcase', BrandShowcaseSchema);
