import mongoose, { Document, Schema } from 'mongoose';

export interface IHeroBanner extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    isActive: boolean;
    order: number;
    title: {
        text: string;
        color?: string;
        highlightColor?: string;
        highlightFontFamily?: string;
        fontSize?: string;
        fontSizeTablet?: string;
        fontSizeMobile?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    };
    description: {
        text: string;
        color?: string;
        fontSize?: string;
        fontSizeTablet?: string;
        fontSizeMobile?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    };
    stats?: Array<{
        number: string;
        label: string;
        icon?: string;
        color?: string;
        numberColor?: string;
        labelColor?: string;
        fontSize?: string;
        numberFontSize?: string;
        labelFontSize?: string;
        fontFamily?: string;
        numberFontFamily?: string;
        labelFontFamily?: string;
        fontWeight?: string;
        numberFontWeight?: string;
        labelFontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
    }>;
    chips?: Array<{
        label: string;
        icon?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
        borderColor?: string;
    }>;
    image?: {
        src: string;
        borderRadius?: string;
        borderColor?: string;
        borderWidth?: string;
        highlights?: Array<{
            label?: string;
            value?: string;
            position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
            backgroundColor?: string;
            textColor?: string;
            labelColor?: string;
            labelFontFamily?: string;
            labelFontSize?: string;
            labelFontWeight?: string;
            valueColor?: string;
            valueFontFamily?: string;
            valueFontSize?: string;
            valueFontWeight?: string;
        }>;
    };
    ctas?: Array<{
        label: string;
        link: string;
        target?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: {
            desktop?: string;
            tablet?: string;
            mobile?: string;
        };
        lineHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
        borderColor?: string;
    }>;
    config?: {
        backgroundGradient?: string;
        padding?: string;
        margin?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const HeroBannerSchema = new Schema<IHeroBanner>(
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
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        title: {
            text: { type: String, required: true },
            color: { type: String },
            highlightColor: { type: String },
            highlightFontFamily: { type: String },
            fontSize: { type: String },
            fontSizeTablet: { type: String },
            fontSizeMobile: { type: String },
            fontFamily: { type: String },
            fontWeight: { type: String },
            textAlign: {
                desktop: { type: String, default: 'left' },
                tablet: { type: String, default: 'left' },
                mobile: { type: String, default: 'left' },
            },
            lineHeight: { type: String },
        },
        description: {
            text: { type: String, required: true },
            color: { type: String },
            fontSize: { type: String },
            fontSizeTablet: { type: String },
            fontSizeMobile: { type: String },
            fontFamily: { type: String },
            fontWeight: { type: String },
            textAlign: {
                desktop: { type: String, default: 'left' },
                tablet: { type: String, default: 'left' },
                mobile: { type: String, default: 'left' },
            },
            lineHeight: { type: String },
        },
        stats: [
            {
                number: { type: String },
                label: { type: String },
                icon: { type: String },
                color: { type: String },
                numberColor: { type: String },
                labelColor: { type: String },
                fontSize: { type: String },
                numberFontSize: { type: String },
                labelFontSize: { type: String },
                fontFamily: { type: String },
                numberFontFamily: { type: String },
                labelFontFamily: { type: String },
                fontWeight: { type: String },
                numberFontWeight: { type: String },
                labelFontWeight: { type: String },
                textAlign: {
                    desktop: { type: String, default: 'left' },
                    tablet: { type: String, default: 'left' },
                    mobile: { type: String, default: 'left' },
                },
                lineHeight: { type: String },
            },
        ],
        chips: [
            {
                label: { type: String },
                icon: { type: String },
                color: { type: String },
                fontSize: { type: String },
                fontFamily: { type: String },
                fontWeight: { type: String },
                textAlign: {
                    desktop: { type: String, default: 'left' },
                    tablet: { type: String, default: 'left' },
                    mobile: { type: String, default: 'left' },
                },
                lineHeight: { type: String },
                backgroundColor: { type: String },
                borderRadius: { type: String },
                borderColor: { type: String },
            },
        ],
        image: {
            src: { type: String },
            borderRadius: { type: String },
            borderColor: { type: String },
            borderWidth: { type: String },
            highlights: [
                {
                    label: { type: String },
                    value: { type: String },
                    position: {
                        type: String,
                        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
                        default: 'top-right',
                    },
                    backgroundColor: { type: String },
                    textColor: { type: String },
                    labelColor: { type: String },
                    labelFontFamily: { type: String },
                    labelFontSize: { type: String },
                    labelFontWeight: { type: String },
                    valueColor: { type: String },
                    valueFontFamily: { type: String },
                    valueFontSize: { type: String },
                    valueFontWeight: { type: String },
                },
            ],
        },
        ctas: [
            {
                label: { type: String },
                link: { type: String },
                target: { type: String },
                color: { type: String },
                fontSize: { type: String },
                fontFamily: { type: String },
                fontWeight: { type: String },
                textAlign: {
                    desktop: { type: String, default: 'left' },
                    tablet: { type: String, default: 'left' },
                    mobile: { type: String, default: 'left' },
                },
                lineHeight: { type: String },
                backgroundColor: { type: String },
                borderRadius: { type: String },
                borderColor: { type: String },
            },
        ],
        config: {
            backgroundGradient: { type: String },
            padding: { type: String },
            margin: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

HeroBannerSchema.index({ storeId: 1, isActive: 1, order: 1 });

export default mongoose.model<IHeroBanner>('HeroBanner', HeroBannerSchema);
