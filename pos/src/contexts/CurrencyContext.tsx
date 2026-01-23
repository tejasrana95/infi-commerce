'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '@/lib/apiClient';
import { useStore } from './StoreContext';

interface Currency {
    _id: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    isBaseCurrency: boolean;
    isActive: boolean;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
}

interface CurrencyContextType {
    baseCurrency: Currency | null;
    currencies: Currency[];
    loading: boolean;
    formatPrice: (amount: number, currencyCode?: string) => string;
    convertPrice: (amount: number, toCurrency: string, exchangeRate?: number) => number;
    convertAndFormat: (amount: number, toCurrency?: string, exchangeRate?: number) => string;
    getCurrencyByCode: (code: string) => Currency | undefined;
    refetch: () => Promise<void>;
}

const defaultContext: CurrencyContextType = {
    baseCurrency: null,
    currencies: [],
    loading: true,
    formatPrice: (amount) => `$${amount.toFixed(2)}`,
    convertPrice: (amount) => amount,
    convertAndFormat: (amount) => `$${amount.toFixed(2)}`,
    getCurrencyByCode: () => undefined,
    refetch: async () => { },
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { store } = useStore();
    const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCurrencies = useCallback(async () => {
        try {
            // Fetch all currencies
            const currenciesRes = await apiClient.get('/currencies');
            const allCurrencies = currenciesRes.data.currencies || currenciesRes.data || [];
            setCurrencies(allCurrencies);

            // Determine base currency: prioritize store currency, then global base, then first in list
            const storeCurrencyCode = store?.currency?.toUpperCase();
            if (storeCurrencyCode) {
                const storeCurrency = allCurrencies.find((c: Currency) => c.code === storeCurrencyCode);
                if (storeCurrency) {
                    setBaseCurrency(storeCurrency);
                    return;
                }
            }

            // Fallback to global base currency
            const globalBase = allCurrencies.find((c: Currency) => c.isBaseCurrency);
            setBaseCurrency(globalBase || allCurrencies[0] || null);
        } catch (error) {
            console.error('Failed to fetch currencies:', error);
        } finally {
            setLoading(false);
        }
    }, [store?.currency]);

    useEffect(() => {
        fetchCurrencies();
    }, [fetchCurrencies]);

    const getCurrencyByCode = useCallback(
        (code: string): Currency | undefined => {
            if (!Array.isArray(currencies)) return undefined;
            return currencies.find((c) => c.code === code);
        },
        [currencies]
    );

    const formatPrice = useCallback(
        (amount: number, currencyCode?: string): string => {
            // Use specified currency or fall back to base currency
            const currency = currencyCode
                ? getCurrencyByCode(currencyCode)
                : baseCurrency;
            if (!currency) {
                // Fallback formatting if no currency data
                return `$${amount.toFixed(2)}`;
            }

            // Format the number
            const decimalPlaces = currency.decimalPlaces ?? 2;
            const parts = amount.toFixed(decimalPlaces).split('.');

            // Add thousands separator
            const integerPart = parts[0].replace(
                /\B(?=(\d{3})+(?!\d))/g,
                currency.thousandsSeparator || ','
            );

            // Combine with decimal separator
            const formattedNumber = parts[1]
                ? `${integerPart}${currency.decimalSeparator || '.'}${parts[1]}`
                : integerPart;

            // Position symbol
            if (currency.symbolPosition === 'after') {
                return `${formattedNumber}${currency.symbol}`;
            }
            return `${currency.symbol}${formattedNumber}`;
        },
        [baseCurrency, getCurrencyByCode]
    );

    const convertPrice = useCallback(
        (amount: number, toCurrency: string, exchangeRate?: number): number => {
            // If no base currency or same as target, return as-is
            if (!baseCurrency || toCurrency === baseCurrency.code) {
                return amount;
            }

            const to = getCurrencyByCode(toCurrency);
            if (!to) {
                return amount;
            }

            // Base currency always has exchangeRate of 1
            // Convert: amount * target exchangeRate
            const convertedAmount = amount * (exchangeRate || to.exchangeRate);

            return parseFloat(convertedAmount.toFixed(to.decimalPlaces || 2));
        },
        [baseCurrency, getCurrencyByCode]
    );

    // Combined function: convert from base currency and format in one call
    const convertAndFormat = useCallback(
        (amount: number, toCurrency?: string, exchangeRate?: number): string => {
            // If no target currency specified, use base currency (no conversion, just format)
            if (!toCurrency || toCurrency === baseCurrency?.code) {
                return formatPrice(amount);
            }
            // Convert and then format
            const converted = convertPrice(amount, toCurrency, exchangeRate);
            return formatPrice(converted, toCurrency);
        },
        [baseCurrency, formatPrice, convertPrice]
    );

    return (
        <CurrencyContext.Provider
            value={{
                baseCurrency,
                currencies,
                loading,
                formatPrice,
                convertPrice,
                convertAndFormat,
                getCurrencyByCode,
                refetch: fetchCurrencies,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

export default CurrencyContext;
