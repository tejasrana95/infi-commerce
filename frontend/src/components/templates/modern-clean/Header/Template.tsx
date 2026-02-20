// Modern Clean Header - Fully dynamic, sections-based layout
// Renders elements based on config sections (left/center/right) - no hardcoded positions

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeaderTemplateProps } from '@/components/templates/core/Header/types';
import MenuBuilder from '@/components/core/MenuBuilder';
import CartPopup from '@/components/core/CartPopup';
import { useStore } from '@/providers/StoreProvider';
import { useAuth } from '@/providers/AuthProvider';
import CurrencySelector from '@/components/molecules/CurrencySelector';
import SearchAutocomplete from '@/components/molecules/SearchAutocomplete';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './style.module.scss';

export default function ModernCleanHeaderTemplate({
    storeName,
    topBar,
    search,
    isSticky,
    cartCount,
    wishlistCount,
    labels,
    themeColors,
    headerElements,
    headerConfig,
    mobileMenu,
    menus,
    mobileBreakpoint = 768,
}: HeaderTemplateProps) {
    const MOBILE_MENU_ANIMATION_MS = 240;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const { isAuthenticated, customer, logout } = useAuth();
    const { store } = useStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [headerHeight, setHeaderHeight] = useState<number | undefined>(undefined);
    const [stickyRowFixed, setStickyRowFixed] = useState(false);
    const [stickyRowHeight, setStickyRowHeight] = useState(0);
    const headerRef = useRef<HTMLElement>(null);
    const stickyRowRef = useRef<HTMLDivElement>(null);
    const stickyPlaceholderRef = useRef<HTMLDivElement>(null);

    // Get mobile menu ID from store config
    const mobileMenuId = store?.theme?.header?.mobileMenu?.menuId;

    // Dynamic styles for configurable breakpoint
    const dynamicStyles = `
        @media (max-width: ${mobileBreakpoint}px) {
            .${styles.mainHeader}:not([data-visible-on~="mobile"]) { display: none !important; }

            /* Only hide center section where desktop menu usually lives */
            .${styles.sectionCenter} { display: none !important; }
            
            /* Explicitly hide any desktop menu components */
            .${styles.menuElement} { display: none !important; }
            
            /* Show hamburger */
            .${styles.mobileMenuBtn} { display: flex !important; }
            
            /* Ensure mobile menu drawer is visible when rendered */
            .${styles.mobileMenuOverlay} { display: flex !important; }
            
            /* Adjust logo size */
            .${styles.logo} img { height: 32px !important; }
            .${styles.logo} { min-height: 32px !important; }
        }
        
        @media (min-width: ${mobileBreakpoint + 1}px) and (max-width: 1024px) {
            .${styles.mainHeader}:not([data-visible-on~="tablet"]) { display: none !important; }

            .${styles.mobileMenuBtn} { display: none !important; }
            /* Restore desktop sections */
            .${styles.sectionCenter} { display: flex !important; }
            .${styles.menuElement} { display: block !important; }
            /* Hide mobile menu drawer even if state thinks it's open (edge case) */
            .${styles.mobileMenuOverlay} { display: none !important; }
        }

        @media (min-width: 1025px) {
            .${styles.mainHeader}:not([data-visible-on~="desktop"]) { display: none !important; }
            .${styles.mobileMenuOverlay} { display: none !important; }
        }
    `;
    const cartTotal = 0;

    // Refs for click outside
    const accountRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchBtnRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
    const mobileMenuCloseTimerRef = useRef<number | null>(null);

    const openMobileMenu = () => {
        if (mobileMenuCloseTimerRef.current) {
            window.clearTimeout(mobileMenuCloseTimerRef.current);
            mobileMenuCloseTimerRef.current = null;
        }
        setMobileMenuClosing(false);
        setMobileMenuOpen(true);
    };

    const closeMobileMenu = () => {
        if (!mobileMenuOpen || mobileMenuClosing) return;
        setMobileMenuClosing(true);
        mobileMenuCloseTimerRef.current = window.setTimeout(() => {
            setMobileMenuOpen(false);
            setMobileMenuClosing(false);
            mobileMenuCloseTimerRef.current = null;
        }, MOBILE_MENU_ANIMATION_MS);
    };

    const toggleMobileMenu = () => {
        if (mobileMenuOpen && !mobileMenuClosing) {
            closeMobileMenu();
            return;
        }
        openMobileMenu();
    };

    useClickOutside(accountRef, () => setAccountOpen(false));
    useClickOutside(cartRef, () => setCartOpen(false));
    // Don't use useClickOutside for search - handle it manually below
    // Close mobile menu only if click is outside menu AND outside the toggle button
    useClickOutside(mobileMenuRef, () => {
        if (!mobileMenuBtnRef.current?.contains(document.activeElement)) {
            closeMobileMenu();
        }
    });

    // Special handling for search toggle to avoid conflict with click-outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (searchOpen &&
                searchRef.current &&
                !searchRef.current.contains(event.target as Node) &&
                searchBtnRef.current &&
                !searchBtnRef.current.contains(event.target as Node)
            ) {
                setSearchOpen(false);
            }
        };

        if (searchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [searchOpen]);

    // Special handling for mobile menu toggle to avoid conflict with click-outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (mobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                mobileMenuBtnRef.current &&
                !mobileMenuBtnRef.current.contains(event.target as Node)
            ) {
                closeMobileMenu();
            }
        };

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [mobileMenuOpen]);

    // Prevent background scroll when mobile drawer is open
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        return () => {
            if (mobileMenuCloseTimerRef.current) {
                window.clearTimeout(mobileMenuCloseTimerRef.current);
            }
        };
    }, []);

    // Handle scroll for sticky behavior
    const stickyRowSetting = headerConfig?.main?.stickyRow;
    const needsHeaderSticky = isSticky && !stickyRowSetting;
    const needsRowSticky = !!stickyRowSetting && stickyRowSetting !== 'none';

    useEffect(() => {
        const handleScroll = () => {
            // Header-level sticky (old behavior)
            if (needsHeaderSticky) {
                const nextIsScrolled = window.scrollY > 10;
                setIsScrolled(prev => (prev === nextIsScrolled ? prev : nextIsScrolled));
            } else {
                setIsScrolled(prev => (prev ? false : prev));
            }

            // Row-level sticky: fix the target row when it reaches viewport top
            if (needsRowSticky && stickyRowRef.current) {
                const el = stickyRowRef.current;
                // Get the original top position from the placeholder if it exists,
                // otherwise from the element itself
                const placeholder = stickyPlaceholderRef.current;
                const originalTop = placeholder
                    ? placeholder.getBoundingClientRect().top + window.scrollY
                    : el.getBoundingClientRect().top + window.scrollY;

                const shouldFixRow = window.scrollY >= originalTop;
                if (shouldFixRow) {
                    const nextHeight = el.offsetHeight;
                    setStickyRowHeight(prev => (prev === nextHeight ? prev : nextHeight));
                }
                setStickyRowFixed(prev => (prev === shouldFixRow ? prev : shouldFixRow));
            } else {
                setStickyRowFixed(prev => (prev ? false : prev));
                setStickyRowHeight(prev => (prev === 0 ? prev : 0));
            }
        };

        if (!needsHeaderSticky && !needsRowSticky) {
            handleScroll();
            return;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [needsHeaderSticky, needsRowSticky]);

    useEffect(() => {
        if (!needsRowSticky) {
            setStickyRowFixed(prev => (prev ? false : prev));
            setStickyRowHeight(prev => (prev === 0 ? prev : 0));
        }
    }, [needsRowSticky]);

    useEffect(() => {
        if (!needsHeaderSticky) {
            setIsScrolled(prev => (prev ? false : prev));
        }
    }, [needsHeaderSticky]);

    // Measure header height to prevent layout shift when it becomes fixed
    useEffect(() => {
        const updateHeight = () => {
            if (headerRef.current && !isScrolled) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [isScrolled]);

    // Support both new rows format and legacy sections format
    const rows = headerElements.rows && headerElements.rows.length > 0
        ? headerElements.rows
        : headerElements.sections && headerElements.sections.length > 0
            ? [{ id: 'row-1', order: 0, sections: headerElements.sections }]
            : [];

    // Render individual element based on type
    const renderElement = (element: any) => {
        if (!element) return null;
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
                        themeColors={themeColors}
                        className={styles.menuElement}
                    />
                ) : null;

            case 'search':
                const isExpandedForDesktop = element.settings?.expandedForDesktop ?? false;
                const showMobileOnly = element.settings?.showMobileOnly ?? false;

                // Mobile-only search
                if (showMobileOnly) {
                    return (
                        <button
                            key={element.id}
                            ref={searchBtnRef}
                            className={`${styles.actionBtn} ${styles.mobileOnlyBtn} infi-track`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchOpen(prev => !prev);
                            }}
                            aria-label={labels.search}
                            data-ga-action={searchOpen ? 'close_search' : 'open_search'}
                            data-ga-label="Search"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    );
                }

                // Not expanded for desktop - just show search button
                if (!isExpandedForDesktop) {
                    return (
                        <button
                            key={element.id}
                            ref={searchBtnRef}
                            className={`${styles.actionBtn} infi-track`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchOpen(prev => !prev);
                            }}
                            aria-label={labels.search}
                            data-ga-action={searchOpen ? 'close_search' : 'open_search'}
                            data-ga-label="Search"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    );
                }

                // Expanded for desktop - render both inline search (desktop) and button (mobile) via CSS
                return (
                    <div key={element.id} className={styles.searchWrapper} ref={searchRef}>
                        {/* Inline search - visible on desktop via CSS media query */}
                        <div className={styles.inlineSearchContainer}>
                            <SearchAutocomplete
                                placeholder={element.settings?.searchPlaceholder || 'Search products...'}
                                onClose={() => setSearchOpen(false)}
                                autoFocus={false}
                            />
                        </div>
                        {/* Search button - visible on mobile via CSS media query */}
                        <button
                            ref={searchBtnRef}
                            className={`${styles.actionBtn} ${styles.searchBtn} infi-track`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchOpen(prev => !prev);
                            }}
                            aria-label={labels.search}
                            data-ga-action={searchOpen ? 'close_search' : 'open_search'}
                            data-ga-label="Search"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                );

            case 'account':
                return (
                    <div key={element.id} className={styles.accountWrapper} ref={accountRef} data-ga-location="header" data-ga-widget="account_menu">
                        <button
                            className={`${styles.actionBtn} infi-track`}
                            onClick={() => {
                                setAccountOpen(!accountOpen);
                            }}
                            aria-label={labels.account}
                            data-ga-action={accountOpen ? 'close_account' : 'open_account'}
                            data-ga-label="Account Menu"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>

                        {accountOpen && (
                            <div className={styles.accountDropdown}>
                                {isAuthenticated && customer ? (
                                    <>
                                        <div className={styles.accountHeader}>
                                            <p>Welcome back,</p>
                                            <strong>{customer.firstName} {customer.lastName}</strong>
                                        </div>
                                        <ul className={styles.accountMenu}>
                                            <li>
                                                <Link
                                                    href="/account"
                                                    className={`${styles.accountMenuItem} infi-track`}
                                                    onClick={() => setAccountOpen(false)}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    My Account
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/account/orders" className={`${styles.accountMenuItem} infi-track`} onClick={() => setAccountOpen(false)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                    Orders
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/account/profile" className={`${styles.accountMenuItem} infi-track`} onClick={() => setAccountOpen(false)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Profile
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/account/addresses" className={`${styles.accountMenuItem} infi-track`} onClick={() => setAccountOpen(false)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Address
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/wishlist" className={`${styles.accountMenuItem} infi-track`} onClick={() => setAccountOpen(false)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                    Wishlist
                                                </Link>
                                            </li>
                                            <li>
                                                <button className={`${styles.accountMenuItem} ${styles.signOut} infi-track`} onClick={() => { logout(); setAccountOpen(false); }} data-ga-action="logout">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                    Sign Out
                                                </button>
                                            </li>
                                        </ul>
                                    </>
                                ) : (
                                    <div className={styles.authButtons}>
                                        <Link href="/login" className={`${styles.loginBtn} infi-track`} onClick={() => setAccountOpen(false)}>
                                            Login
                                        </Link>
                                        <Link href="/register" className={`${styles.registerBtn} infi-track`} onClick={() => setAccountOpen(false)}>
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'wishlist':
                return (
                    <Link key={element.id} href="/wishlist" className={`${styles.actionBtn} infi-track`} aria-label={labels.wishlist}>
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
                    <div key={element.id} className={styles.cartWrapper} ref={cartRef} data-ga-location="header" data-ga-widget="cart">
                        <button
                            className={`${styles.actionBtn} infi-track`}
                            onClick={() => {
                                setCartOpen(!cartOpen);
                            }}
                            aria-label={labels.cart}
                            data-ga-action={cartOpen ? 'close_cart' : 'open_cart'}
                            data-ga-label="Cart"
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
                        {cartOpen && <CartPopup onClose={() => setCartOpen(false)} />}
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
        needsHeaderSticky ? styles.sticky : '',
        (needsHeaderSticky && isScrolled) ? styles.scrolled : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={styles.headerWrapper}
            style={{ minHeight: isScrolled ? `${headerHeight}px` : 'auto' }}
        >
            <header className={headerClasses} ref={headerRef}>
                <style>{dynamicStyles}</style>
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
                {rows.map((row: any) => {
                    const leftSection = row.sections.find((s: any) => s.position === 'left');
                    const centerSection = row.sections.find((s: any) => s.position === 'center');
                    const rightSection = row.sections.find((s: any) => s.position === 'right');

                    // Determine if this row is the sticky target
                    const isTargetSticky = needsRowSticky && (
                        stickyRowSetting === 'all' ||
                        (stickyRowSetting === 'first' && row.order === 0) ||
                        (stickyRowSetting === 'second' && row.order === 1)
                    );

                    // Make second row more compact
                    const isSecondRow = row.order === 1;

                    // Check if this row contains an expanded search (for z-index)
                    const hasExpandedSearch = row.sections.some((section: any) =>
                        (section.items || []).some((item: any) =>
                            item && item.type === 'search' && item.settings?.expandedForDesktop
                        )
                    );

                    const rowContent = (
                        <div
                            ref={isTargetSticky ? stickyRowRef : undefined}
                            data-visible-on={(row.visibleOn && row.visibleOn.length > 0 ? row.visibleOn : ['desktop', 'tablet', 'mobile']).join(' ')}
                            className={`${styles.mainHeader} ${isSecondRow ? styles.compactRow : ''} ${isTargetSticky && stickyRowFixed ? styles.fixedRow : ''}`}
                            style={{
                                backgroundColor: row.backgroundColor || 'var(--color-header-bg, white)',
                                minHeight: row.height ? `${row.height}px` : (isSecondRow ? '50px' : undefined),
                                zIndex: hasExpandedSearch ? 1001 : undefined,
                            }}
                        >
                            <div className={styles.container}>
                                <div className={styles.headerContent}>
                                    {/* Mobile Menu Toggle - Only in first row */}
                                    {row.order === 0 && (
                                        <button
                                            ref={mobileMenuBtnRef}
                                            className={styles.mobileMenuBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMobileMenu();
                                            }}
                                            aria-label="Toggle menu"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* LEFT SECTION */}
                                    {leftSection && leftSection.items.length > 0 && (
                                        <div className={styles.sectionLeft}>
                                            {leftSection.items
                                                .filter((item: any) => item)
                                                .sort((a: any, b: any) => a.order - b.order)
                                                .map((item: any) => renderElement(item))}
                                        </div>
                                    )}

                                    {/* CENTER SECTION */}
                                    {centerSection && centerSection.items.length > 0 && (
                                        <div className={styles.sectionCenter}>
                                            {centerSection.items
                                                .filter((item: any) => item)
                                                .sort((a: any, b: any) => a.order - b.order)
                                                .map((item: any) => renderElement(item))}
                                        </div>
                                    )}

                                    {/* RIGHT SECTION */}
                                    {rightSection && rightSection.items.length > 0 && (
                                        <div className={styles.sectionRight}>
                                            {rightSection.items
                                                .filter((item: any) => item)
                                                .sort((a: any, b: any) => a.order - b.order)
                                                .map((item: any) => renderElement(item))}
                                        </div>
                                    )}
                                </div>

                                {/* Search Bar - Only in first row */}
                                {row.order === 0 && searchOpen && (
                                    <div className={styles.searchBar} ref={searchRef}>
                                        <SearchAutocomplete
                                            placeholder={search.placeholder}
                                            onClose={() => setSearchOpen(false)}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                    // Add a placeholder div when this row becomes fixed to prevent layout jump
                    if (isTargetSticky) {
                        return (
                            <React.Fragment key={row.id}>
                                {stickyRowFixed && (
                                    <div
                                        ref={stickyPlaceholderRef}
                                        style={{ height: `${stickyRowHeight}px` }}
                                    />
                                )}
                                {rowContent}
                            </React.Fragment>
                        );
                    }

                    return <React.Fragment key={row.id}>{rowContent}</React.Fragment>;
                })}

                {/* ========== MOBILE MENU ========== */}
                {mobileMenuOpen && (
                    <div
                        className={`${styles.mobileMenuOverlay} ${mobileMenuClosing ? styles.closing : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <div className={styles.mobileMenu} ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.mobileMenuHeader}>
                                <div>
                                    <p className={styles.mobileMenuEyebrow}>Navigation</p>
                                    <h3 className={styles.mobileMenuTitle}>{storeName}</h3>
                                </div>
                                <button
                                    className={styles.mobileMenuClose}
                                    onClick={closeMobileMenu}
                                    aria-label="Close menu"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6l-12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className={styles.mobileMenuContent}>
                                {mobileMenuId ? (
                                    <MenuBuilder
                                        menuId={mobileMenuId}
                                        themeColors={themeColors}
                                        className={styles.mobileNav}
                                    />
                                ) : (
                                    <div className={styles.mobileMenuFallback}>
                                        <p>No mobile menu configured yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.mobileMenuFooter}>
                                <div className={styles.mobileMenuQuickActions}>
                                    <Link href={isAuthenticated ? '/account' : '/login'} className={styles.mobileQuickAction} onClick={closeMobileMenu}>
                                        <span>Account</span>
                                    </Link>
                                    <Link href="/wishlist" className={styles.mobileQuickAction} onClick={closeMobileMenu}>
                                        <span>Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}</span>
                                    </Link>
                                    <Link href="/cart" className={styles.mobileQuickAction} onClick={closeMobileMenu}>
                                        <span>Cart {cartCount > 0 ? `(${cartCount})` : ''}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        </div>
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
