import mongoose, { Document, Schema } from 'mongoose';

// Section layout configuration
export interface ISectionLayout {
    columns: number;
    gap: number;
    alignment: 'start' | 'center' | 'end' | 'stretch';
    justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap: boolean;
    direction: 'row' | 'column';
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    tabletColumns?: number;
    mobileColumns?: number;
    tabletGap?: number;
    mobileGap?: number;
    tabletDirection?: 'row' | 'column';
    mobileDirection?: 'row' | 'column';
}

export interface IHeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'shape' | 'icon' | 'rte' | 'section';
    content: any; // Text string, Image URL, or Button config
    style: any; // CSS properties
    tabletStyle?: any; // Override styles for tablet
    mobileStyle?: any; // Override styles for mobile
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
    // Professional Editor Features
    name?: string;
    visible?: boolean;
    locked?: boolean;
    rotation?: number;
    opacity?: number;
    groupId?: string;
    tabletVisible?: boolean;
    mobileVisible?: boolean;
    // Section/Container features
    parentId?: string;
    children?: string[];
    sectionLayout?: ISectionLayout;
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
        showBullets?: boolean;
        bulletColor?: string;
        showArrows?: boolean;
        arrowColor?: string;
        showProgress?: boolean;
        progressPosition?: 'top' | 'bottom';
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
            type: { type: String, enum: ['text', 'image', 'button', 'shape', 'icon', 'rte', 'section'], default: 'text' },
            content: { type: Schema.Types.Mixed, default: {} },
            style: { type: Schema.Types.Mixed, default: {} },
            tabletStyle: { type: Schema.Types.Mixed },
            mobileStyle: { type: Schema.Types.Mixed },
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
            // Professional Editor Features
            name: { type: String },
            visible: { type: Boolean, default: true },
            locked: { type: Boolean, default: false },
            rotation: { type: Number, default: 0 },
            opacity: { type: Number, default: 1 },
            groupId: { type: String },
            tabletVisible: { type: Boolean },
            mobileVisible: { type: Boolean },
            // Section/Container features
            parentId: { type: String },
            children: [{ type: String }],
            sectionLayout: {
                columns: { type: Number, default: 4 },
                gap: { type: Number, default: 16 },
                alignment: { type: String, enum: ['start', 'center', 'end', 'stretch'], default: 'stretch' },
                justify: { type: String, enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'], default: 'start' },
                wrap: { type: Boolean, default: true },
                direction: { type: String, enum: ['row', 'column'], default: 'row' },
                padding: {
                    top: { type: Number },
                    right: { type: Number },
                    bottom: { type: Number },
                    left: { type: Number }
                },
                tabletColumns: { type: Number },
                mobileColumns: { type: Number },
                tabletGap: { type: Number },
                mobileGap: { type: Number },
                tabletDirection: { type: String, enum: ['row', 'column'] },
                mobileDirection: { type: String, enum: ['row', 'column'] }
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
        effect: { type: String, default: 'fade' },
        showBullets: { type: Boolean, default: true },
        bulletColor: { type: String, default: '#ffffff' },
        showArrows: { type: Boolean, default: true },
        arrowColor: { type: String, default: '#ffffff' },
        showProgress: { type: Boolean, default: false },
        progressPosition: { type: String, enum: ['top', 'bottom'], default: 'bottom' }
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IHeroSlider>('HeroSlider', HeroSliderSchema);
