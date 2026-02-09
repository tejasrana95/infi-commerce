'use client';

// ============================================
// Google Analytics 4 - Comprehensive Auto-Tracking
// ============================================
// 
// USAGE:
// 1. Add 'infi-track' class to any element you want to track
// 2. Use data-ga-* attributes for context (inherited from parents)
//
// Attributes:
// - data-ga-location: Where the element is (header, footer, product_page, etc.)
// - data-ga-category: Category for grouping (navigation, product, cart, etc.)
// - data-ga-action: Specific action (add_to_cart, buy_now, etc.)
// - data-ga-label: Custom label (defaults to element text)
// - data-ga-value: Numeric value or ID
//
// Examples:
// <header data-ga-location="header" data-ga-category="navigation">
//   <Link href="/" className="infi-track">Home</Link>
// </header>
//
// <div data-ga-location="product_card" data-ga-category="product" data-ga-value={productId}>
//   <button className="infi-track" data-ga-action="add_to_cart">Add to Cart</button>
// </div>
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

interface AutoTrackData {
    location: string;
    category?: string;
    action: string;
    label: string;
    destination?: string;
    value?: string;
    widget?: string;  // Module/widget name for grouping (e.g., 'hero-slider', 'product-carousel')
    elementType: string;
}

// ============================================
// State
// ============================================

let isInitialized = false;
let measurementId = '';
let autoTrackingInitialized = false;
const isDev = process.env.NODE_ENV === 'development';

function debugLog(...args: any[]): void {
    if (isDev) {
        console.log('[GA]', ...args);
    }
}

// ============================================
// Initialize GA4
// ============================================

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
        send_page_view: false, // We handle page views
    });

    isInitialized = true;
    debugLog('Initialized with ID:', trackingId);

    // Auto-initialize tracking
    initAutoTracking();
}

export function isGAReady(): boolean {
    return isInitialized && typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// ============================================
// Page View Tracking
// ============================================

export function pageview(url: string, title?: string): void {
    if (!isGAReady()) return;

    window.gtag('event', 'page_view', {
        page_path: url,
        page_title: title || document.title,
        page_location: window.location.href,
    });

    debugLog('Page view:', url);
}

// ============================================
// Generic Event Tracking
// ============================================

export function track(eventName: string, params?: GAEventParams): void {
    if (!isGAReady()) return;
    window.gtag('event', eventName, params);
    debugLog('Event:', eventName, params);
}

// ============================================
// E-commerce Events (Remain manual for data accuracy)
// ============================================

export function trackViewItem(item: GAItem, currency: string = 'USD'): void {
    if (!isGAReady()) return;
    window.gtag('event', 'view_item', {
        currency,
        value: item.price || 0,
        items: [item],
    });
    debugLog('View item:', item.item_name);
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
    debugLog('View item list:', listName, items.length, 'items');
}

export function trackAddToCart(item: GAItem, currency: string = 'USD'): void {
    if (!isGAReady()) return;
    window.gtag('event', 'add_to_cart', {
        currency,
        value: (item.price || 0) * (item.quantity || 1),
        items: [item],
    });
    debugLog('Add to cart:', item.item_name);
}

export function trackRemoveFromCart(item: GAItem, currency: string = 'USD'): void {
    if (!isGAReady()) return;
    window.gtag('event', 'remove_from_cart', {
        currency,
        value: (item.price || 0) * (item.quantity || 1),
        items: [item],
    });
    debugLog('Remove from cart:', item.item_name);
}

export function trackViewCart(items: GAItem[], value: number, currency: string = 'USD'): void {
    if (!isGAReady()) return;
    window.gtag('event', 'view_cart', { currency, value, items });
    debugLog('View cart:', items.length, 'items');
}

export function trackBeginCheckout(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    coupon?: string
): void {
    if (!isGAReady()) return;
    window.gtag('event', 'begin_checkout', { currency, value, items, coupon });
    debugLog('Begin checkout, value:', value);
}

export function trackAddShippingInfo(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    shippingTier?: string
): void {
    if (!isGAReady()) return;
    window.gtag('event', 'add_shipping_info', { currency, value, items, shipping_tier: shippingTier });
    debugLog('Add shipping info');
}

export function trackAddPaymentInfo(
    items: GAItem[],
    value: number,
    currency: string = 'USD',
    paymentType?: string
): void {
    if (!isGAReady()) return;
    window.gtag('event', 'add_payment_info', { currency, value, items, payment_type: paymentType });
    debugLog('Add payment info');
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
    debugLog('Purchase:', transactionId, 'value:', value);
}

export function trackSearch(searchTerm: string): void {
    if (!isGAReady()) return;
    window.gtag('event', 'search', { search_term: searchTerm });
    debugLog('Search:', searchTerm);
}

export function trackLogin(method?: string): void {
    if (!isGAReady()) return;
    window.gtag('event', 'login', { method });
    debugLog('Login:', method);
}

export function trackSignUp(method?: string): void {
    if (!isGAReady()) return;
    window.gtag('event', 'sign_up', { method });
    debugLog('Sign up:', method);
}

// ============================================
// AUTO-TRACKING SYSTEM
// ============================================

/**
 * Initialize automatic tracking for elements with 'infi-track' class
 * Uses event delegation for performance
 */
export function initAutoTracking(): void {
    if (typeof window === 'undefined' || autoTrackingInitialized) return;

    // Click tracking (buttons, links, interactive elements)
    document.addEventListener('click', handleAutoClick, { capture: true, passive: true });

    // Scroll tracking
    initScrollTracking();

    // Input change tracking (for selects, checkboxes)
    document.addEventListener('change', handleAutoChange, { capture: true, passive: true });

    // Form submit tracking
    document.addEventListener('submit', handleAutoSubmit, { capture: true });

    autoTrackingInitialized = true;
    debugLog('Auto-tracking initialized');
}

/**
 * Handle click events on trackable elements
 */
function handleAutoClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const trackable = target.closest('.infi-track') as HTMLElement;

    if (!trackable || !isGAReady()) return;

    const data = extractTrackingData(trackable);
    sendAutoTrackEvent(data);
}

