'use client';

import React, { useState } from 'react';
import { apiClient } from '@/services/api-client';
import styles from './ShippingCalculator.module.scss';
import { useCurrency } from '@/hooks/useCurrency';
import { Plus, Minus } from 'lucide-react';

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
    productId,
    variantId,
    quantity,
    userDefaultCountry,
    onCalculate,
    estimate
}) => {
    const [country, setCountry] = useState(userDefaultCountry || '');
    const [countryInput, setCountryInput] = useState(userDefaultCountry || '');
    const [zip, setZip] = useState('');
    const [countries, setCountries] = useState<GeoCountry[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [hasLoadedCountries, setHasLoadedCountries] = useState(false);
    const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
    const { formatPriceWithExchange } = useCurrency();

    const [isExpanded, setIsExpanded] = useState(false);

    const ensureCountriesLoaded = async () => {
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
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        let selectedCountryCode = country;

        if (countryInput) {
            const matched = countries.find(
                c => c.name.toLowerCase() === countryInput.trim().toLowerCase() || c.code.toLowerCase() === countryInput.trim().toLowerCase()
            );
            selectedCountryCode = matched?.code || '';
            setCountry(selectedCountryCode);
            if (matched) {
                setCountryInput(matched.name);
            }
        }

        if (!selectedCountryCode) return;
        if (onCalculate) {
            onCalculate(zip, selectedCountryCode);
        }
    };

    const filteredCountries = countries
        .filter((c) => {
            const query = countryInput.trim().toLowerCase();
            if (!query) return true;
            return c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
        })
        .slice(0, 12);

    return (
        <div className={`${styles.shippingCalculator} ${isExpanded ? styles.expanded : ''}`} data-ga-location="product_page" data-ga-widget="shipping_calculator">
            <div
                className={`${styles.header} ${isExpanded ? styles.active : ''} infi-track`}
                onClick={() => {
                    const nextExpanded = !isExpanded;
                    setIsExpanded(nextExpanded);
                    if (nextExpanded) {
                        ensureCountriesLoaded();
                    }
                }}
                data-ga-action={isExpanded ? 'collapse' : 'expand'}
                data-ga-label="Shipping Calculator"
            >
                <div className={styles.title}>
                    Shipping Calculator
                </div>
                <span className={styles.toggleIcon}>
                    {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                </span>
            </div>

            <div className={`${styles.content} ${isExpanded ? styles.show : ''}`}>
                <div className={styles.formContainer}>
                    <form className={styles.form} onSubmit={handleCalculate}>
                        <div className={styles.formGroup}>
                            <label>Country</label>
                            <div className={styles.autocomplete}>
                                <input
                                    type="text"
                                    value={countryInput}
                                    onChange={(e) => {
                                        setCountryInput(e.target.value);
                                        setShowCountrySuggestions(true);
                                    }}
                                    onFocus={() => {
                                        setShowCountrySuggestions(true);
                                        ensureCountriesLoaded();
                                    }}
                                    onBlur={() => {
                                        // Delay close to allow option click
                                        setTimeout(() => setShowCountrySuggestions(false), 120);
                                    }}
                                    placeholder={loadingCountries ? 'Loading countries...' : 'Search country'}
                                    disabled={loadingCountries}
                                />

                                {showCountrySuggestions && isExpanded && !loadingCountries && filteredCountries.length > 0 && (
                                    <div className={styles.suggestions}>
                                        {filteredCountries.map((c) => (
                                            <button
                                                key={c._id}
                                                type="button"
                                                className={styles.suggestionItem}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setCountry(c.code);
                                                    setCountryInput(c.name);
                                                    setShowCountrySuggestions(false);
                                                }}
                                            >
                                                <span className={styles.countryName}>{c.name}</span>
                                                <span className={styles.countryCode}>{c.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`${styles.btnCalculate} infi-track`}
                            disabled={estimate?.loading || !countryInput.trim()}
                            data-ga-action="calculate_shipping"
                            data-ga-label={`Calculate Shipping for ${countryInput || country}`}
                        >
                            {estimate?.loading ? 'Calculating...' : 'Calculate'}
                        </button>
                    </form>

                    {estimate?.loading && (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            Calculating shipping rates...
                        </div>
                    )}

                    {estimate?.error && (
                        <div className={styles.error}>
                            {estimate.error}
                        </div>
                    )}

                    {!estimate?.loading && estimate?.cost !== undefined && (
                        <div className={styles.results}>
                            <div className={styles.resultItem}>
                                <span className={styles.label}>Shipping Method:</span>
                                <span className={styles.value}>{estimate.name || 'Standard Shipping'}</span>
                            </div>
                            {estimate.description && (
                                <div className={styles.resultItem}>
                                    <span className={styles.label}>Description:</span>
                                    <span className={styles.value}>{estimate.description}</span>
                                </div>
                            )}
                            <div className={`${styles.resultItem} ${styles.total}`}>
                                <span className={styles.label}>Shipping Cost:</span>
                                <span className={styles.value}>{formatPriceWithExchange(estimate.cost)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShippingCalculator;
