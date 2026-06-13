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

export interface HeroBanner {
    _id: string;
    storeId: string | { _id: string; name: string };
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
        textAlign?: string;
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
        textAlign?: string;
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
        textAlign?: string;
        lineHeight?: string;
    }>;
    chips?: Array<{
        label: string;
        icon?: string;
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: string;
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
        textAlign?: string;
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
    createdAt: string;
    updatedAt: string;
}
