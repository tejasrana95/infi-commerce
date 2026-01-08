import api from '@/lib/api';

export interface HeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'icon' | 'rte';
    content: any;
    style: any;
    position: { x: number; y: number };
    tabletPosition?: { x: number; y: number };
    mobilePosition?: { x: number; y: number };
    animation: {
        in: string;
        out: string;
        delay: number;
        duration: number;
    };
    // Professional Editor Features
    name?: string; // Custom layer name for better organization
    visible?: boolean; // Layer visibility toggle (default: true)
    locked?: boolean; // Prevent layer editing/moving (default: false)
    rotation?: number; // Rotation in degrees (default: 0)
    opacity?: number; // Opacity 0-1 (default: 1)
    groupId?: string; // Group ID for grouped layers
    // Enhanced Styling
    border?: {
        color?: string;
        width?: number; // fallback or uniform
        radius?: number;
        style?: 'solid' | 'dashed' | 'dotted' | 'none';
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    shadow?: {
        color?: string;
        blur?: number;
        x?: number;
        y?: number;
        spread?: number;
    };
    // Device-specific styles
    tabletStyle?: any; // Override styles for tablet
    mobileStyle?: any; // Override styles for mobile
    tabletVisible?: boolean; // Visibility on tablet (default: inherit from visible)
    mobileVisible?: boolean; // Visibility on mobile (default: inherit from visible)
}

export interface HeroSliderSlide {
    _id?: string;
    id: string;
    name?: string; // Custom slide name for better organization
    background: {
        type: 'image' | 'color' | 'video';
        value: string;
        overlay?: string;
        overlayOpacity?: number;
    };
    layers: HeroSliderLayer[];
    settings: {
        duration: number;
    };
}

export interface HeroSlider {
    _id: string;
    name: string;
    storeId: string;
    slides: HeroSliderSlide[];
    settings: {
        width: number;
        height: number | { desktop: number; tablet: number; mobile: number };
        responsive: boolean;
        autoPlay: boolean;
        delay: number;
        effect: 'fade' | 'slide' | 'cube' | 'coverflow' | 'flip';
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type CreateHeroSliderData = Omit<HeroSlider, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateHeroSliderData = Partial<CreateHeroSliderData>;

const heroSliderService = {
    getAll: async (storeId?: string) => {
        return api.get<HeroSlider[]>('/hero-sliders');
    },

    getById: async (id: string) => {
        return api.get<HeroSlider>(`/hero-sliders/${id}`);
    },

    create: async (data: CreateHeroSliderData) => {
        return api.post<HeroSlider>('/hero-sliders', data);
    },

    update: async (id: string, data: UpdateHeroSliderData) => {
        return api.put<HeroSlider>(`/hero-sliders/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete(`/hero-sliders/${id}`);
    }
};

export default heroSliderService;
