export interface Banner {
    _id: string;
    storeId: string | { _id: string; name: string };
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
    createdAt: string;
    updatedAt: string;
}

export interface BannerSlide {
    bannerId?: string;
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

export interface BannerSlider {
    _id: string;
    storeId: string | { _id: string; name: string };
    name: string;
    slides: BannerSlide[];
    settings: {
        autoplay: boolean;
        interval: number;
        showArrows: boolean;
        showDots: boolean;
        pauseOnHover: boolean;
        effect: 'slide' | 'fade';
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Testimonial {
    _id: string;
    storeId: string | { _id: string; name: string };
    customerName: string;
    customerTitle?: string;
    customerImage?: string;
    productPurchased?: string;
    content: string;
    rating?: number;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface BrandLogo {
    image: string;
    alt: string;
    link?: string;
    order: number;
}

export interface BrandShowcase {
    _id: string;
    storeId: string | { _id: string; name: string };
    name: string;
    logos: BrandLogo[];
    settings: {
        layout: 'grid' | 'carousel';
        columns: number;
        grayscale: boolean;
        hoverEffect: boolean;
        autoplay: boolean;
        interval: number;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