/**
 * Handle change events (select, checkbox, radio)
 */
function handleAutoChange(event: Event): void {
    const target = event.target as HTMLElement;
    const trackable = target.closest('.infi-track') as HTMLElement;

    if (!trackable || !isGAReady()) return;

    const data = extractTrackingData(trackable);
    data.action = data.action || 'change';

    // Get the selected value
    if (target instanceof HTMLSelectElement) {
        data.label = `${data.label}: ${target.options[target.selectedIndex]?.text || target.value}`;
    } else if (target instanceof HTMLInputElement) {
        if (target.type === 'checkbox' || target.type === 'radio') {
            data.label = `${data.label}: ${target.checked ? 'on' : 'off'}`;
        }
    }

    sendAutoTrackEvent(data);
}

/**
 * Handle form submissions
 */
function handleAutoSubmit(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    const trackable = form.closest('.infi-track') as HTMLElement ||
        (form.classList.contains('infi-track') ? form : null);

    if (!trackable || !isGAReady()) return;

    const data = extractTrackingData(trackable);
    data.action = data.action || 'form_submit';
    data.elementType = 'form';

    sendAutoTrackEvent(data);
}

/**
 * Extract tracking data from element and its parent context
 */
function extractTrackingData(element: HTMLElement): AutoTrackData {
    const tagName = element.tagName.toLowerCase();
    const isLink = tagName === 'a';
    const isButton = tagName === 'button' || element.getAttribute('role') === 'button';
    const isInput = tagName === 'input' || tagName === 'select' || tagName === 'textarea';

    // Get inherited data attributes
    const location = findParentData(element, 'gaLocation') || inferLocation(element);
    const category = findParentData(element, 'gaCategory') || inferCategory(element);
    const value = element.dataset.gaValue || findParentData(element, 'gaValue');
    const widget = element.dataset.gaWidget || findParentData(element, 'gaWidget');

    // Get element-specific data
    const action = element.dataset.gaAction || inferAction(element);
    const label = element.dataset.gaLabel || getElementLabel(element);
    const destination = isLink ? element.getAttribute('href') || undefined : undefined;

    return {
        location,
        category,
        action,
        label,
        destination,
        value,
        widget,
        elementType: isLink ? 'link' : isButton ? 'button' : isInput ? 'input' : 'element',
    };
}

/**
 * Find data attribute by traversing up the DOM tree
 */
