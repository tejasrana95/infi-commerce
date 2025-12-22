// Modern Clean CategoryPage Template - Premium presentation layer
// Features: Glassmorphism filter sidebar, animated product grid, modern UI

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { CategoryPageTemplateProps } from '@/components/templates/core/CategoryPage/types';
import { getComponent } from '@/components/templates/registry';
import { formatStockStatus } from '@/lib/constants';
import styles from './CategoryPage.module.scss';

// (Layout helper functions removed - rendering now uses section-based iteration)

export default function ModernCleanCategoryPageTemplate({
    category,
    breadcrumbs,
    products,
    isLoading,
    pagination,
    onPageChange,
    onLoadMore,
    currentSort,
    sortOptions,
    onSortChange,
    availableFilters,
    activeFilters,
    activeFilterCount,
    onFilterChange,
    onClearFilter,
    onClearAllFilters,
    isFilterDrawerOpen,
    onOpenFilterDrawer,
    onCloseFilterDrawer,
    config,
    currencySymbol,
    exchangeRate,
    templateId,
    layout,
    stagedFilters,
    hasUnappliedChanges,
    onApplyFilters,
    onClearStagedFilters,
}: CategoryPageTemplateProps) {
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => {
        const isTop = config.filters?.position === 'top';
        if (config.filters?.defaultState === 'expanded' && !isTop) {
            const keys = ['price', 'brand', 'rating', 'stock', 'tags'];
            if (availableFilters?.attributes) {
                availableFilters.attributes.forEach(attr => keys.push(attr.slug));
            }
            return new Set(keys);
        }
        return new Set([]);
    });
    console.log('layout', layout);
    // Local state for slider values (for real-time visual feedback)
    const [localSliderMin, setLocalSliderMin] = useState<number | null>(null);
    const [localSliderMax, setLocalSliderMax] = useState<number | null>(null);

    // Sync local slider state with active filters
    useEffect(() => {
        if (!activeFilters.price) {
            setLocalSliderMin(null);
            setLocalSliderMax(null);
        }
    }, [activeFilters.price]);

    // Get ProductCard component
    const ProductCard = getComponent('ProductCard', templateId);

    // Toggle filter section
    const toggleFilter = (key: string) => {
        setExpandedFilters(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Check if filter is expanded
    const isExpanded = (key: string) => expandedFilters.has(key);

    // Render filter checkbox group
    const renderCheckboxFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        // Check staged filters first (pending changes), fall back to active filters
        // Important: use !== undefined to handle empty arrays correctly
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
                                    checked={currentValues?.includes(opt.value) || false}
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
                            // Check if this specific filter has changes
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

                            // Show button if staged differs from active (proper comparison without mutating)
                            const activeSorted = activeValues ? [...activeValues].sort().join(',') : '';
                            const stagedSorted = stagedValues ? [...stagedValues].sort().join(',') : '';
                            const hasChanges = activeSorted !== stagedSorted;
                            const isApplied = activeValues && activeValues.length > 0;

                            return (hasChanges || isApplied) ? (
                                <div className={styles.filterActions}>
                                    {hasChanges && (
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

        // All values from API are in base currency
        const { minPrice: baseMinPrice, maxPrice: baseMaxPrice } = availableFilters.priceRange;

        // Convert to display currency for showing to user
        const displayMinPrice = Math.round(baseMinPrice * exchangeRate);
        const displayMaxPrice = Math.round(baseMaxPrice * exchangeRate);

        // Active filter values are stored in base currency, convert for display
        const currentBaseMin = activeFilters.price?.min ?? baseMinPrice;
        const currentBaseMax = activeFilters.price?.max ?? baseMaxPrice;
        const currentDisplayMin = Math.round(currentBaseMin * exchangeRate);
        const currentDisplayMax = currentBaseMax === Infinity ? displayMaxPrice : Math.round(currentBaseMax * exchangeRate);

        // Use local state for real-time display, fallback to active filter values
        const displayMin = localSliderMin ?? currentDisplayMin;
        const displayMax = localSliderMax ?? currentDisplayMax;

        const priceStyle = config.filters?.priceRangeStyle || 'input';

        // Generate preset price ranges for range-buttons style
        const generatePriceRanges = () => {
            const range = displayMaxPrice - displayMinPrice;
            const step = Math.ceil(range / 4);
            return [
                { label: `Under ${currencySymbol}${(displayMinPrice + step).toLocaleString()}`, min: displayMinPrice, max: displayMinPrice + step },
                { label: `${currencySymbol}${(displayMinPrice + step).toLocaleString()} - ${currencySymbol}${(displayMinPrice + step * 2).toLocaleString()}`, min: displayMinPrice + step, max: displayMinPrice + step * 2 },
                { label: `${currencySymbol}${(displayMinPrice + step * 2).toLocaleString()} - ${currencySymbol}${(displayMinPrice + step * 3).toLocaleString()}`, min: displayMinPrice + step * 2, max: displayMinPrice + step * 3 },
                { label: `Over ${currencySymbol}${(displayMinPrice + step * 3).toLocaleString()}`, min: displayMinPrice + step * 3, max: displayMaxPrice },
            ];
        };

        // Render slider style (local state for labels, debounced API calls via Container)
        const renderSlider = () => (
            <div className={styles.priceSlider}>
                <div className={styles.sliderLabels}>
                    <span>{currencySymbol}{displayMin.toLocaleString()}</span>
                    <span>{currencySymbol}{displayMax.toLocaleString()}</span>
                </div>
                <div className={styles.sliderContainer}>
                    <input
                        type="range"
                        min={displayMinPrice}
                        max={displayMaxPrice}
                        value={displayMin}
                        onChange={(e) => {
                            const displayValue = parseInt(e.target.value);
                            // Update local state immediately for visual feedback
                            setLocalSliderMin(displayValue);
                            // Ensure max stays >= min
                            if (displayMax < displayValue) {
                                setLocalSliderMax(displayValue);
                            }
                            // Trigger debounced filter change
                            const baseValue = Math.round(displayValue / exchangeRate);
                            const baseMax = displayMax < displayValue
                                ? baseValue
                                : Math.round(displayMax / exchangeRate);
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
                            // Update local state immediately for visual feedback
                            setLocalSliderMax(displayValue);
                            // Ensure min stays <= max
                            if (displayMin > displayValue) {
                                setLocalSliderMin(displayValue);
                            }
                            // Trigger debounced filter change
                            const baseValue = Math.round(displayValue / exchangeRate);
                            const baseMin = displayMin > displayValue
                                ? baseValue
                                : Math.round(displayMin / exchangeRate);
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

        // Render input style (existing implementation)
        const renderInputs = () => (
            <>
                <div className={styles.priceRange}>
                    <span>{currencySymbol}{displayMinPrice.toLocaleString()}</span>
                    <span>—</span>
                    <span>{currencySymbol}{displayMaxPrice.toLocaleString()}</span>
                </div>
                <div className={styles.priceInputs}>
                    <div className={styles.priceInput}>
                        <span className={styles.currencySymbol}>{currencySymbol}</span>
                        <input
                            type="number"
                            placeholder={`Min (${displayMinPrice})`}
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
                            placeholder={`Max (${displayMaxPrice})`}
                            value={currentDisplayMax === displayMaxPrice ? '' : currentDisplayMax}
                            onChange={(e) => {
                                const displayValue = parseInt(e.target.value) || Infinity;
                                const baseValue = displayValue === Infinity ? Infinity : Math.round(displayValue / exchangeRate);
                                onFilterChange('price', { min: currentBaseMin, max: baseValue });
                            }}
                        />
                    </div>
                </div>
            </>
        );

        // Render range buttons style
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
                        <button
                            className={styles.rangeClearButton}
                            onClick={() => onClearFilter('price')}
                        >
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
                        {priceStyle === 'slider' && renderSlider()}
                        {priceStyle === 'input' && renderInputs()}
                        {priceStyle === 'range-buttons' && renderRangeButtons()}

                        {/* Apply and Reset buttons */}
                        <div className={styles.filterActions}>
                            {hasUnappliedChanges && (() => {
                                const stagedPrice = stagedFilters?.price;
                                const activePrice = activeFilters.price;
                                const hasChanges = JSON.stringify(stagedPrice) !== JSON.stringify(activePrice);

                                return hasChanges ? (
                                    <button className={styles.filterApplyBtn} onClick={onApplyFilters}>
                                        Apply
                                    </button>
                                ) : null;
                            })()}
                            {activeFilters.price && (
                                <button
                                    className={styles.filterResetBtn}
                                    onClick={() => onClearFilter?.('price')}
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
                                        // Toggle: if clicking the same rating, deselect it
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
                            const isApplied = activeFilters.rating;
                            const hasChanges = stagedFilters?.rating !== activeFilters.rating;

                            return (hasChanges || isApplied) ? (
                                <div className={styles.filterActions}>
                                    {hasChanges && (
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

    // Render sidebar filters
    const renderFilters = () => (
        <div className={styles.filtersContent}>
            {/* Active filters */}
            {activeFilterCount > 0 && (
                <div className={styles.activeFilters}>
                    <div className={styles.activeFiltersHeader}>
                        <span>Active Filters ({activeFilterCount})</span>
                        <button onClick={onClearAllFilters}>Clear All</button>
                    </div>
                    <div className={styles.activeFilterTags}>
                        {activeFilters.brands?.map(brand => (
                            <span key={brand} className={styles.filterTag}>
                                {brand}
                                <button onClick={() => {
                                    const newBrands = activeFilters.brands?.filter(b => b !== brand);
                                    onFilterChange('brand', newBrands);
                                }}>×</button>
                            </span>
                        ))}
                        {activeFilters.price && (() => {
                            const displayMin = Math.round(activeFilters.price.min * exchangeRate);
                            const displayMax = activeFilters.price.max === Infinity
                                ? '∞'
                                : Math.round(activeFilters.price.max * exchangeRate).toLocaleString();
                            return (
                                <span className={styles.filterTag}>
                                    {currencySymbol}{displayMin.toLocaleString()} - {currencySymbol}{displayMax}
                                    <button onClick={() => onClearFilter('price')}>×</button>
                                </span>
                            );
                        })()}
                        {activeFilters.rating && (
                            <span className={styles.filterTag}>
                                {activeFilters.rating}+ Stars
                                <button onClick={() => onClearFilter('rating')}>×</button>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Subcategories */}
            {config.subcategories?.display !== 'none' && (availableFilters?.subcategories?.length ?? 0) > 0 && (
                <div className={styles.subcategories}>
                    <h4>Categories</h4>
                    <div className={styles.subcategoryList}>
                        {availableFilters!.subcategories!.map(sub => (
                            <Link
                                key={sub._id}
                                href={`/category/${sub.slug}`}
                                className={styles.subcategoryItem}
                            >
                                {sub.image && (
                                    <Image src={sub.image} alt={sub.title} width={40} height={40} />
                                )}
                                <span>{sub.title}</span>
                                <span className={styles.count}>({sub.productCount})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Price filter */}
            {renderPriceFilter()}

            {/* Brand filter */}
            {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 && (
                renderCheckboxFilter('Brand', 'brand', availableFilters!.brands!)
            )}

            {/* Rating filter */}
            {renderRatingFilter()}

            {/* Availability filter */}
            {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 && (
                renderCheckboxFilter('Availability', 'stock', availableFilters!.availability!)
            )}

            {/* Attribute filters */}
            {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                <div key={attr._id}>
                    {renderCheckboxFilter(attr.name, attr.slug, attr.values)}
                </div>
            ))}

            {/* Tag filter */}
            {config.filters?.showTagFilter && (availableFilters?.tags?.length ?? 0) > 0 && (
                renderCheckboxFilter('Tags', 'tags', availableFilters!.tags!)
            )}

            {/* Clear Pending Button at Bottom */}
            {hasUnappliedChanges && (
                <button className={styles.clearAllPendingBtn} onClick={onClearStagedFilters}>
                    Clear All Pending Changes
                </button>
            )}
        </div>
    );

    // Render dropdown filter (for Top position)
    const renderDropdownFilter = (
        title: string,
        filterKey: string,
        options: { value: string; label?: string; count: number; status?: string }[],
    ) => {
        const currentValues = filterKey === 'brand'
            ? activeFilters.brands
            : filterKey === 'tags'
                ? activeFilters.tags
                : filterKey === 'stock'
                    ? activeFilters.stockStatus
                    : activeFilters.attributes?.[filterKey] || [];

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
                                    checked={currentValues?.includes(opt.value)}
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
                    </div>
                )}
            </div>
        );
    };

    // Render horizontal top filters
    const renderHorizontalFilters = () => (
        <div className={styles.topFilters}>
            {/* Price Filter (simplified for top bar) */}
            <div className={styles.filterDropdown}>
                <button
                    className={`${styles.dropdownTrigger} ${isExpanded('price') ? styles.open : ''} ${activeFilters.price ? styles.active : ''}`}
                    onClick={() => toggleFilter('price')}
                >
                    <span>Price</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isExpanded('price') && (
                    <div className={styles.dropdownContent} style={{ minWidth: 300 }}>
                        {renderPriceFilter()}
                    </div>
                )}
            </div>

            {config.filters?.showBrandFilter && (availableFilters?.brands?.length ?? 0) > 0 &&
                renderDropdownFilter('Brand', 'brand', availableFilters!.brands!)
            }

            {config.filters?.showAvailabilityFilter && (availableFilters?.availability?.length ?? 0) > 0 &&
                renderDropdownFilter('Availability', 'stock', availableFilters!.availability!)
            }

            {config.filters?.showAttributeFilters && availableFilters?.attributes?.map(attr => (
                <div key={attr._id}>
                    {renderDropdownFilter(attr.name, attr.slug, attr.values)}
                </div>
            ))}

            {/* Clear All */}
            {activeFilterCount > 0 && (
                <button onClick={onClearAllFilters} className={styles.clearFiltersBtn} style={{ padding: '0.5rem 1rem' }}>
                    Clear All
                </button>
            )}
        </div>
    );

    // ============================================
    // Layout Sections (in array order from API)
    // ============================================
    // NOTE: The array order in the API response IS the correct order
    // as configured in the admin layout builder. We don't sort by 
    // the 'order' property as it may not be set correctly for all sections.
    const sections = useMemo(() => {
        return layout?.sections || [];
    }, [layout]
    );

    // Calculate grid columns based on config
    const gridColumns = config.grid?.productsPerRow || { desktop: 4, tablet: 3, mobile: 2 };

    const hasFilters = config.filters?.enabled &&
        (config.filters.position === 'left' || config.filters.position === 'right');

    const showTopFilters = config.filters?.enabled && config.filters.position === 'top';

    // State for collapsible description
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(
        config.header?.defaultExpanded || false
    );
    const [needsToggle, setNeedsToggle] = useState(false);
    const descriptionRef = React.useRef<HTMLDivElement>(null);

    // Check if description content overflows (needs show more/less toggle)
    React.useEffect(() => {
        if (descriptionRef.current && config.header?.descriptionStyle === 'collapsed') {
            // Compare scrollHeight with clientHeight to detect overflow
            const hasOverflow = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
            setNeedsToggle(hasOverflow);
        }
    }, [category.description, config.header?.descriptionStyle, isDescriptionExpanded]);

    // Render description based on position
    const renderDescription = () => {
        if (!config.header?.showDescription || !category.description) return null;

        const isCollapsed = config.header.descriptionStyle === 'collapsed';
        const showCollapsed = isCollapsed && !isDescriptionExpanded;

        return (
            <div className={styles.descriptionContent}>
                <div
                    ref={!isDescriptionExpanded ? descriptionRef : undefined}
                    className={`${styles.description} ${showCollapsed ? styles.collapsed : ''}`}
                    dangerouslySetInnerHTML={{ __html: category.description }}
                />
                {isCollapsed && needsToggle && (
                    <span
                        className={styles.descriptionToggle}
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                        {isDescriptionExpanded
                            ? (config.header.collapseLabel || 'Show less')
                            : (config.header.expandLabel || '...Read more')}
                    </span>
                )}
            </div>
        );
    };

    // ============================================
    // Module Rendering Helper
    // ============================================
    const renderModule = (module: any) => {
        // Skip invisible modules based on device (for SSR, we show all by default)
        if (module.visibility?.desktop === false) return null;

        // Handle placeholder types with actual components
        switch (module.type) {
            case 'category-header':
                // The category header is already rendered separately at the top
                // This placeholder just marks where additional header customizations could go
                return null;

            case 'category-filters':
                return (
                    <React.Fragment key={module.id}>
                        <h3 className={styles.sidebarTitle}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </h3>
                        {renderFilters()}
                    </React.Fragment>
                );

            case 'category-products':
                return (
                    <React.Fragment key={module.id}>
                        {/* Toolbar */}
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarLeft}>
                                {/* Mobile filter button */}
                                {config.filters?.enabled && (
                                    <button
                                        className={styles.mobileFilterBtn}
                                        onClick={onOpenFilterDrawer}
                                        style={{
                                            display: (config.filters?.position === 'off-canvas') ? 'flex' : undefined
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        {config.filters?.offCanvas?.buttonText || 'Filters'}
                                        {activeFilterCount > 0 && (
                                            <span className={styles.filterBadge}>{activeFilterCount}</span>
                                        )}
                                    </button>
                                )}
                                <span className={styles.productCount}>
                                    {pagination.total} products
                                </span>
                            </div>

                            {/* Sort dropdown */}
                            {config.sorting?.showSortDropdown && (
                                <div className={styles.sortDropdown}>
                                    <label>Sort by:</label>
                                    <select
                                        value={currentSort}
                                        onChange={(e) => onSortChange(e.target.value)}
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Product grid */}
                        <div
                            className={styles.productGrid}
                            style={{
                                '--cols-desktop': gridColumns.desktop,
                                '--cols-tablet': gridColumns.tablet,
                                '--cols-mobile': gridColumns.mobile,
                            } as React.CSSProperties}
                        >
                            {products.map((product, index) => (
                                <div
                                    key={product._id}
                                    className={styles.productItem}
                                    style={{ '--index': index } as React.CSSProperties}
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        {/* Loading state */}
                        {isLoading && (
                            <div className={styles.loading}>
                                <div className={styles.spinner} />
                                <span>Loading products...</span>
                            </div>
                        )}

                        {/* Empty state */}
                        {!isLoading && products.length === 0 && (
                            <div className={styles.emptyState}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <h3>{config.emptyState?.message || 'No products found'}</h3>
                                <p>Try adjusting your filters or search criteria</p>
                                {activeFilterCount > 0 && config.emptyState?.showClearFilters && (
                                    <button onClick={onClearAllFilters} className={styles.clearFiltersBtn}>
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </React.Fragment>
                );

            case 'category-pagination':
                if (isLoading || products.length === 0 || pagination.pages <= 1) return null;
                return (
                    <div key={module.id} className={styles.pagination}>
                        {config.pagination?.type === 'load-more' ? (
                            <button
                                className={styles.loadMoreBtn}
                                onClick={onLoadMore}
                                disabled={pagination.page >= pagination.pages}
                            >
                                {pagination.page >= pagination.pages ? 'No more products' : 'Load More'}
                            </button>
                        ) : config.pagination?.type === 'pagination' && (
                            <div className={`${styles.paginationNav} ${styles[config.pagination.position || 'center']}`}>
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    className={styles.pageBtn}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                    let pageNum: number;
                                    if (pagination.pages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.pages - 2) {
                                        pageNum = pagination.pages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`${styles.pageBtn} ${pageNum === pagination.page ? styles.active : ''}`}
                                            onClick={() => onPageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    className={styles.pageBtn}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {config.pagination?.showProductCount && (
                            <p className={styles.paginationInfo}>
                                Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </p>
                        )}
                    </div>
                );

            default:
                // Regular module - use ModuleRenderer
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // ============================================
    // Section Rendering Helper
    // ============================================
    const renderSection = (section: any) => {
        const sectionStyle = {
            paddingTop: section.settings?.paddingTop || 0,
            paddingBottom: section.settings?.paddingBottom || 0,
            backgroundImage: section.settings?.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
            backgroundSize: section.settings?.backgroundSize || 'cover',
            backgroundPosition: section.settings?.backgroundPosition || 'center',
        };

        // Check if this section has split columns (like split-2, split-3, etc.)
        const isSplitSection = section.type?.startsWith('split-') && section.columns?.length > 0;

        // Check if this section contains category-filters or category-products
        const hasFiltersColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'category-filters')
        );
        const hasProductsColumn = section.columns?.some((col: any) =>
            col.modules?.some((m: any) => m.type === 'category-products')
        );
        const isCategoryContentSection = hasFiltersColumn && hasProductsColumn;

        if (isSplitSection && isCategoryContentSection) {
            // This is the main category content section with filters sidebar and products
            return (
                <div
                    key={section.id}
                    className={`${styles.content} ${hasFilters ? styles.withSidebar : ''} ${config.filters?.position === 'right' ? styles.sidebarRight : ''}`}
                    style={sectionStyle}
                >
                    {section.columns.map((column: any, colIndex: number) => {
                        const isFilterColumn = column.modules?.some((m: any) => m.type === 'category-filters');
                        const isProductColumn = column.modules?.some((m: any) => m.type === 'category-products');

                        if (isFilterColumn && hasFilters) {
                            return (
                                <aside
                                    key={column.id}
                                    className={styles.sidebar}
                                    style={{ '--sidebar-width': `${config.filters?.sidebarWidth || 280}px` } as React.CSSProperties}
                                >
                                    <div className={`${styles.sidebarInner} ${config.filters?.style === 'sticky' ? styles.sticky : ''}`}>
                                        {column.modules?.map((module: any) => renderModule(module))}
                                    </div>
                                </aside>
                            );
                        }

                        if (isProductColumn) {
                            return (
                                <main key={column.id} className={styles.main}>
                                    {showTopFilters && renderHorizontalFilters()}
                                    {column.modules?.map((module: any) => renderModule(module))}
                                </main>
                            );
                        }

                        // Generic column
                        return (
                            <div key={column.id} style={{ flex: column.width || 1 }}>
                                {column.modules?.map((module: any) => renderModule(module))}
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (isSplitSection) {
            // Generic split section (not the main category content)
            return (
                <div key={section.id} className={styles.splitSection} style={sectionStyle}>
                    <div className={styles.splitColumns}>
                        {section.columns.map((column: any) => (
                            <div
                                key={column.id}
                                className={styles.splitColumn}
                                style={{ flex: column.width || 1 }}
                            >
                                {column.modules?.map((module: any) => renderModule(module))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Container section with direct modules
        return (
            <section key={section.id} className={styles.section} style={sectionStyle}>
                {section.modules?.map((module: any) => renderModule(module))}
            </section>
        );
    };

    return (
        <div className={styles.categoryPage}>
            {/* Category Header - Always rendered first */}
            <header className={styles.header}>
                {/* Background with gradient and optional image */}
                <div className={styles.headerBackground}>
                    {config.header?.showImage && category.image && (
                        <Image
                            src={category.image}
                            alt={category.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                            className={styles.headerBgImage}
                        />
                    )}
                    {/* Gradient overlay */}
                    <div className={styles.gradientOverlay} />
                    {/* Decorative floating shapes */}
                    <div className={styles.decorativeShapes}>
                        <div className={styles.shape1} />
                        <div className={styles.shape2} />
                        <div className={styles.shape3} />
                    </div>
                </div>

                {/* Header Content - Inside Container */}
                <div className={styles.headerContainer}>
                    <div className={styles.categoryInfo}>
                        {/* Breadcrumbs at top */}
                        <nav className={styles.breadcrumbs}>
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && (
                                        <svg className={styles.breadcrumbSeparator} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className={styles.breadcrumbLink}>{crumb.label}</Link>
                                    ) : (
                                        <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

                        {/* Title with animated underline */}
                        <div className={styles.titleWrapper}>
                            <h1>{category.title}</h1>
                            <div className={styles.titleDecoration} />
                        </div>

                        {/* Product count badge */}
                        <div className={styles.headerMeta}>
                            <span className={styles.productBadge}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {pagination.total} Products
                            </span>
                        </div>

                        {/* Description */}
                        {(config.header.descriptionPosition === 'top' || config.header.descriptionPosition === 'below-image') &&
                            config.header?.showDescription && category.description && (
                                <div className={styles.descriptionWrapper}>
                                    {renderDescription()}
                                </div>
                            )}
                    </div>
                </div>
            </header>

            {/* Render all sections in order */}
            {sections.map((section: any) => renderSection(section))}

            {/* Category Description at Bottom */}
            {config.header.descriptionPosition === 'bottom' && (
                <div className={styles.bottomDescription}>
                    {renderDescription()}
                </div>
            )}

            {/* Mobile Filter Drawer */}
            {isFilterDrawerOpen && (
                <div className={styles.filterDrawer}>
                    <div className={styles.drawerBackdrop} onClick={onCloseFilterDrawer} />
                    <div
                        className={`${styles.drawerContent} ${config.filters?.offCanvas?.slideFrom === 'right' ? styles.fromRight : styles.fromLeft}`}
                        style={{ '--drawer-width': `${config.filters?.offCanvas?.drawerWidth || 320}px` } as React.CSSProperties}
                    >
                        <div className={styles.drawerHeader}>
                            <h3>Filters</h3>
                            <button onClick={onCloseFilterDrawer} className={styles.closeBtn}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.drawerBody}>
                            {renderFilters()}
                        </div>
                        <div className={styles.drawerFooter}>
                            <button onClick={onClearAllFilters} className={styles.clearBtn}>
                                Clear All
                            </button>
                            <button onClick={onCloseFilterDrawer} className={styles.applyBtn}>
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
