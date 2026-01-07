import mongoose, { Document, Schema } from 'mongoose';

export interface IHeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'shape';
    content: any; // Text string, Image URL, or Button config
    style: any; // CSS properties
    position: {
        x: number; // Percentage 0-100
        y: number; // Percentage 0-100
    };
    tabletPosition?: {
        x: number;
        y: number;
    };
    mobilePosition?: {
        x: number;
        y: number;
    };
    border?: {
        color?: string;
        width?: number;
        radius?: number;
        style?: 'solid' | 'dashed' | 'dotted' | 'none';
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    shadow?: {
        x?: number;
        y?: number;
        blur?: number;
        spread?: number;
        color?: string;
    };
    animation: {
        in: string; // e.g., 'fadeIn'
        out: string; // e.g., 'fadeOut'
        delay: number; // ms
        duration: number; // ms
    };
}

export interface IHeroSliderSlide {
    id: string;
    background: {
        type: 'image' | 'color' | 'video';
        value: string;
        overlay?: string;
    };
    layers: IHeroSliderLayer[];
    settings: {
        duration: number;
    };
}

export interface IHeroSlider extends Document {
    name: string;
    storeId: mongoose.Schema.Types.ObjectId;
    slides: IHeroSliderSlide[];
    settings: {
        width: number;
        height: number;
        responsive: boolean;
        autoPlay: boolean;
        delay: number;
        effect: 'fade' | 'slide' | 'cube' | 'coverflow' | 'flip';
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HeroSliderSchema: Schema = new Schema({
    name: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    slides: [{
        id: { type: String, required: true },
        background: {
            type: { type: String, enum: ['image', 'color', 'video'], default: 'image' },
            value: { type: String, default: '' },
            overlay: { type: String, default: 'rgba(0,0,0,0)' }
        },
        layers: [{
            id: { type: String, required: true },
            type: { type: String, enum: ['text', 'image', 'button', 'shape', 'icon'], default: 'text' },
            content: { type: Schema.Types.Mixed, default: {} },
            style: { type: Schema.Types.Mixed, default: {} },
            position: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 }
            },
            tabletPosition: {
                x: { type: Number },
                y: { type: Number }
            },
            mobilePosition: {
                x: { type: Number },
                y: { type: Number }
            },
            // Professional Styling
            border: {
                color: { type: String },
                width: { type: Number },
                radius: { type: Number },
                style: { type: String, enum: ['solid', 'dashed', 'dotted', 'none'] },
                top: { type: Number },
                right: { type: Number },
                bottom: { type: Number },
                left: { type: Number }
            },
            shadow: {
                x: { type: Number },
                y: { type: Number },
                blur: { type: Number },
                spread: { type: Number },
                color: { type: String }
            },
            animation: {
                in: { type: String, default: 'fadeIn' },
                out: { type: String, default: 'fadeOut' },
                delay: { type: Number, default: 0 },
                duration: { type: Number, default: 800 }
            }
        }],
        settings: {
            duration: { type: Number, default: 5000 }
        }
    }],
    settings: {
        width: { type: Number, default: 1920 },
        height: { type: Schema.Types.Mixed, default: 800 },
        responsive: { type: Boolean, default: true },
        autoPlay: { type: Boolean, default: true },
        delay: { type: Number, default: 5000 },
        effect: { type: String, default: 'fade' }
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IHeroSlider>('HeroSlider', HeroSliderSchema);
