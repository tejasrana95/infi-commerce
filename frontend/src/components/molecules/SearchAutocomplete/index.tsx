'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import { useCurrency } from '@/hooks/useCurrency';
import api from '@/lib/api';
import styles from './SearchAutocomplete.module.scss';

// ============================================
// Types
// ============================================

interface ProductSuggestion {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    featuredImage?: string;
    images?: string[];
    pricing: {
        originalPrice: number;
        salePrice?: number;
        finalPrice?: number;
        isOnSale?: boolean;
        price: number;
    };
}

interface SearchAutocompleteProps {
    placeholder?: string;
    onClose?: () => void;
    autoFocus?: boolean;
}

// ============================================
// Debounce Hook
// ============================================

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// ============================================
// Local Storage for Recent Searches
// ============================================

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function addRecentSearch(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return;
    try {
        const recent = getRecentSearches();
        const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
        const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
        // Ignore storage errors
    }
}

function clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
        // Ignore
    }
}

// ============================================
// Component
// ============================================

export default function SearchAutocomplete({
    placeholder = 'Search products...',
    onClose,
    autoFocus = false,
}: SearchAutocompleteProps) {
    const router = useRouter();
    const { store } = useStore();
    const { formatPriceWithExchange } = useCurrency();

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    // Fetch suggestions when debounced query changes
    useEffect(() => {
        if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(
                    `products?storeId=${store?._id}&search=${encodeURIComponent(debouncedQuery)}&limit=6`
                );
                setSuggestions(response.products || []);
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery, store?._id]);

    // Auto focus
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search submission
    const handleSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;
        addRecentSearch(searchQuery);
        setRecentSearches(getRecentSearches());
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        setIsOpen(false);
        onClose?.();
    }, [router, onClose]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = suggestions.length + recentSearches.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    // Navigate to product
                    const product = suggestions[selectedIndex];
                    router.push(`/${product.slug}`);
                    setIsOpen(false);
                    onClose?.();
                } else if (selectedIndex >= suggestions.length) {
                    // Use recent search
                    const recentIndex = selectedIndex - suggestions.length;
                    handleSearch(recentSearches[recentIndex]);
                } else {
                    // Normal search
                    handleSearch(query);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                onClose?.();
                break;
        }
    };

    const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0);

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.inputWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={styles.input}
                    autoComplete="off"
                />
                {query && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {onClose && (
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {showDropdown && (
                <div className={styles.dropdown}>
                    {/* Loading */}
                    {isLoading && (
                        <div className={styles.loading}>
                            <span className={styles.spinner} />
                            Searching...
                        </div>
                    )}

                    {/* Product Suggestions */}
                    {!isLoading && suggestions.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Products</div>
                            {suggestions.map((product, index) => (
                                <Link
                                    key={product._id}
                                    href={`/${product.slug}`}
                                    className={`${styles.productItem} ${selectedIndex === index ? styles.selected : ''}`}
                                    onClick={() => {
                                        setIsOpen(false);
                                        onClose?.();
                                    }}
                                >
                                    <div className={styles.productImage}>
                                        {(product.featuredImage || product.images?.[0]) ? (
                                            <Image
                                                src={product.featuredImage || product.images![0]}
                                                alt={product.name}
                                                width={48}
                                                height={48}
                                                style={{ objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <div className={styles.noImage}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.productInfo}>
                                        <span className={styles.productName}>{product.name}</span>
                                        <span className={styles.productPrice}>
                                            {formatPriceWithExchange(product.pricing.finalPrice || product.pricing.price)}
                                            {product.pricing.salePrice && product.pricing.salePrice < product.pricing.price && (
                                                <span className={styles.originalPrice}>
                                                    {formatPriceWithExchange(product.pricing.originalPrice)}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}`}
                                className={styles.viewAll}
                                onClick={() => {
                                    addRecentSearch(query);
                                    setIsOpen(false);
                                    onClose?.();
                                }}
                            >
                                View all results for &quot;{query}&quot;
                            </Link>
                        </div>
                    )}

                    {/* No Results */}
                    {!isLoading && query.length >= 2 && suggestions.length === 0 && (
                        <div className={styles.noResults}>
                            <p>No products found for &quot;{query}&quot;</p>
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}`}
                                className={styles.searchLink}
                                onClick={() => {
                                    addRecentSearch(query);
                                    setIsOpen(false);
                                    onClose?.();
                                }}
                            >
                                Search all products
                            </Link>
                        </div>
                    )}

                    {/* Recent Searches */}
                    {!isLoading && query.length < 2 && recentSearches.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>Recent Searches</span>
                                <button
                                    className={styles.clearRecent}
                                    onClick={() => {
                                        clearRecentSearches();
                                        setRecentSearches([]);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                            {recentSearches.map((search, index) => (
                                <button
                                    key={search}
                                    className={`${styles.recentItem} ${selectedIndex === suggestions.length + index ? styles.selected : ''}`}
                                    onClick={() => handleSearch(search)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {search}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
