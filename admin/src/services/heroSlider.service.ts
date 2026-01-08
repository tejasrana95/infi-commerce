import api from '@/lib/api';

// Section layout configuration
export interface SectionLayout {
    columns: number; // 1-6 columns
    gap: number; // Gap in pixels
    alignment: 'start' | 'center' | 'end' | 'stretch';
    justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap: boolean; // Enable wrapping
    direction: 'row' | 'column';
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    // Responsive overrides
    tabletColumns?: number;
    mobileColumns?: number;
    tabletGap?: number;
    mobileGap?: number;
    tabletDirection?: 'row' | 'column';
    mobileDirection?: 'row' | 'column';
}

export interface HeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'icon' | 'rte' | 'section';
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
    // Section/Container features
    parentId?: string; // Parent section ID (null for root layers)
    children?: string[]; // Child layer IDs (for section type)
    sectionLayout?: SectionLayout; // Section-specific layout config
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
