import mongoose, { Schema, Document } from 'mongoose';

export interface IBannerSlide {
    bannerId?: mongoose.Types.ObjectId;
    image?: string;
    mobileImage?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment?: 'left' | 'center' | 'right';
    textColor?: string;
    order: number;
}

export interface IBannerSlider extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slides: IBannerSlide[];
    settings: {
        autoplay: boolean;
        interval: number;
        showArrows: boolean;
        showDots: boolean;
        pauseOnHover: boolean;
        effect: 'slide' | 'fade';
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSlideSchema = new Schema<IBannerSlide>(
    {
        bannerId: {
            type: Schema.Types.ObjectId,
            ref: 'Banner',
        },
        image: String,
        mobileImage: String,
        title: String,
        subtitle: String,
        ctaText: String,
        ctaLink: String,
        alignment: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center',
        },
        textColor: String,
        order: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const BannerSliderSchema = new Schema<IBannerSlider>(
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
        slides: [BannerSlideSchema],
        settings: {
            autoplay: {
                type: Boolean,
                default: true,
            },
            interval: {
                type: Number,
                default: 5000,
                min: 1000,
                max: 30000,
            },
            showArrows: {
                type: Boolean,
                default: true,
            },
            showDots: {
                type: Boolean,
                default: true,
            },
            pauseOnHover: {
                type: Boolean,
                default: true,
            },
            effect: {
                type: String,
                enum: ['slide', 'fade'],
                default: 'slide',
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

BannerSliderSchema.index({ storeId: 1, isActive: 1 });

export default mongoose.model<IBannerSlider>('BannerSlider', BannerSliderSchema);
