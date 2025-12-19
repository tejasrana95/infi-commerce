// Store Types for Frontend

// ============================================
// Theme Configuration Types
// ============================================

export interface ThemeColors {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    headerBg?: string;
    footerBg?: string;
}

export interface ThemeFonts {
    heading?: string;
    body?: string;
}

// ============================================
// Header Configuration Types
// ============================================

export interface HeaderTopBarItem {
    id: string;
    type: 'text' | 'link' | 'phone' | 'email' | 'social' | 'language' | 'currency';
    content?: string;
    label?: string;
    url?: string;
    icon?: string;
    position: 'left' | 'center' | 'right';
    order: number;
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
    type: 'logo' | 'menu' | 'search' | 'cart' | 'account' | 'wishlist' | 'html';
    settings?: Record<string, unknown>;
}

export interface HeaderSection {
    id: string;
    position: 'left' | 'center' | 'right';
    width?: number;
    items: HeaderElement[];
}

export interface HeaderMainConfig {
    layout: 'default' | 'centered' | 'split' | 'minimal' | 'custom';
    backgroundColor?: string;
    height?: number;
    sticky?: boolean;
    transparent?: boolean;
    sections: HeaderSection[];
}

export interface HeaderConfig {
    topBar?: HeaderTopBar;
    main: HeaderMainConfig;
    mobileMenu?: {
        enabled: boolean;
        menuId: string;
        _id?: string; // Sometimes _id is used
    };
}

// ============================================
// Footer Configuration Types
// ============================================

export interface FooterElement {
    id: string;
    type: 'menu' | 'text' | 'html' | 'newsletter' | 'social' | 'contact' | 'payment-methods';
    menuId?: string;
    content?: string;
    settings?: {
        // Newsletter settings
        newsletterTitle?: string;
        newsletterPlaceholder?: string;
        newsletterButtonText?: string;
        newsletterDescription?: string;
        // Social settings
        socialLinks?: Array<{
            id: string;
            platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'pinterest' | 'tiktok';
            url: string;
        }>;
        // Contact settings
        contactInfo?: {
            address?: string;
            phone?: string;
            email?: string;
            workingHours?: string;
        };
        // Payment methods
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
}

export interface FooterSection {
    id: string;
    type: 'columns' | 'bottom-bar';
    backgroundColor?: string;
    textColor?: string;
    padding?: number;
    columns?: FooterColumn[];
    rows?: Array<{ id: string; columns: FooterColumn[] }>;
    bottomBarContent?: string;
}

export interface FooterConfig {
    sections: FooterSection[];
}

// ============================================
// Product Card Configuration Types
// ============================================

export interface ProductCardConfig {
    // Card Design
    cardStyle: 'default' | 'minimal' | 'overlay' | 'horizontal' | 'bordered';

    // Image Settings
    imageAspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | 'auto';
    imageSize: 'small' | 'medium' | 'large';
    imageFit: 'cover' | 'contain';
    showImageHover: boolean;

    // Button Visibility
    showAddToCart: boolean;
    showBuyNow: boolean;
    showWishlist: boolean;
    showQuickView: boolean;
    showCompare: boolean;

    // Button Styles
    addToCartStyle: 'filled' | 'outlined' | 'text' | 'icon-only';
    buyNowStyle: 'filled' | 'outlined' | 'text';
    wishlistPosition: 'top-right' | 'top-left' | 'bottom';
    quickViewPosition: 'overlay' | 'top-right';

    // Typography
    titleLines: 1 | 2 | 3;
    titleFontSize: 'small' | 'medium' | 'large';
    titleFontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    priceFontSize: 'small' | 'medium' | 'large';

    // Display Options
    showBrand: boolean;
    showRating: boolean;
    showSalePercent: boolean;
    showStock: boolean;
    showSku: boolean;

    // Hover Effects
    hoverEffect: 'none' | 'zoom' | 'lift' | 'shadow' | 'overlay';

    // Spacing
    cardGap: number;
    cardPadding: number;
    cardBorderRadius: number;
}

// Default product card config
export const DEFAULT_PRODUCT_CARD_CONFIG: ProductCardConfig = {
    cardStyle: 'default',
    imageAspectRatio: '3:4',
    imageSize: 'medium',
    imageFit: 'cover',
    showImageHover: true,
    showAddToCart: true,
    showBuyNow: false,
    showWishlist: true,
    showQuickView: true,
    showCompare: false,
    addToCartStyle: 'filled',
    buyNowStyle: 'outlined',
    wishlistPosition: 'top-right',
    quickViewPosition: 'overlay',
    titleLines: 2,
    titleFontSize: 'medium',
    titleFontWeight: 'medium',
    priceFontSize: 'medium',
    showBrand: true,
    showRating: true,
    showSalePercent: true,
    showStock: false,
    showSku: false,
    hoverEffect: 'lift',
    cardGap: 16,
    cardPadding: 12,
    cardBorderRadius: 12,
};

// ============================================
// Theme Configuration
// ============================================

export interface ThemeConfig {
    templateId: string;
    colors?: ThemeColors;
    fonts?: ThemeFonts;
    header?: HeaderConfig;
    footer?: FooterConfig;
    productCard?: ProductCardConfig;
}

// ============================================
// Store Settings
// ============================================

export interface StoreSettings {
    emailNotifications?: boolean;
    orderNotifications?: boolean;
    maintenanceMode?: boolean;
    allowGuestCheckout?: boolean;
    requireEmailVerification?: boolean;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    taxEnabled?: boolean;
    taxRate?: number;
    shippingEnabled?: boolean;
}

export interface StoreSEO {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
}

export interface Currency {
    _id: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    isBaseCurrency: boolean;
    isActive: boolean;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// Main Store Interface
// ============================================

export interface Store {
    _id: string;
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo?: string;
    favicon?: string;
    currency: string;
    timezone: string;
    isActive: boolean;
    theme?: ThemeConfig;
    settings?: StoreSettings;
    seo?: StoreSEO;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// Context Types
// ============================================

export interface StoreContextType {
    store: Store | null;
    templateId: string;
    themeConfig: ThemeConfig | null;
    isLoading: boolean;
    error: Error | null;
    currentCurrency?: Currency;
    availableCurrencies?: Currency[];
    setCurrency?: (code: string) => void;
}

// Default template ID when none is set
export const DEFAULT_TEMPLATE_ID = 'modern-clean';
