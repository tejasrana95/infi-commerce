'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '@/services/api-client';
import { Currency } from '@/types';

interface CurrencyContextType {
    baseCurrency: Currency | null;
    currencies: Currency[];
    currentCurrency: Currency | null;
    loading: boolean;
    formatPrice: (amount: number, currencyCode?: string) => string;
    convertPrice: (amount: number, toCurrency: string, exchangeRate?: number) => number;
    convertAndFormat: (amount: number, toCurrency: string, exchangeRate: number) => string;
    formatPriceWithExchange: (amount: number) => string;
    getCurrencyByCode: (code: string) => Currency | undefined;
    setCurrency: (currency: Currency | string) => void;
    refetch: () => Promise<void>;
}

const defaultContext: CurrencyContextType = {
    baseCurrency: null,
    currencies: [],
    currentCurrency: null,
    loading: true,
    formatPrice: (amount) => `$${amount?.toFixed(2)}`,
    convertPrice: (amount) => amount,
    convertAndFormat: (amount) => `$${amount?.toFixed(2)}`,
    formatPriceWithExchange: (amount) => `$${amount?.toFixed(2)}`,
    getCurrencyByCode: () => undefined,
    setCurrency: () => { },
    refetch: async () => { },
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

interface CurrencyProviderProps {
    children: ReactNode;
    initialCurrency?: Currency;
    availableCurrencies?: Currency[];
}

export function CurrencyProvider({
    children,
    initialCurrency,
    availableCurrencies
}: CurrencyProviderProps) {
    const [baseCurrency, setBaseCurrency] = useState<Currency | null>(initialCurrency || null);
    const [currencies, setCurrencies] = useState<Currency[]>(availableCurrencies || []);
    const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(initialCurrency || null);
    const [loading, setLoading] = useState(!initialCurrency && !availableCurrencies);

    const fetchCurrencies = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch all currencies
            const currenciesRes = await apiClient.get('/currencies');
            const allCurrencies = currenciesRes.data.currencies || currenciesRes.data || [];
            setCurrencies(allCurrencies);

            // Try to get base currency from endpoint
            try {
                const baseRes = await apiClient.get('/currencies/base');
                if (baseRes.data?.currency) {
                    setBaseCurrency(baseRes.data.currency);
                    setCurrentCurrency(baseRes.data.currency);
                }
            } catch {
                // If endpoint fails, find base currency from list
                const base = allCurrencies.find((c: Currency) => c.isBaseCurrency);
                setBaseCurrency(base || null);
                setCurrentCurrency(base || null);
            }
        } catch (error) {
            console.error('Failed to fetch currencies:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch currencies on mount if not provided
    useEffect(() => {
        if (!initialCurrency || availableCurrencies?.length === 0) {
            fetchCurrencies();
        }
    }, []);

    // Sync currentCurrency when initialCurrency prop changes (from StoreProvider)
    useEffect(() => {
        if (initialCurrency) {
            setCurrentCurrency(initialCurrency);
        }
    }, [initialCurrency?.code]);

    const getCurrencyByCode = useCallback(
        (code: string): Currency | undefined => {
            if (!Array.isArray(currencies)) return undefined;
            return currencies.find((c) => c.code === code);
        },
        [currencies]
    );

    const formatPrice = useCallback(
        (amount: number = 0, currencyCode?: string): string => {
            let currency: Currency | null | undefined;
            
            if (currencyCode) {
                currency = currencies.find((c) => c.code === currencyCode);
            } else {
                currency = currentCurrency;
            }

            if (!currency) {
                // Fallback formatting if no currency data
                return `$${amount?.toFixed(2)}`;
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
        [currentCurrency, currencies]
    );

    const convertPrice = useCallback(
        (amount: number, toCurrency: string, exchangeRate?: number): number => {

            // If no base currency or same as current, return as-is
            if (!currentCurrency || toCurrency === currentCurrency.code) {
                return amount;
            }

            const to = currencies.find((c) => c.code === toCurrency);
            if (!to) {
                return amount;
            }

            // Convert: amount * target exchangeRate
            const convertedAmount = amount * (exchangeRate || to.exchangeRate || 1);

            return parseFloat(convertedAmount?.toFixed(to.decimalPlaces || 2));
        },
        [currentCurrency, currencies]
    );

    const formatPriceWithExchange = useCallback(
        (amount: number): string => {
            const currency = currentCurrency;
            if (!currency || !currency.exchangeRate) {
                return `${amount?.toFixed(2)}`;
            }
            const convertedAmount = amount * currency.exchangeRate;
            return formatPrice(convertedAmount, currency.code);
        },
        [formatPrice, currentCurrency]
    );

    // Combined function: convert from current currency and format in one call
    const convertAndFormat = useCallback(
        (amount: number, currency: string, exchangeRate: number): string => {
            const convertedAmount = amount * exchangeRate;
            return formatPrice(convertedAmount, currency);
        },
        [formatPrice]
    );

    const setCurrency = useCallback((currency: Currency | string) => {
        if (typeof currency === 'string') {
            const found = currencies.find((c) => c.code === currency);
            if (found) {
                setCurrentCurrency(found);
            }
        } else {
            setCurrentCurrency(currency);
        }
    }, [currencies]);

    const value = React.useMemo(() => ({
        baseCurrency,
        currencies,
        currentCurrency,
        loading,
        formatPrice,
        convertPrice,
        convertAndFormat,
        formatPriceWithExchange,
        getCurrencyByCode,
        setCurrency,
        refetch: fetchCurrencies,
    }), [
        baseCurrency,
        currencies,
        currentCurrency,
        loading,
        formatPrice,
        convertPrice,
        convertAndFormat,
        formatPriceWithExchange,
        getCurrencyByCode,
        setCurrency,
        fetchCurrencies,
    ]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency(): CurrencyContextType {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

export default CurrencyContext;