function findParentData(element: HTMLElement, attr: string): string | undefined {
    let current: HTMLElement | null = element;
    while (current) {
        const value = current.dataset[attr];
        if (value) return value;
        current = current.parentElement;
    }
    return undefined;
}

/**
 * Infer location from element context
 */
function inferLocation(element: HTMLElement): string {
    // Check common parent elements
    const header = element.closest('header');
    if (header) return 'header';

    const footer = element.closest('footer');
    if (footer) return 'footer';

    const nav = element.closest('nav');
    if (nav) return 'navigation';

    const modal = element.closest('[role="dialog"], .modal, [class*="Modal"]');
    if (modal) return 'modal';

    const sidebar = element.closest('aside, [class*="sidebar"], [class*="Sidebar"]');
    if (sidebar) return 'sidebar';

    const card = element.closest('[class*="Card"], [class*="card"]');
    if (card) return 'card';

    return 'page';
}

/**
 * Infer category from element context
 */
function inferCategory(element: HTMLElement): string | undefined {
    const form = element.closest('form');
    if (form) return 'form';

    const cart = element.closest('[class*="cart"], [class*="Cart"]');
    if (cart) return 'cart';

    const product = element.closest('[class*="product"], [class*="Product"]');
    if (product) return 'product';

    const checkout = element.closest('[class*="checkout"], [class*="Checkout"]');
    if (checkout) return 'checkout';

    return undefined;
}

/**
 * Infer action from element type and content
 */
function inferAction(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const text = (element.textContent || '').toLowerCase().trim();
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
    const combined = `${text} ${ariaLabel}`;

    // Link detection
    if (tagName === 'a') {
        const href = element.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
            return 'external_link';
        }
        if (href.startsWith('mailto:')) return 'email_link';
        if (href.startsWith('tel:')) return 'phone_link';
        return 'link_click';
    }

    // Button/interaction detection based on text
    if (combined.includes('add to cart') || combined.includes('addtocart')) return 'add_to_cart';
    if (combined.includes('buy now') || combined.includes('buynow')) return 'buy_now';
    if (combined.includes('wishlist')) return 'toggle_wishlist';
    if (combined.includes('compare')) return 'toggle_compare';
    if (combined.includes('quick view')) return 'quick_view';
    if (combined.includes('search')) return 'search';
    if (combined.includes('subscribe')) return 'subscribe';
    if (combined.includes('login') || combined.includes('sign in')) return 'login';
    if (combined.includes('register') || combined.includes('sign up')) return 'register';
    if (combined.includes('checkout')) return 'checkout';
    if (combined.includes('submit')) return 'submit';
    if (combined.includes('close') || combined.includes('×')) return 'close';
    if (combined.includes('remove') || combined.includes('delete')) return 'remove';
    if (combined.includes('increase') || text === '+') return 'increase';
    if (combined.includes('decrease') || text === '-' || text === '−') return 'decrease';
    if (combined.includes('next') || combined.includes('→')) return 'next';
    if (combined.includes('prev') || combined.includes('←')) return 'previous';
    if (combined.includes('filter')) return 'filter';
    if (combined.includes('sort')) return 'sort';
    if (combined.includes('share')) return 'share';
    if (combined.includes('copy')) return 'copy';
    if (combined.includes('download')) return 'download';
    if (combined.includes('expand') || combined.includes('show more')) return 'expand';
    if (combined.includes('collapse') || combined.includes('show less')) return 'collapse';

    return 'click';
}

/**
 * Get human-readable label from element
 */
function getElementLabel(element: HTMLElement): string {
    // Priority order for label
    const label =
        element.dataset.gaLabel ||
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent?.trim().slice(0, 100) ||
        element.getAttribute('alt') ||
        element.getAttribute('placeholder') ||
        element.getAttribute('name') ||
        'Unknown';

    return label.replace(/\s+/g, ' ').trim();
}

/**
 * Send auto-tracked event to GA
 */
