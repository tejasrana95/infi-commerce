'use client';

// ============================================
// Google Analytics 4 Core Library
// ============================================

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

// ============================================
// Types
// ============================================

export interface GAItem {
    item_id: string;
    item_name: string;
    price?: number;
    quantity?: number;
    item_category?: string;
    item_brand?: string;
    item_variant?: string;
    index?: number;
}

export interface GAEventParams {
    [key: string]: string | number | boolean | undefined;
}

// ============================================
// Debug Logging (only in development)
// ============================================

const isDev = process.env.NODE_ENV === 'development';

function debugLog(...args: any[]): void {
    if (isDev) {
        console.log(...args);
    }
}

// ============================================
// Initialize GA4
// ============================================

let isInitialized = false;
let measurementId = '';

export function initGA(trackingId: string): void {
    if (isInitialized || typeof window === 'undefined') return;

    measurementId = trackingId;

    // Create script element
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', trackingId, {
        send_page_view: false, // We'll handle page views manually
    });

    isInitialized = true;
    debugLog('[GA] Initialized with ID:', trackingId);
}

// ============================================
// Check if GA is ready
// ============================================

export function isGAReady(): boolean {
    return isInitialized && typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// ============================================
// Track Page View
// ============================================

export function pageview(url: string, title?: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'page_view', {
        page_path: url,
        page_title: title || document.title,
        page_location: window.location.href,
    });

    debugLog('[GA] Page view:', url);
}

// ============================================
// Generic Event Tracking
// ============================================

export function track(eventName: string, params?: GAEventParams): void {
    if (!isGAReady()) return;

    window.gtag('event', eventName, params);
    debugLog('[GA] Event:', eventName, params);
}

// ============================================
// E-commerce Events
// ============================================

export function trackViewItem(item: GAItem, currency: string = 'USD'): void {
    if (!isGAReady()) return;

    window.gtag('event', 'view_item', {
        currency,
        value: item.price || 0,
        items: [item],
    });

    debugLog('[GA] View item:', item.item_name);
}

export function trackViewItemList(
    items: GAItem[],
    listName: string = 'Product List',
    currency: string = 'USD'
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'view_item_list', {
        currency,
        item_list_name: listName,
        items,
    });

    debugLog('[GA] View item list:', listName, items.length, 'items');
}

export function trackAddToCart(
    item: GAItem,
    currency: string = 'USD'
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'add_to_cart', {
        currency,
        value: (item.price || 0) * (item.quantity || 1),
        items: [item],
    });

    debugLog('[GA] Add to cart:', item.item_name);
}

export function trackRemoveFromCart(
    item: GAItem,
    currency: string = 'USD'
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'remove_from_cart', {
        currency,
        value: (item.price || 0) * (item.quantity || 1),
        items: [item],
    });

    debugLog('[GA] Remove from cart:', item.item_name);
}

export function trackViewCart(
    items: GAItem[],
    value: number,
    currency: string = 'USD'
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'view_cart', {
        currency,
        value,
        items,
    });

    debugLog('[GA] View cart:', items.length, 'items, value:', value);
}

export function trackBeginCheckout(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    coupon?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'begin_checkout', {
        currency,
        value,
        items,
        coupon,
    });

    debugLog('[GA] Begin checkout, value:', value);
}

export function trackAddShippingInfo(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    shippingTier?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'add_shipping_info', {
        currency,
        value,
        items,
        shipping_tier: shippingTier,
    });

    debugLog('[GA] Add shipping info');
}

export function trackAddPaymentInfo(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    paymentType?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'add_payment_info', {
        currency,
        value,
        items,
        payment_type: paymentType,
    });

    debugLog('[GA] Add payment info');
}

export function trackPurchase(
    transactionId: string,
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    tax?: number,
    shipping?: number,
    coupon?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        currency,
        value,
        tax,
        shipping,
        coupon,
        items,
    });

    debugLog('[GA] Purchase:', transactionId, 'value:', value);
}

export function trackSearch(searchTerm: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'search', {
        search_term: searchTerm,
    });

    debugLog('[GA] Search:', searchTerm);
}

export function trackLogin(method?: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'login', {
        method,
    });

    debugLog('[GA] Login:', method);
}

export function trackSignUp(method?: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'sign_up', {
        method,
    });

    debugLog('[GA] Sign up:', method);
}

// ============================================
// Utility: Build GA Item from DOM data attributes
// ============================================

