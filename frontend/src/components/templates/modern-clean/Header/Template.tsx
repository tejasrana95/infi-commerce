// Modern Clean Header - Fully dynamic, sections-based layout
// Renders elements based on config sections (left/center/right) - no hardcoded positions

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeaderTemplateProps } from '@/components/templates/core/Header/types';
import MenuBuilder from '@/components/core/MenuBuilder';
import { useStore } from '@/providers/StoreProvider';
import CurrencySelector from '@/components/molecules/CurrencySelector';
import styles from './style.module.scss';

export default function ModernCleanHeaderTemplate({
    storeName,
    topBar,
    search,
    isSticky,
    isTransparent,
    cartCount,
    wishlistCount,
    labels,
    themeColors,
    headerElements,
    mobileMenu,
    menus,
}: HeaderTemplateProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const cartTotal = 0;
    // Handle scroll for sticky/transparent behavior
    useEffect(() => {
        if (!isSticky && !isTransparent) return;

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSticky, isTransparent]);

    // Find sections
    const leftSection = headerElements.sections.find((s: any) => s.position === 'left');
    const centerSection = headerElements.sections.find((s: any) => s.position === 'center');
    const rightSection = headerElements.sections.find((s: any) => s.position === 'right');

    // Render individual element based on type
    const renderElement = (element: any) => {
        switch (element.type) {
            case 'logo':
                return (
                    <Link key={element.id} href="/" className={styles.logo}>
                        {(element.settings && element.settings?.logoUrl) ? (
                            <Image
                                src={element.settings?.logoUrl}
                                alt={element.settings?.logoAlt || storeName}
                                width={150}
                                height={40}
                                priority
                                style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
                            />
                        ) : (
                            <span className={styles.logoText}>{storeName}</span>
                        )}
                    </Link>
                );

            case 'menu':
                return element.menuId ? (
                    <MenuBuilder
                        key={element.id}
                        menuId={element.menuId}
                        initialData={menus?.[element.menuId]}
                        themeColors={themeColors}
                        className={styles.menuElement}
                    />
                ) : null;

            case 'search':
                return (
                    <button
                        key={element.id}
                        className={styles.actionBtn}
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-label={labels.search}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                );

            case 'account':
                return (
                    <Link key={element.id} href="/account" className={styles.actionBtn} aria-label={labels.account}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </Link>
                );

            case 'wishlist':
                return (
                    <Link key={element.id} href="/wishlist" className={styles.actionBtn} aria-label={labels.wishlist}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {wishlistCount > 0 && (
                            <span className={styles.badge} style={{ backgroundColor: themeColors.accent }}>
                                {wishlistCount}
                            </span>
                        )}
                    </Link>
                );

            case 'cart':
                return (
                    <div key={element.id} className={styles.cartWrapper}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setCartOpen(!cartOpen)}
                            aria-label={labels.cart}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className={styles.badge} style={{ backgroundColor: themeColors.accent }}>
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {cartOpen && (
                            <div className={styles.cartDropdown}>
                                <div className={styles.cartHeader}>
                                    <span>{labels.cart} ({cartCount})</span>
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
                                            {/* Cart items will go here */}
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

            case 'currency':
                return (
                    <div key={element.id} className={styles.currencyWrapper}>
                        <CurrencySelector />
                    </div>
                );

            default:
                return null;
        }
    };

    const headerClasses = [
        styles.header,
        isSticky ? styles.sticky : '',
        isTransparent ? styles.transparent : '',
        isScrolled ? styles.scrolled : '',
    ].filter(Boolean).join(' ');

    return (
        <header className={headerClasses}>
            {/* ... */}
            {/* ========== TOP BAR ========== */}
            {topBar.enabled && (
                <div
                    className={styles.topBar}
                    style={{
                        backgroundColor: topBar.backgroundColor || themeColors.primary,
                        color: topBar.textColor || '#fff'
                    }}
                >
                    <div className={styles.topBarContainer}>
                        {/* Left - Social */}
                        <div className={styles.topBarLeft}>
                            {topBar.socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    className={styles.socialIcon}
                                    aria-label={social.platform}
                                >
                                    <SocialIcon platform={social.platform} />
                                </a>
                            ))}
                        </div>

                        {/* Center - Message */}
                        <div className={styles.topBarCenter}>
                            {topBar.items.center.map((item) => (
                                <span key={item.id} className={styles.topBarText}>
                                    {item.content}
                                </span>
                            ))}
                        </div>

                        {/* Right - Contact */}
                        <div className={styles.topBarRight}>
                            {topBar.items.right.map((item) => (
                                <span key={item.id} className={styles.topBarText}>
                                    {item.content}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MAIN HEADER (Fully Dynamic Sections) ========== */}
            <div className={styles.mainHeader}>
                <div className={styles.container}>
                    <div className={styles.headerContent}>
                        {/* Mobile Menu Toggle */}
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* LEFT SECTION - Render all items dynamically */}
                        {leftSection && leftSection.items.length > 0 && (
                            <div className={styles.sectionLeft}>
                                {leftSection.items
                                    .sort((a: any, b: any) => a.order - b.order)
                                    .map((item: any) => renderElement(item))}
                            </div>
                        )}

                        {/* CENTER SECTION - Render all items dynamically */}
                        {centerSection && centerSection.items.length > 0 && (
                            <div className={styles.sectionCenter}>
                                {centerSection.items
                                    .sort((a: any, b: any) => a.order - b.order)
                                    .map((item: any) => renderElement(item))}
                            </div>
                        )}

                        {/* RIGHT SECTION - Render all items dynamically */}
                        {rightSection && rightSection.items.length > 0 && (
                            <div className={styles.sectionRight}>
                                {rightSection.items
                                    .sort((a: any, b: any) => a.order - b.order)
                                    .map((item: any) => renderElement(item))}
                            </div>
                        )}
                    </div>

                    {/* Search Bar - Expanded */}
                    {searchOpen && (
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={search.placeholder}
                                className={styles.searchInput}
                                autoFocus
                            />
                            <button className={styles.searchBtn}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== MOBILE MENU ========== */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <div className={styles.mobileMenuContent}>
                        {/* Mobile Menu Builder */}
                        {mobileMenu && (
                            <MenuBuilder
                                menuId={mobileMenu._id}
                                initialData={menus?.[mobileMenu._id]}
                                themeColors={themeColors}
                                className={styles.mobileNav}
                            />
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

// Social Icon Component
function SocialIcon({ platform }: { platform: string }) {
    const icons: Record<string, React.ReactElement> = {
        facebook: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
        instagram: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" /></svg>,
        twitter: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>,
        youtube: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>,
    };
    return icons[platform] || <span>{platform[0]}</span>;
}
