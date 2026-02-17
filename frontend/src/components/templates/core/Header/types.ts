// Header Types - All data comes from API/Config

export interface NavLink {
    label: string;
    url: string;
    children?: NavLink[];
    isHighlighted?: boolean;
}

export interface TopBarItem {
    id: string;
    type: 'text' | 'link' | 'phone' | 'email' | 'social' | 'currency' | 'language';
    content?: string;
    label?: string;
    url?: string;
}

export interface SocialLink {
    platform: 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'pinterest';
    url: string;
}

export interface HeaderElements {
    showSearch: boolean;
    showLogo: boolean;
    showCart: boolean;
    showAccount: boolean;
    showWishlist: boolean;
    layout: string;
    rows?: any[];
    sections: any[]; // Deprecated: for backward compatibility
    themeColors?: ThemeColors;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export interface HeaderTemplateProps {
    // Store Info
    storeName: string;
    logo?: string;
    currency: string;

    // Navigation
    navLinks: NavLink[];
    secondaryLinks: NavLink[];

    // Top bar config
    topBar: {
        enabled: boolean;
        backgroundColor?: string;
        textColor?: string;
        items: {
            left: TopBarItem[];
            center: TopBarItem[];
            right: TopBarItem[];
        };
        socialLinks: SocialLink[];
    };

    // Search config
    search: {
        enabled: boolean;
        placeholder: string;
        categories: Array<{ label: string; value: string }>;
    };

    // Main header config
    isSticky?: boolean;
    backgroundColor?: string;

    // User/Cart state
    cartCount: number;
    cartTotal: string;
    wishlistCount: number;
    isLoggedIn: boolean;

    // Labels (for i18n)
    labels: {
        account: string;
        loginRegister: string;
        wishlist: string;
        cart: string;
        items: string;
        search: string;
        all: string;
    };

    // Theme colors
    accentColor: string;
    themeColors: ThemeColors;

    // Header element visibility
    headerElements: HeaderElements;

    // Header config (for sticky row behavior)
    headerConfig?: import('@/types').HeaderConfig;

    // Menus
    headerMenu?: import('@/types/menu').Menu;
    mobileMenu?: import('@/types/menu').Menu;
    menus?: Record<string, import('@/types/menu').Menu>; // SSR Enriched Menus

    // Layout Config
    mobileBreakpoint?: number;
}

// Default labels
export const DEFAULT_LABELS = {
    account: 'Account',
    loginRegister: 'Login / Register',
    wishlist: 'Wishlist',
    cart: 'Cart',
    items: 'Item(s)',
    search: 'Search here...',
    all: 'All',
};

// Default navigation links
export const DEFAULT_NAV_LINKS: NavLink[] = [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    { label: 'Categories', url: '/categories' },
];

export const DEFAULT_SECONDARY_LINKS: NavLink[] = [
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
];