function sendAutoTrackEvent(data: AutoTrackData): void {
    if (!isGAReady()) return;

    // Determine event name based on element type and action
    let eventName = 'interaction';

    if (data.elementType === 'link') {
        eventName = data.action === 'external_link' ? 'outbound_click' : 'navigation';
    } else if (data.elementType === 'button') {
        eventName = 'button_click';
    } else if (data.elementType === 'input') {
        eventName = 'input_change';
    } else if (data.elementType === 'form') {
        eventName = 'form_submit';
    }

    window.gtag('event', eventName, {
        action: data.action,
        label: data.label,
        location: data.location,
        category: data.category,
        widget: data.widget,
        destination: data.destination,
        value: data.value,
    });

    debugLog('Auto:', eventName, data);
}

// ============================================
// SCROLL TRACKING
// ============================================

let scrollMilestones = new Set<number>();
const SCROLL_THRESHOLDS = [25, 50, 75, 90, 100];

function initScrollTracking(): void {
    if (typeof window === 'undefined') return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                checkScrollMilestones();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Reset milestones on navigation (for SPAs)
    window.addEventListener('popstate', () => {
        scrollMilestones.clear();
    });
}

function checkScrollMilestones(): void {
    if (!isGAReady()) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) return;

    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    for (const threshold of SCROLL_THRESHOLDS) {
        if (scrollPercent >= threshold && !scrollMilestones.has(threshold)) {
            scrollMilestones.add(threshold);

            window.gtag('event', 'scroll', {
                percent_scrolled: threshold,
                page_path: window.location.pathname,
            });

            debugLog('Scroll milestone:', threshold + '%');
        }
    }
}

/**
 * Reset scroll tracking (call on page navigation in SPA)
 */
export function resetScrollTracking(): void {
    scrollMilestones.clear();
}

// ============================================
// SLIDER/CAROUSEL TRACKING
// ============================================

/**
 * Track slider/carousel interactions
 * Call this when slide changes
 */
export function trackSlideChange(
    sliderName: string,
    slideIndex: number,
    slideLabel?: string,
    location?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'slide_change', {
        slider_name: sliderName,
        slide_index: slideIndex,
        slide_label: slideLabel,
        location: location,
    });

    debugLog('Slide change:', sliderName, 'to', slideIndex);
}

/**
 * Track slider navigation (prev/next clicks)
 */
export function trackSliderNav(
    sliderName: string,
    direction: 'prev' | 'next',
    location?: string
): void {
    if (!isGAReady()) return;

    window.gtag('event', 'slider_navigation', {
        slider_name: sliderName,
        direction,
        location,
    });

    debugLog('Slider nav:', sliderName, direction);
}

// ============================================
// VIDEO TRACKING
// ============================================

/**
 * Track video interactions
 */
export function trackVideo(
    action: 'play' | 'pause' | 'complete' | 'progress',
    videoTitle: string,
    videoId?: string,
    currentTime?: number,
    duration?: number
): void {
    if (!isGAReady()) return;

    const percentComplete = duration && currentTime ? Math.round((currentTime / duration) * 100) : undefined;

    window.gtag('event', `video_${action}`, {
        video_title: videoTitle,
        video_id: videoId,
        video_current_time: currentTime,
        video_duration: duration,
        video_percent: percentComplete,
    });

    debugLog('Video:', action, videoTitle);
}

// ============================================
// ENGAGEMENT TRACKING
// ============================================

/**
 * Track time spent on page (call periodically or on visibility change)
 */
export function trackEngagement(timeOnPage: number): void {
    if (!isGAReady()) return;

    window.gtag('event', 'engagement', {
        engagement_time_msec: timeOnPage,
        page_path: window.location.pathname,
    });

    debugLog('Engagement:', timeOnPage, 'ms');
}

// ============================================
// UTILITY: Build GA Item from DOM
// ============================================

export function buildGAItemFromElement(el: HTMLElement): GAItem | null {
    const itemId = el.dataset.itemId || findParentData(el, 'itemId');
    const itemName = el.dataset.itemName || findParentData(el, 'itemName');

    if (!itemId || !itemName) return null;

    return {
        item_id: itemId,
        item_name: itemName,
        price: el.dataset.price ? parseFloat(el.dataset.price) : undefined,
        quantity: el.dataset.quantity ? parseInt(el.dataset.quantity, 10) : 1,
        item_category: el.dataset.category || findParentData(el, 'category'),
        item_brand: el.dataset.brand || findParentData(el, 'brand'),
        item_variant: el.dataset.variant || findParentData(el, 'variant'),
    };
}
