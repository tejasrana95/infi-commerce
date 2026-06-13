import { ProductCardConfig, CategoryConfig, ProductPageConfig, CompareConfig } from './style';

export interface HeaderTopBarItem {
    id: string;
    type: 'text' | 'link' | 'phone' | 'email' | 'social' | 'language' | 'currency' | 'block';
    content?: string;
    label?: string;
    url?: string;
    icon?: string;
    position: 'left' | 'center' | 'right';
    order: number;
    visibleOn?: Array<'desktop' | 'tablet' | 'mobile'>;
}

export interface HeaderTopBar {
    enabled: boolean;
    backgroundColor?: string;
    textColor?: string;
    height?: number;
    items: HeaderTopBarItem[];
}

export interface HeaderElement {
    id: string;
    type: 'logo' | 'menu' | 'search' | 'cart' | 'account' | 'wishlist' | 'currency' | 'custom';
    menuId?: string; // Reference to Menu._id
    width?: number; // Grid units out of 12
    settings?: {
        logoUrl?: string;
        logoHeight?: number;
        logoAlt?: string;
        searchPlaceholder?: string;
        searchButtonText?: string;
        showCartCount?: boolean;
        cartIconStyle?: 'default' | 'bag' | 'basket';
        showLoginRegister?: boolean;
        loginText?: string;
        registerText?: string;
        wishlistIconStyle?: 'default' | 'heart' | 'star';
        customHtml?: string;
        expandedForDesktop?: boolean;
        visibleOnMobile?: boolean; // For search
        showMobileOnly?: boolean; // For search
    };
    order: number;
}

export interface HeaderSectionPosition {
    id: string;
    position: 'left' | 'center' | 'right';
    items: HeaderElement[];
}

export interface HeaderRow {
    id: string;
    order: number;
    backgroundColor?: string;
    height?: number;
    padding?: number;
    visibleOn?: Array<'desktop' | 'tablet' | 'mobile'>;
    sections: HeaderSectionPosition[];
}

export interface HeaderMainConfig {
    layout: 'default' | 'centered' | 'split' | 'minimal' | 'custom';
    backgroundColor?: string;
    height?: number;
    sticky?: boolean;
    stickyRow?: 'all' | 'first' | 'second' | 'none';
    transparent?: boolean;
    rows: HeaderRow[];
    // Deprecated: kept for backward compatibility
    sections?: HeaderSectionPosition[];
}

export interface FooterElement {
    id: string;
    type: 'menu' | 'text' | 'html' | 'newsletter' | 'social' | 'contact' | 'payment-methods';
    menuId?: string;
    content?: string;
    settings?: {
        newsletterTitle?: string;
        newsletterPlaceholder?: string;
        newsletterButtonText?: string;
        newsletterDescription?: string;
        socialTitle?: string;
        paymentMethodsTitle?: string;
        socialLinks?: Array<{
            id: string;
            platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'pinterest' | 'tiktok';
            url: string;
        }>;
        contactInfo?: {
            title?: string;
            address?: string;
            phone?: string;
            email?: string;
            workingHours?: string;
            showIcon?: boolean;
        };
        paymentMethods?: Array<{
            id: string;
            name: string;
            icon: string;
        }>;
    };
}

export interface FooterColumn {
    id: string;
    title?: string;
    width: number;
    items: FooterElement[];
    settings?: {
        contentAlign?: {
            desktop?: 'left' | 'center' | 'right';
            tablet?: 'left' | 'center' | 'right';
            mobile?: 'left' | 'center' | 'right';
        };
    };
}

export interface FooterRowSettings {
    position?: 'left' | 'center' | 'right';
    headingFontFamily?: string;
    headingFontSize?: number;
    headingAlign?: 'left' | 'center' | 'right';
    headingColor?: string;
    columnGap?: number;
    rowPaddingTop?: number;
    rowPaddingBottom?: number;
    showBorder?: boolean;
    borderColor?: string;
    showPadding?: boolean;
}

export interface FooterRow {
    id: string;
    columns: FooterColumn[];
    settings?: FooterRowSettings;
}

export interface FooterSection {
    id: string;
    type: 'columns' | 'bottom-bar';
    backgroundColor?: string;
    textColor?: string;
    padding?: number;
    columns?: FooterColumn[];
    rows?: FooterRow[];
    bottomBarContent?: string;
    showTopBorder?: boolean;
    borderColor?: string;
    borderPadding?: number;
}

export interface FooterConfig {
    sections: FooterSection[];
}



export interface ThemeConfig {
    templateId: string;
    header?: {
        topBar?: HeaderTopBar;
        main: HeaderMainConfig;
        mobileMenu?: {
            enabled: boolean;
            menuId: string;
        };
    };
    footer?: FooterConfig;
    productCard?: ProductCardConfig;
    category?: CategoryConfig;
    product?: ProductPageConfig;
    compare?: CompareConfig;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
    };
    customScripts?: {
        header?: string;
        footer?: string;
    };
    scrollToTop?: {
        enabled: boolean;
        position: 'bottom-left' | 'bottom-center' | 'bottom-right';
        xAxis: number;
        yAxis: number;
        colors: {
            icon: string;
            background: string;
        };
        borderRadius: number;
    };
}

export interface Theme {
    _id: string;
    name: string;
    slug: string;
    version: string;
    description?: string;
    thumbnail?: string;
    author: string;
    isSystem: boolean;
    isActive: boolean;
    colors: Record<string, string>;
    typography: {
        headings: { fontFamily: string; fontWeight: string };
        body: { fontFamily: string; fontWeight: string };
    };
    createdAt: string;
    updatedAt: string;
}
