'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatStockStatus } from '@/lib/constants';
import { formatPrice } from '@/lib/currency';
import { AvailableFilters, ActiveFilters } from '@/components/templates/core/CategoryPage/types';
import { CategoryConfig } from '@/types/store';
import styles from './CategoryFilters.module.scss';

export interface CategoryFiltersProps {
    availableFilters: AvailableFilters | null;
    activeFilters: ActiveFilters;
    activeFilterCount: number;
    stagedFilters?: Partial<ActiveFilters>; // Optional for flexibility
    onFilterChange: (filterType: string, value: any) => void;
    onClearFilter: (filterType: string) => void;
    onRemoveFilterValue: (filterType: string, valueToRemove: string) => void;
    onClearAllFilters: () => void;
    onApplyFilters?: () => void;
    onClearStagedFilters?: () => void;
    hasUnappliedChanges?: boolean;
    isLoading?: boolean;

    // Config & Helpers
    config: CategoryConfig;
    currencySymbol: string;
    exchangeRate: number;
    currency: any;

    // Brand Helper
    getBrandDisplay?: (brandId: string) => string;
    isFilterValueActive?: (filterType: string, value: string) => boolean;

    // Optional override for custom styles or children
    className?: string;
    children?: React.ReactNode;
}

export default function CategoryFilters({
    availableFilters,
    activeFilters,
    activeFilterCount,
    stagedFilters,
    onFilterChange,
    onClearFilter,
    onRemoveFilterValue,
    onClearAllFilters,
    onApplyFilters,
    onClearStagedFilters,
    hasUnappliedChanges,
    isLoading,
    config,
    currencySymbol,
    exchangeRate,
    currency,
    getBrandDisplay = (id) => id,
    isFilterValueActive,
    className,
    children
}: CategoryFiltersProps) {

    // Expanded State
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => {
        const isTop = config.filters?.position === 'top';
        if (config.filters?.defaultState === 'expanded' && !isTop) {
            const keys = ['price', 'brand', 'rating', 'stock', 'tags'];
            if (availableFilters?.attributes) {
                availableFilters.attributes.forEach(attr => keys.push(attr.slug));
            }
            return new Set(keys);
        }
        return new Set(['price', 'brand']); // Default expanded
    });

    // Local state for price slider
    const [localSliderMin, setLocalSliderMin] = useState<number | null>(null);
    const [localSliderMax, setLocalSliderMax] = useState<number | null>(null);

    // Currency Formatting
    const priceCurrency = useMemo(() => {
        if (typeof currency === 'string') return currency;
        return { ...currency, exchangeRate: 1 }; // Assume exchangeRate handled by caller passing activeFilters in base currency? 
        // Wait, template logic assumed activeFilters in base, display in converted.
        // Yes, renderPriceFilter handles conversion.
        // The `currency` prop passed here is usually the object { symbol, exchangeRate, code }.
        // If it's an object, we use it. If string, likely code.
    }, [currency]);

    // Helpers
    const toggleFilter = (key: string) => {
        setExpandedFilters(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const isExpanded = (key: string) => expandedFilters.has(key);

    // Sync local slider state with active filters
    useEffect(() => {
        if (!activeFilters.price) {
            setLocalSliderMin(null);
            setLocalSliderMax(null);
        }
    }, [activeFilters.price]);

    // ============================================
    // Renderers
    // ============================================

    // Render filter checkbox group
    const renderCheckboxFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        const currentValues = filterKey === 'brand'
            ? (stagedFilters?.brands !== undefined ? stagedFilters.brands : activeFilters.brands)
            : filterKey === 'tags'
                ? (stagedFilters?.tags !== undefined ? stagedFilters.tags : activeFilters.tags)
                : filterKey === 'stock'
                    ? (stagedFilters?.stockStatus !== undefined ? stagedFilters.stockStatus : activeFilters.stockStatus)
                    : (stagedFilters?.attributes?.[filterKey] !== undefined ? stagedFilters.attributes[filterKey] : activeFilters.attributes?.[filterKey] || []);

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter(filterKey)}
                >
                    <span>{title}</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded(filterKey) ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded(filterKey) && (
                    <div className={styles.filterContent}>
                        {options.map(opt => (
                            <label key={opt.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={isFilterValueActive
                                        ? isFilterValueActive(filterKey, opt.value)
                                        : currentValues?.includes(opt.value) || false
                                    }
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...(currentValues || []), opt.value]
                                            : (currentValues || []).filter(v => v !== opt.value);
                                        onFilterChange(filterKey, newValues);
                                    }}
                                />
                                <span className={styles.checkbox}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className={styles.labelText}>
                                    {opt.label || (filterKey === 'stock' ? formatStockStatus(opt.status || opt.value) : opt.value)}
                                </span>
                                <span className={styles.count}>({opt.count})</span>
                            </label>
                        ))}
                        {(() => {
                            const activeValues = filterKey === 'brand'
                                ? activeFilters.brands
                                : filterKey === 'tags'
                                    ? activeFilters.tags
                                    : filterKey === 'stock'
                                        ? activeFilters.stockStatus
                                        : activeFilters.attributes?.[filterKey];

                            const stagedValues = filterKey === 'brand'
                                ? stagedFilters?.brands
                                : filterKey === 'tags'
                                    ? stagedFilters?.tags
                                    : filterKey === 'stock'
                                        ? stagedFilters?.stockStatus
                                        : stagedFilters?.attributes?.[filterKey];

                            const normalizeForComparison = (values: any[] | undefined): string => {
                                if (!values) return '';
                                return [...values].sort().join(',');
                            };
                            const activeSorted = normalizeForComparison(activeValues as any[]);
                            const stagedSorted = normalizeForComparison(stagedValues as any[]);
                            const hasChanges = activeSorted !== stagedSorted;
                            const isApplied = activeValues && activeValues.length > 0;

                            return (hasChanges || isApplied) ? (
                                <div className={styles.filterActions}>
                                    {hasChanges && onApplyFilters && (
                                        <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                            Apply
                                        </button>
                                    )}
                                    {isApplied && (
                                        <button className={styles.filterResetBtn} onClick={() => onClearFilter?.(filterKey)}>
                                            Reset
                                        </button>
                                    )}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>
        );
    };

    // Render price range filter
    const renderPriceFilter = () => {
        if (!config.filters?.showPriceRange || !availableFilters?.priceRange) return null;

        const { minPrice: baseMinPrice, maxPrice: baseMaxPrice } = availableFilters.priceRange;

        // Convert to display currency
        const displayMinPrice = Math.round(baseMinPrice * exchangeRate);
        const displayMaxPrice = Math.round(baseMaxPrice * exchangeRate);

        // Active filter values
        const currentBaseMin = activeFilters.price?.min ?? baseMinPrice;
        const currentBaseMax = activeFilters.price?.max ?? baseMaxPrice;

        const currentDisplayMin = Math.round(currentBaseMin * exchangeRate);
        const currentDisplayMax = currentBaseMax === Infinity ? displayMaxPrice : Math.round(currentBaseMax * exchangeRate);

        // Local state or active values
        const displayMin = localSliderMin ?? currentDisplayMin;
        const displayMax = localSliderMax ?? currentDisplayMax;
        const priceStyle = config.filters?.priceRangeStyle || 'input';

        // Range Buttons Generator
        const generatePriceRanges = () => {
            const range = displayMaxPrice - displayMinPrice;
            const step = Math.ceil(range / 4);
            return [
                { label: `Under ${formatPrice(displayMinPrice + step, priceCurrency)}`, min: displayMinPrice, max: displayMinPrice + step },
                { label: `${formatPrice(displayMinPrice + step, priceCurrency)} - ${formatPrice(displayMinPrice + step * 2, priceCurrency)}`, min: displayMinPrice + step, max: displayMinPrice + step * 2 },
                { label: `${formatPrice(displayMinPrice + step * 2, priceCurrency)} - ${formatPrice(displayMinPrice + step * 3, priceCurrency)}`, min: displayMinPrice + step * 2, max: displayMinPrice + step * 3 },
                { label: `Over ${formatPrice(displayMinPrice + step * 3, priceCurrency)}`, min: displayMinPrice + step * 3, max: displayMaxPrice },
            ];
        };

        const renderSlider = () => (
            <div className={styles.priceSlider}>
                <div className={styles.sliderLabels}>
                    <span>{formatPrice(displayMin, priceCurrency)}</span>
                    <span>{formatPrice(displayMax, priceCurrency)}</span>
                </div>
                <div className={styles.sliderContainer}>
                    <input
                        type="range"
                        min={displayMinPrice}
                        max={displayMaxPrice}
                        value={displayMin}
                        onChange={(e) => {
                            const displayValue = parseInt(e.target.value);
                            setLocalSliderMin(displayValue);
                            if (displayMax < displayValue) setLocalSliderMax(displayValue);

                            const baseValue = Math.round(displayValue / exchangeRate);
                            const baseMax = displayMax < displayValue ? baseValue : Math.round(displayMax / exchangeRate);
                            onFilterChange('price', { min: baseValue, max: baseMax });
                        }}
                        className={styles.sliderInput}
                    />
                    <input
                        type="range"
                        min={displayMinPrice}
                        max={displayMaxPrice}
                        value={displayMax}
                        onChange={(e) => {
                            const displayValue = parseInt(e.target.value);
                            setLocalSliderMax(displayValue);
                            if (displayMin > displayValue) setLocalSliderMin(displayValue);

                            const baseValue = Math.round(displayValue / exchangeRate);
                            const baseMin = displayMin > displayValue ? baseValue : Math.round(displayMin / exchangeRate);
                            onFilterChange('price', { min: baseMin, max: baseValue });
                        }}
                        className={styles.sliderInput}
                    />
                    <div
                        className={styles.sliderTrack}
                        style={{
                            left: `${((displayMin - displayMinPrice) / (displayMaxPrice - displayMinPrice)) * 100}%`,
                            right: `${100 - ((displayMax - displayMinPrice) / (displayMaxPrice - displayMinPrice)) * 100}%`
                        }}
                    />
                </div>
            </div>
        );

        const renderInputs = () => (
            <div className={styles.priceInputs}>
                <div className={styles.priceInput}>
                    <span className={styles.currencySymbol}>{currencySymbol}</span>
                    <input
                        type="number"
                        placeholder={`Min`}
                        value={currentDisplayMin === displayMinPrice ? '' : currentDisplayMin}
                        onChange={(e) => {
                            const displayValue = parseInt(e.target.value) || displayMinPrice;
                            const baseValue = Math.round(displayValue / exchangeRate);
                            onFilterChange('price', { min: baseValue, max: currentBaseMax });
                        }}
                    />
                </div>
                <span className={styles.priceDash}>—</span>
                <div className={styles.priceInput}>
                    <span className={styles.currencySymbol}>{currencySymbol}</span>
                    <input
                        type="number"
                        placeholder={`Max`}
                        value={currentDisplayMax === displayMaxPrice ? '' : currentDisplayMax}
                        onChange={(e) => {
                            const displayValue = parseInt(e.target.value) || Infinity;
                            const baseValue = displayValue === Infinity ? Infinity : Math.round(displayValue / exchangeRate);
                            onFilterChange('price', { min: currentBaseMin, max: baseValue });
                        }}
                    />
                </div>
            </div>
        );

        const renderRangeButtons = () => {
            const ranges = generatePriceRanges();
            const isRangeActive = (range: { min: number; max: number }) => {
                return currentDisplayMin === range.min && currentDisplayMax === range.max;
            };

            return (
                <div className={styles.priceRangeButtons}>
                    {ranges.map((range, idx) => (
                        <button
                            key={idx}
                            className={`${styles.rangeButton} ${isRangeActive(range) ? styles.active : ''}`}
                            onClick={() => {
                                const baseMin = Math.round(range.min / exchangeRate);
                                const baseMax = Math.round(range.max / exchangeRate);
                                onFilterChange('price', { min: baseMin, max: baseMax });
                            }}
                        >
                            {range.label}
                        </button>
                    ))}
                    {activeFilters.price && (
                        <button className={styles.rangeClearButton} onClick={() => onClearFilter('price')}>
                            Clear
                        </button>
                    )}
                </div>
            );
        };

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter('price')}
                >
                    <span>Price Range</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded('price') ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('price') && (
                    <div className={styles.filterContent}>
                        {priceStyle !== 'range-buttons' && (
                            <div className={styles.priceRange}>
                                <span>{formatPrice(displayMinPrice, priceCurrency)}</span>
                                <span>—</span>
                                <span>{formatPrice(displayMaxPrice, priceCurrency)}</span>
                            </div>
                        )}

                        {priceStyle === 'slider' && renderSlider()}
                        {priceStyle === 'input' && renderInputs()}
                        {priceStyle === 'range-buttons' && renderRangeButtons()}

                        <div className={styles.filterActions}>
                            {(() => {
                                const stagedPrice = stagedFilters?.price;
                                const activePrice = activeFilters.price;
                                const hasChanges = stagedPrice !== undefined &&
                                    JSON.stringify(stagedPrice) !== JSON.stringify(activePrice);

                                return hasChanges && onApplyFilters ? (
                                    <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                        Apply
                                    </button>
                                ) : null;
                            })()}
                            {activeFilters.price && (
                                <button
                                    className={styles.filterResetBtn}
                                    onClick={() => {
                                        onClearFilter?.('price');
                                        setLocalSliderMin(null);
                                        setLocalSliderMax(null);
                                    }}
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render rating filter
    const renderRatingFilter = () => {
        if (!config.filters?.showRatingFilter) return null;
        const ratings = [4, 3, 2, 1];

        return (
            <div className={styles.filterGroup}>
                <button
                    className={styles.filterHeader}
                    onClick={() => toggleFilter('rating')}
                >
                    <span>Rating</span>
                    <svg
                        className={`${styles.chevron} ${isExpanded('rating') ? styles.expanded : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('rating') && (
                    <div className={styles.filterContent}>
                        {ratings.map(rating => (
                            <label key={rating} className={styles.ratingLabel}>
                                <input
                                    type="radio"
                                    name="rating"
                                    checked={(stagedFilters?.rating || activeFilters.rating) === rating}
                                    onChange={() => {
                                        const currentRating = stagedFilters?.rating ?? activeFilters.rating;
                                        onFilterChange('rating', currentRating === rating ? null : rating);
                                    }}
                                />
                                <span className={styles.radio} />
                                <span className={styles.stars}>
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={i < rating ? styles.starFilled : styles.starEmpty}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </span>
                                <span className={styles.ratingText}>&amp; up</span>
                            </label>
                        ))}
                        {(() => {
                            const isApplied = activeFilters.rating != null;
                            const stagedRating = stagedFilters?.rating;
                            const hasChanges = stagedRating !== undefined && stagedRating !== activeFilters.rating;

                            return (hasChanges || isApplied) ? (
                                <div className={styles.filterActions}>
                                    {hasChanges && onApplyFilters && (
                                        <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                            Apply
                                        </button>
                                    )}
                                    {isApplied && (
                                        <button className={styles.filterResetBtn} onClick={() => onClearFilter?.('rating')}>
                                            Reset
                                        </button>
                                    )}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>
        );
    };

    // Render Dropdown Filter (for Top Position) - Optional, mainly for horizontal layout
    const renderDropdownFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        // Get current values considering staged filters
        const currentValues = filterKey === 'brand'
            ? (stagedFilters?.brands !== undefined ? stagedFilters.brands : activeFilters.brands)
            : filterKey === 'stock'
                ? (stagedFilters?.stockStatus !== undefined ? stagedFilters.stockStatus : activeFilters.stockStatus)
                : filterKey === 'tags'
                    ? (stagedFilters?.tags !== undefined ? stagedFilters.tags : activeFilters.tags)
                    : (stagedFilters?.attributes?.[filterKey] !== undefined
                        ? stagedFilters.attributes[filterKey]
                        : activeFilters.attributes?.[filterKey] || []);
        const isOpen = expandedFilters.has(filterKey);
        const isActive = (currentValues?.length || 0) > 0;

        return (
            <div className={styles.filterDropdown}>
                <button
                    className={`${styles.dropdownTrigger} ${isOpen ? styles.open : ''} ${isActive ? styles.active : ''}`}
                    onClick={() => toggleFilter(filterKey)}
                >
                    <span>{title}</span>
                    {isActive && <span className={styles.filterBadge}>{currentValues?.length}</span>}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className={styles.dropdownContent}>
                        {options.map(opt => (
                            <label key={opt.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={isFilterValueActive
                                        ? isFilterValueActive(filterKey, opt.value)
                                        : currentValues?.includes(opt.value) || false
                                    }
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...(currentValues || []), opt.value]
                                            : (currentValues || []).filter(v => v !== opt.value);
                                        onFilterChange(filterKey, newValues);
                                    }}
                                />
                                <span className={styles.checkbox}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className={styles.labelText}>
                                    {opt.label || (filterKey === 'stock' ? formatStockStatus(opt.status || opt.value) : opt.value)}
                                </span>
                                <span className={styles.count}>({opt.count})</span>
                            </label>
                        ))}
                        {/* Apply/Reset buttons */}
                        {(() => {
                            const activeValues = filterKey === 'brand'
                                ? activeFilters.brands
                                : filterKey === 'tags'
                                    ? activeFilters.tags
                                    : filterKey === 'stock'
                                        ? activeFilters.stockStatus
                                        : activeFilters.attributes?.[filterKey];
                            const stagedValues = filterKey === 'brand'
                                ? stagedFilters?.brands
                                : filterKey === 'tags'
                                    ? stagedFilters?.tags
                                    : filterKey === 'stock'
                                        ? stagedFilters?.stockStatus
                                        : stagedFilters?.attributes?.[filterKey];
                            const hasChanges = JSON.stringify(stagedValues || []) !== JSON.stringify(activeValues || []) && stagedValues !== undefined;
                            const isApplied = activeValues && activeValues.length > 0;

                            return (hasChanges || isApplied) ? (
                                <div className={styles.filterActions}>
                                    {hasChanges && onApplyFilters && (
                                        <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                            Apply
                                        </button>
                                    )}
                                    {isApplied && (
                                        <button className={styles.filterResetBtn} onClick={() => onClearFilter?.(filterKey)}>
                                            Reset
                                        </button>
                                    )}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>
        );
    };

    // Show skeleton only when filters data is not available yet (initial load)
    // Don't show skeleton during filter/sort/pagination changes - filters remain usable
    if (!availableFilters) {
        if (config.filters?.position === 'top') {
            return (
                <div className={styles.topFilters}>
                    {/* Render a few placeholder chips for top filters */}
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className={styles.skeletonHeader}
                            style={{
                                width: '120px',
                                height: '38px',
                                marginBottom: 0,
                                borderRadius: '8px'
                            }}
                        />
                    ))}
                </div>
            );
        }

        // Sidebar Skeleton
        return (
            <div className={`${styles.filtersContent} ${className || ''}`}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.skeletonFilter}>
                        <div className={styles.skeletonHeader} />
                        <div className={styles.skeletonItem} />
                        <div className={styles.skeletonItem} />
                        <div className={styles.skeletonItem} />
                    </div>
                ))}
            </div>
        );
    }

    // If position is top, render horizontal filters
    if (config.filters?.position === 'top') {
        return (
            <div className={styles.topFilters}>
                {/* Active filter count and clear all */}
                {activeFilterCount > 0 && (
                    <div className={styles.topFiltersActive}>
                        <span className={styles.filterBadge}>{activeFilterCount} active</span>
                        <button className={styles.clearAllBtn} onClick={onClearAllFilters}>
                            Clear All
                        </button>
                    </div>
                )}

                {/* Price Filter Dropdown */}
                {config.filters?.showPriceRange && availableFilters?.priceRange && (
                    <div className={styles.filterDropdown}>
                        <button
                            className={`${styles.dropdownTrigger} ${isExpanded('price') ? styles.open : ''} ${activeFilters.price ? styles.active : ''}`}
                            onClick={() => toggleFilter('price')}
                        >
                            <span>Price</span>
                            {activeFilters.price && <span className={styles.filterBadge}>1</span>}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isExpanded('price') && (
                            <div className={styles.dropdownContent}>
                                {renderPriceFilter()}
                            </div>
                        )}
                    </div>
                )}

                {/* Brand Filter Dropdown */}
                {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 && (
                    renderDropdownFilter('Brand', 'brand', availableFilters!.brands!)
                )}

                {/* Rating Filter Dropdown */}
                {config.filters?.showRatingFilter && (
                    <div className={styles.filterDropdown}>
                        <button
                            className={`${styles.dropdownTrigger} ${isExpanded('rating') ? styles.open : ''} ${activeFilters.rating ? styles.active : ''}`}
                            onClick={() => toggleFilter('rating')}
                        >
                            <span>Rating</span>
                            {activeFilters.rating && <span className={styles.filterBadge}>1</span>}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isExpanded('rating') && (
                            <div className={styles.dropdownContent}>
                                {[4, 3, 2, 1].map(ratingValue => {
                                    const currentRating = stagedFilters?.rating !== undefined ? stagedFilters.rating : activeFilters.rating;
                                    return (
                                        <label key={ratingValue} className={styles.ratingLabel}>
                                            <input
                                                type="radio"
                                                name="rating-top"
                                                checked={currentRating === ratingValue}
                                                onChange={() => onFilterChange('rating', currentRating === ratingValue ? null : ratingValue)}
                                            />
                                            <span className={styles.radio} />
                                            <span className={styles.stars}>
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={i < ratingValue ? styles.starFilled : styles.starEmpty}
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </span>
                                            <span className={styles.ratingText}>& up</span>
                                        </label>
                                    );
                                })}
                                {/* Apply/Reset buttons for rating */}
                                {(() => {
                                    const isApplied = activeFilters.rating != null;
                                    const stagedRating = stagedFilters?.rating;
                                    const hasChanges = stagedRating !== undefined && stagedRating !== activeFilters.rating;

                                    return (hasChanges || isApplied) ? (
                                        <div className={styles.filterActions}>
                                            {hasChanges && onApplyFilters && (
                                                <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                                    Apply
                                                </button>
                                            )}
                                            {isApplied && (
                                                <button className={styles.filterResetBtn} onClick={() => onClearFilter?.('rating')}>
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* Availability Filter Dropdown */}
                {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 && (
                    renderDropdownFilter('Availability', 'stock', availableFilters!.availability!)
                )}

                {/* Attribute Filters Dropdowns */}
                {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                    <React.Fragment key={attr._id}>
                        {renderDropdownFilter(attr.name, attr.slug, attr.values)}
                    </React.Fragment>
                ))}

                {/* Tags Filter Dropdown */}
                {config.filters?.showTagFilter && (availableFilters?.tags?.length ?? 0) > 0 && (
                    renderDropdownFilter('Tags', 'tags', availableFilters!.tags!)
                )}
            </div>
        );
    }

    // Default Vertical Sidebar
    return (
        <div className={`${styles.filtersContent} ${className || ''}`}>
            {/* Active filters */}
            {activeFilterCount > 0 && (
                <div className={styles.activeFilters}>
                    <div className={styles.activeFiltersHeader}>
                        <span>Active Filters ({activeFilterCount})</span>
                        <button onClick={onClearAllFilters}>Clear All</button>
                    </div>
                    <div className={styles.activeFilterTags}>
                        {activeFilters.brands?.map(brandId => (
                            <span key={brandId} className={styles.filterTag}>
                                {getBrandDisplay(brandId)}
                                <button onClick={() => onRemoveFilterValue('brand', brandId)}>×</button>
                            </span>
                        ))}
                        {activeFilters.price && (() => {
                            const displayMin = Math.round((activeFilters.price?.min || 0) * exchangeRate);
                            const displayMax = activeFilters.price?.max === Infinity
                                ? '∞'
                                : Math.round((activeFilters.price?.max || 0) * exchangeRate).toLocaleString();
                            return (
                                <span className={styles.filterTag}>
                                    {formatPrice(displayMin, priceCurrency)} - {String(displayMax).includes('∞') ? '∞' : formatPrice(Number(displayMax), priceCurrency)}
                                    <button onClick={() => onClearFilter('price')}>×</button>
                                </span>
                            );
                        })()}
                        {activeFilters.stockStatus?.map(status => (
                            <span key={status} className={styles.filterTag}>
                                {formatStockStatus(status)}
                                <button onClick={() => onRemoveFilterValue('stock', status)}>×</button>
                            </span>
                        ))}
                        {activeFilters.rating && (
                            <span className={styles.filterTag}>
                                {activeFilters.rating}+ Stars
                                <button onClick={() => onClearFilter('rating')}>×</button>
                            </span>
                        )}
                        {/* Attributes */}
                        {activeFilters.attributes && Object.entries(activeFilters.attributes).map(([attrSlug, values]) =>
                            values.map(value => (
                                <span key={`${attrSlug}-${value}`} className={styles.filterTag}>
                                    {value}
                                    <button onClick={() => onRemoveFilterValue(attrSlug, value)}>×</button>
                                </span>
                            ))
                        )}
                    </div>
                </div>
            )}

            {children} {/* Render subcategories or extras from parent */}

            {renderPriceFilter()}

            {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 && (
                renderCheckboxFilter('Brand', 'brand', availableFilters!.brands!)
            )}

            {renderRatingFilter()}

            {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 && (
                renderCheckboxFilter('Availability', 'stock', availableFilters!.availability!)
            )}

            {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                <div key={attr._id}>
                    {renderCheckboxFilter(attr.name, attr.slug, attr.values)}
                </div>
            ))}

            {config.filters?.showTagFilter && (availableFilters?.tags?.length ?? 0) > 0 && (
                renderCheckboxFilter('Tags', 'tags', availableFilters!.tags!)
            )}

            {hasUnappliedChanges && onClearStagedFilters && (
                <button className={styles.clearAllPendingBtn} onClick={onClearStagedFilters}>
                    Clear All Pending Changes
                </button>
            )}
        </div>
    );
}
