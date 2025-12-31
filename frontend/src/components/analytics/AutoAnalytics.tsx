'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useStore } from '@/providers/StoreProvider';
import {
    track,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackViewCart,
    trackSearch,
    buildGAItemFromElement,
    isGAReady,
} from '@/lib/ga';

// ============================================
// Standard GA4 E-commerce Event Mapping
// ============================================

const ECOMMERCE_EVENTS = new Set([
    'add_to_cart',
    'remove_from_cart',
    'view_cart',
    'begin_checkout',
    'add_shipping_info',
    'add_payment_info',
    'purchase',
    'view_item',
    'view_item_list',
    'select_item',
    'add_to_wishlist',
    'search',
]);

// ============================================
// AutoAnalytics Component
// ============================================

export default function AutoAnalytics() {
    const { isEnabled, isReady } = useAnalytics();
    const { currentCurrency } = useStore();
    const currency = currentCurrency?.code || 'USD';

    useEffect(() => {
        if (!isEnabled || !isReady) return;

        // ============================================
        // CLICK TRACKING
        // ============================================
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target) return;

            // Find element with data-track attribute
            const el = target.closest('[data-track]') as HTMLElement;
            if (!el) return;

            const eventName = el.dataset.track;
            if (!eventName) return;

            // Handle e-commerce events specially
            if (ECOMMERCE_EVENTS.has(eventName)) {
                handleEcommerceEvent(eventName, el, currency);
            } else {
                // Generic UI click tracking
                track('ui_click', {
                    action: eventName,
                    label: el.innerText?.slice(0, 50),
                    tag: el.tagName,
                    path: window.location.pathname,
                });
            }
        };

        // ============================================
        // FORM SUBMIT TRACKING
        // ============================================
        const handleSubmit = (e: Event) => {
            const form = e.target as HTMLFormElement;
            if (!form?.dataset.track) return;

            const formName = form.dataset.track;

            // Special handling for search forms
            if (formName === 'search') {
                const searchInput = form.querySelector('input[type="search"], input[name="q"], input[name="search"]') as HTMLInputElement;
                if (searchInput?.value) {
                    trackSearch(searchInput.value);
                }
            } else {
                track('form_submit', {
                    form: formName,
                    path: window.location.pathname,
                });
            }
        };

        // ============================================
        // SCROLL DEPTH TRACKING
        // ============================================
        const firedDepths = new Set<number>();
        const onScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;

            const scrolled = (window.scrollY / scrollHeight) * 100;

            [25, 50, 75, 100].forEach((depth) => {
                if (scrolled >= depth && !firedDepths.has(depth)) {
                    firedDepths.add(depth);
                    track('scroll_depth', {
                        percent: depth,
                        path: window.location.pathname,
                    });
                }
            });
        };

        // ============================================
        // Register Event Listeners
        // ============================================
        document.addEventListener('click', handleClick, { capture: true });
        document.addEventListener('submit', handleSubmit, { capture: true });
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            document.removeEventListener('click', handleClick, { capture: true });
            document.removeEventListener('submit', handleSubmit, { capture: true });
            window.removeEventListener('scroll', onScroll);
        };
    }, [isEnabled, isReady, currency]);

    return null;
}

// ============================================
// E-commerce Event Handler
// ============================================

function handleEcommerceEvent(eventName: string, el: HTMLElement, currency: string) {
    const item = buildGAItemFromElement(el);

    switch (eventName) {
        case 'add_to_cart':
            if (item) {
                trackAddToCart(item, currency);
            }
            break;

        case 'remove_from_cart':
            if (item) {
                trackRemoveFromCart(item, currency);
            }
            break;

        case 'view_cart':
            // For view_cart, we need multiple items - handled by CartProvider
            track('view_cart', { path: window.location.pathname });
            break;

        case 'begin_checkout':
            // For checkout, full items tracking handled by CheckoutPage
            track('begin_checkout', { path: window.location.pathname });
            break;

        case 'add_to_wishlist':
            if (item) {
                track('add_to_wishlist', {
                    currency,
                    value: item.price || 0,
                    items: JSON.stringify([item]),
                });
            }
            break;

        case 'select_item':
            if (item) {
                track('select_item', {
                    item_list_name: el.dataset.listName || 'Product List',
                    items: JSON.stringify([item]),
                });
            }
            break;

        default:
            // For other e-commerce events, track generically
            track(eventName, {
                path: window.location.pathname,
                item_id: el.dataset.itemId,
                item_name: el.dataset.itemName,
            });
    }
}
