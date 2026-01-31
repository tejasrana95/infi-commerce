'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import styles from './ShippingCalculator.module.scss';
import { useCurrency } from '@/hooks/useCurrency';

interface ShippingCalculatorProps {
    productId: string;
    variantId?: string;
    quantity: number;
    userDefaultCountry?: string;
    onCalculate?: (zip: string, country: string) => Promise<any>;
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
    const [zip, setZip] = useState('');
    const [countries, setCountries] = useState<GeoCountry[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const {formatPriceWithExchange} = useCurrency();

    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch countries on mount
    useEffect(() => {
        setLoadingCountries(true);
        apiClient.get('/geo?type=country&isActive=true')
            .then((res: any) => {
                setCountries(res.data || []);
            })
            .catch(err => console.error('Failed to load countries', err))
            .finally(() => setLoadingCountries(false));
    }, []);

    // Update country if userDefaultCountry changes
    useEffect(() => {
        if (userDefaultCountry) {
            setCountry(userDefaultCountry);
        }
    }, [userDefaultCountry]);

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!country) return;
        if (onCalculate) {
            onCalculate(zip, country);
        }
    };

    return (
        <div className={`${styles.shippingCalculator} ${isExpanded ? styles.expanded : ''}`}>
            <div
                className={`${styles.header} ${isExpanded ? styles.active : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={styles.title}>
                    Shipping Calculator
                </div>
                <span className={styles.toggleIcon}>
                    {isExpanded ? '−' : '+'}
                </span>
            </div>

            <div className={`${styles.content} ${isExpanded ? styles.show : ''}`}>
                <div className={styles.formContainer}>
                    <form className={styles.form} onSubmit={handleCalculate}>
                        <div className={styles.formGroup}>
                            <label>Country</label>
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                disabled={loadingCountries}
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c._id} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className={styles.btnCalculate}
                            disabled={estimate?.loading || !country}
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
