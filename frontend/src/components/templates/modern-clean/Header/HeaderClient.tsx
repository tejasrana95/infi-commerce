'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CurrencySelector from '@/components/molecules/CurrencySelector';
import { useClickOutside } from '@/hooks/useClickOutside';

const SearchAutocomplete = dynamic(() => import('@/components/molecules/SearchAutocomplete'), {
    loading: () => <div style={{ height: '60px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }} />,
    ssr: false // Search is purely interactive and depends on browser localStorage/router
});

import styles from './style.module.scss';

interface HeaderClientProps {
    isSticky?: boolean;
    isTransparent?: boolean;
    cartCount: number;
    labels: {
        cart: string;
        wishlist: string;
        account: string;
        search: string;
    };
    themeColors: {
        accent: string;
    };
    searchPlaceholder: string;
    children: React.ReactNode;
}

/**
 * Client-side wrapper for Header interactive functionality
 * Handles: sticky scroll, search overlay, cart dropdown, mobile menu
 */
export default function HeaderClient({
    isSticky,
    isTransparent,
    cartCount,
    labels,
    themeColors,
    searchPlaceholder,
    children,
}: HeaderClientProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const cartTotal = 0;

    const searchRef = useRef<HTMLDivElement>(null);
    useClickOutside(searchRef, () => setSearchOpen(false));

    // Handle scroll for sticky/transparent behavior
    useEffect(() => {
        if (!isSticky && !isTransparent) return;

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSticky, isTransparent]);

    const headerClasses = [
        styles.header,
        isSticky ? styles.sticky : '',
        isTransparent ? styles.transparent : '',
        isScrolled ? styles.scrolled : '',
    ].filter(Boolean).join(' ');

    return (
        <header className={headerClasses}>
            {children}

            {/* Search Bar with Autocomplete - Rendered client-side for interactivity */}
            {searchOpen && (
                <div className={styles.searchBar} ref={searchRef}>
                    <SearchAutocomplete
                        placeholder={searchPlaceholder}
                        onClose={() => setSearchOpen(false)}
                        autoFocus
                    />
                </div>
            )}
        </header>
    );
}

// Export individual interactive button components
export function SearchButton({
    onClick,
    label
}: {
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            className={styles.actionBtn}
            onClick={onClick}
            aria-label={label}
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </button>
    );
}

export function CartButton({
    cartCount,
    label,
    accentColor,
}: {
    cartCount: number;
    label: string;
    accentColor: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const cartTotal = 0;
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setIsOpen(false));

    return (
        <div className={styles.cartWrapper} ref={ref}>
            <button
                className={styles.actionBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={label}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                    <span className={styles.badge} style={{ backgroundColor: accentColor }}>
                        {cartCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className={styles.cartDropdown}>
                    <div className={styles.cartHeader}>
                        <span>{label} ({cartCount})</span>
                    </div>
                    <div className={styles.cartBody}>
                        {cartCount === 0 ? (
                            <div className={styles.emptyCart}>
                                <p>Your cart is empty</p>
                                <Link href="/shop" className={styles.shopBtn}>
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.cartItems}>
                                <p>Cart items coming soon</p>
                            </div>
                        )}
                    </div>
                    {cartCount !== 0 && (
                        <div className={styles.cartFooter}>
                            <div className={styles.cartTotal}>
                                <span>Total:</span>
                                <span>{cartTotal}</span>
                            </div>
                            <Link href="/cart" className={styles.viewCartBtn}>
                                View Cart
                            </Link>
                            <Link href="/checkout" className={styles.checkoutBtn}>
                                Checkout
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function MobileMenuButton({
    onClick,
}: {
    onClick: () => void;
}) {
    return (
        <button
            className={styles.mobileMenuBtn}
            onClick={onClick}
            aria-label="Toggle menu"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
}

export function CurrencyWrapper() {
    return (
        <div className={styles.currencyWrapper}>
            <CurrencySelector />
        </div>
    );
}