export function buildGAItemFromElement(el: HTMLElement): GAItem | null {
    const itemId = el.dataset.itemId;
    const itemName = el.dataset.itemName;

    if (!itemId || !itemName) return null;

    return {
        item_id: itemId,
        item_name: itemName,
        price: el.dataset.price ? parseFloat(el.dataset.price) : undefined,
        quantity: el.dataset.quantity ? parseInt(el.dataset.quantity, 10) : 1,
        item_category: el.dataset.category,
        item_brand: el.dataset.brand,
        item_variant: el.dataset.variant,
    };
}

// ============================================
// Navigation & Interaction Tracking
// ============================================

/**
 * Track navigation/link clicks
 * @param linkText - The text/label of the link
 * @param linkUrl - The destination URL
 * @param linkType - Type of link (menu, footer, button, etc.)
 * @param category - Optional category for grouping
 */
export function trackNavigation(
    linkText: string,
    linkUrl: string,
    linkType: 'menu' | 'footer' | 'header' | 'button' | 'cta' | 'breadcrumb' | 'other' = 'other',
    category?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'navigation_click', {
        link_text: linkText,
        link_url: linkUrl,
        link_type: linkType,
        link_category: category,
    });

    debugLog('[GA] Navigation:', linkType, '-', linkText, '→', linkUrl);
}

/**
 * Track menu item clicks
 * @param menuLabel - The menu item label
 * @param menuUrl - The destination URL
 * @param menuType - Type of menu item
 * @param menuPosition - Position in menu (e.g., 'header', 'mobile', 'footer')
 */
export function trackMenuClick(
    menuLabel: string,
    menuUrl: string,
    menuType: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'dropdown' = 'link',
    menuPosition: 'header' | 'mobile' | 'footer' | 'sidebar' = 'header'
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'menu_click', {
        menu_label: menuLabel,
        menu_url: menuUrl,
        menu_type: menuType,
        menu_position: menuPosition,
    });

    debugLog('[GA] Menu click:', menuPosition, '-', menuLabel, '→', menuUrl);
}

/**
 * Track button clicks
 * @param buttonText - The button text/label
 * @param buttonAction - What the button does
 * @param buttonLocation - Where the button is located
 */
export function trackButtonClick(
    buttonText: string,
    buttonAction: string,
    buttonLocation?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'button_click', {
        button_text: buttonText,
        button_action: buttonAction,
        button_location: buttonLocation,
    });

    debugLog('[GA] Button click:', buttonText, '-', buttonAction);
}

/**
 * Track generic link clicks
 * @param linkText - The link text
 * @param linkUrl - The destination URL
 * @param linkContext - Where the link appears
 */
export function trackLinkClick(
    linkText: string,
    linkUrl: string,
    linkContext?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'link_click', {
        link_text: linkText,
        link_url: linkUrl,
        link_context: linkContext,
    });

    debugLog('[GA] Link click:', linkText, '→', linkUrl);
}

/**
 * Track external link clicks
 * @param linkText - The link text
 * @param linkUrl - The external URL
 */
export function trackExternalLink(linkText: string, linkUrl: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'external_link_click', {
        link_text: linkText,
        link_url: linkUrl,
        outbound: true,
    });

    debugLog('[GA] External link:', linkText, '→', linkUrl);
}

/**
 * Automatically track clicks on elements with data-ga-track attribute
 * Usage: <button data-ga-track="button" data-ga-action="subscribe" data-ga-label="Newsletter">Subscribe</button>
 */
export function initAutoTracking(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const trackableElement = target.closest('[data-ga-track]') as HTMLElement;

        if (!trackableElement) return;

        const trackType = trackableElement.dataset.gaTrack;
        const action = trackableElement.dataset.gaAction || 'click';
        const label = trackableElement.dataset.gaLabel || trackableElement.textContent?.trim() || 'Unknown';
        const category = trackableElement.dataset.gaCategory;

        switch (trackType) {
            case 'button':
                trackButtonClick(label, action, category);
                break;
            case 'link':
                const href = trackableElement.getAttribute('href') || '#';
                trackLinkClick(label, href, category);
                break;
            case 'menu':
                const menuHref = trackableElement.getAttribute('href') || '#';
                trackMenuClick(label, menuHref, 'link', category as any);
                break;
            default:
                track(action, { label, category });
        }
    });

    debugLog('[GA] Auto-tracking initialized');
}
