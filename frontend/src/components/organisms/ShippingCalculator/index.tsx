'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/services/api-client';
import styles from './ShippingCalculator.module.scss';
import { useCurrency } from '@/hooks/useCurrency';
import { MapPin, ChevronDown, ChevronUp, Search, Truck } from 'lucide-react';
import { getGeoCookie } from '@/hooks/usePriceVisibility';

interface ShippingCalculatorProps {
    productId: string;
    variantId?: string;
    quantity: number;
    userDefaultCountry?: string;
    onCalculate?: (zip: string, country: string) => Promise<unknown>;
    estimate?: {
        loading: boolean;
        error?: string;
        cost?: number;
        description?: string;
        name?: string;
    };
}

interface GeoCountry {
    _id: string;
    name: string;
    code: string;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
    userDefaultCountry,
    onCalculate,
    estimate
}) => {
    const cookieCountryCode = (getGeoCookie()?.country_code || '').trim().toUpperCase();
    const [country, setCountry] = useState(userDefaultCountry || cookieCountryCode || '');
    const [countryInput, setCountryInput] = useState(userDefaultCountry || '');
    const [countries, setCountries] = useState<GeoCountry[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [hasLoadedCountries, setHasLoadedCountries] = useState(false);
    const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
    const { formatPriceWithExchange } = useCurrency();
    const [isExpanded, setIsExpanded] = useState(false);
    const isUserInteracted = React.useRef(false);

    const normalizedCountryInput = countryInput.trim().toLowerCase();
    const countriesByCode = useMemo(() => {
        const codeMap = new Map<string, GeoCountry>();
        for (const c of countries) {
            codeMap.set(c.code.toUpperCase(), c);
        }
        return codeMap;
    }, [countries]);

    const syncCountryFromCookie = useCallback(() => {
        if (isUserInteracted.current) return;
        if (country.trim() || countryInput.trim()) return;
        if (!cookieCountryCode) return;
        setCountry(cookieCountryCode);
        if (hasLoadedCountries) {
            const matchedCountry = countriesByCode.get(cookieCountryCode);
            if (matchedCountry) {
                setCountryInput(matchedCountry.name);
            }
        }
    }, [country, countryInput, cookieCountryCode, hasLoadedCountries, countriesByCode]);

    useEffect(() => {
        syncCountryFromCookie();
    }, [syncCountryFromCookie]);

    const ensureCountriesLoaded = useCallback(async () => {
        if (hasLoadedCountries || loadingCountries) return;
        setLoadingCountries(true);
        try {
            const res = await apiClient.get('/geo?type=country&isActive=true&limit=200') as { data?: GeoCountry[] };
            setCountries(res.data || []);
            setHasLoadedCountries(true);
        } catch (err) {
            console.error('Failed to load countries', err);
        } finally {
            setLoadingCountries(false);
        }
    }, [hasLoadedCountries, loadingCountries]);

    useEffect(() => {
        if (!cookieCountryCode || hasLoadedCountries) return;
        ensureCountriesLoaded();
    }, [cookieCountryCode, hasLoadedCountries, ensureCountriesLoaded]);

    useEffect(() => {
        if (isUserInteracted.current) return;
        if (!hasLoadedCountries || !countries.length || !country) return;

        const normalizedCountryCode = country.trim().toUpperCase();
        const normalizedInput = countryInput.trim().toUpperCase();

        if (normalizedInput && normalizedInput !== normalizedCountryCode) return;

        const matchedCountry = countriesByCode.get(normalizedCountryCode);
        if (!matchedCountry) return;

        if (countryInput !== matchedCountry.name) {
            setCountryInput(matchedCountry.name);
        }
    }, [hasLoadedCountries, countries.length, country, countryInput, countriesByCode]);

    const handleCalculate = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        syncCountryFromCookie();

        let selectedCountryCode = (country || cookieCountryCode || '').trim().toUpperCase();
        const trimmedInput = countryInput.trim();

        if (trimmedInput) {
            const matched = countries.find(
                c => c.name.toLowerCase() === trimmedInput.toLowerCase() || c.code.toLowerCase() === trimmedInput.toLowerCase()
            );
            // If countries are not loaded yet, keep an existing country/code instead of clearing it.
            selectedCountryCode = (matched?.code || selectedCountryCode || trimmedInput).toUpperCase();
            setCountry(selectedCountryCode);
            if (matched) {
                setCountryInput(matched.name);
            }
        }

        if (!selectedCountryCode) return;
        if (onCalculate) {
            onCalculate('', selectedCountryCode);
        }
    }, [country, cookieCountryCode, countryInput, countries, onCalculate, syncCountryFromCookie]);

    const filteredCountries = useMemo(() => {
        if (!normalizedCountryInput) {
            return countries.slice(0, 12);
        }
        return countries
            .filter((c) => c.name.toLowerCase().includes(normalizedCountryInput) || c.code.toLowerCase().includes(normalizedCountryInput))
            .slice(0, 12);
    }, [countries, normalizedCountryInput]);

    const hasCountrySelection = Boolean(countryInput.trim() || country.trim() || cookieCountryCode);

    const handleHeaderClick = useCallback(() => {
        const nextExpanded = !isExpanded;
        setIsExpanded(nextExpanded);
        if (nextExpanded) {
            syncCountryFromCookie();
            ensureCountriesLoaded();
        }
    }, [isExpanded, syncCountryFromCookie, ensureCountriesLoaded]);

    const handleCountryFocus = useCallback(() => {
        setShowCountrySuggestions(true);
        ensureCountriesLoaded();
    }, [ensureCountriesLoaded]);

    return (
        <div className={`${styles.modernShippingWrapper} ${isExpanded ? styles.expanded : ''}`} data-ga-location="product_page" data-ga-widget="shipping_calculator">
            <button
                type="button"
                className={`${styles.locationHeader} infi-track`}
                onClick={handleHeaderClick}
                data-ga-action={isExpanded ? 'collapse' : 'expand'}
                data-ga-label="Shipping Calculator"
            >
                <div className={styles.locationInfo}>
                    <MapPin className={styles.locIcon} size={18} />
                    <span className={styles.locText}>
                        {hasCountrySelection ? `Deliver to ${countryInput || country}` : 'Estimate Shipping'}
                    </span>
                </div>
                <div className={styles.headerRight}>
                    {estimate?.cost !== undefined && !estimate?.loading && (
                        <span className={styles.costPreview}>{formatPriceWithExchange(estimate.cost)}</span>
                    )}
                    {isExpanded ? <ChevronUp className={styles.chevron} size={16} /> : <ChevronDown className={styles.chevron} size={16} />}
                </div>
            </button>

            <div className={`${styles.collapseContent} ${isExpanded ? styles.show : ''}`}>
                <div className={styles.contentBody}>
                    <form className={styles.formArea} onSubmit={handleCalculate}>
                        <div className={styles.inputGroup}>
                            <div className={styles.searchWrapper}>
                                <Search className={styles.searchIcon} size={14} />
                                <input
                                    type="text"
                                    className={styles.countryInput}
                                    value={countryInput}
                                    onChange={(e) => {
                                        isUserInteracted.current = true;
                                        const val = e.target.value;
                                        setCountryInput(val);
                                        if (!val.trim()) {
                                            setCountry('');
                                        }
                                        setShowCountrySuggestions(true);
                                    }}
                                    onFocus={handleCountryFocus}
                                    onBlur={() => {
                                        setTimeout(() => setShowCountrySuggestions(false), 150);
                                    }}
                                    placeholder={loadingCountries ? 'Loading regions...' : 'Search for your country...'}
                                    disabled={loadingCountries}
                                    autoComplete="off"
                                />
                            </div>

                            {showCountrySuggestions && isExpanded && !loadingCountries && filteredCountries.length > 0 && (
                                <div className={styles.autocompleteList}>
                                    {filteredCountries.map((c) => (
                                        <button
                                            key={c._id}
                                            type="button"
                                            className={styles.autocompleteItem}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setCountry(c.code);
                                                setCountryInput(c.name);
                                                setShowCountrySuggestions(false);
                                            }}
                                        >
                                            <MapPin className={styles.itemIcon} size={14} />
                                            <span className={styles.itemName}>{c.name}</span>
                                            <span className={styles.itemCode}>{c.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={`${styles.updateBtn} infi-track`}
                            disabled={Boolean(estimate?.loading) || !hasCountrySelection}
                            data-ga-action="calculate_shipping"
                        >
                            {estimate?.loading ? 'Calculating...' : 'Update'}
                        </button>
                    </form>

                    {estimate?.loading && (
                        <div className={styles.statusBox}>
                            <div className={styles.spinner} />
                            Fetching latest rates...
                        </div>
                    )}

                    {estimate?.error && (
                        <div className={`${styles.statusBox} ${styles.errorBox}`}>
                            {estimate.error}
                        </div>
                    )}

                    {!estimate?.loading && estimate?.cost !== undefined && (
                        <div className={styles.estimateCard}>
                            <div className={styles.estimateHeader}>
                                <Truck className={styles.truckIcon} size={24} />
                                <div className={styles.estimateTitles}>
                                    <h4 className={styles.methodName}>{estimate.name || 'Standard Delivery'}</h4>
                                    {estimate.description && <p className={styles.methodDesc}>{estimate.description}</p>}
                                </div>
                            </div>
                            <div className={styles.estimatePrice}>
                                {formatPriceWithExchange(estimate.cost)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShippingCalculator;
