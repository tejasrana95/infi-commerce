'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { Store, StoreContextType, ThemeConfig, DEFAULT_TEMPLATE_ID } from '@/types';
import api from '@/lib/api';
import { detectCurrency, hasManualCurrencySelection } from '@/lib/geolocation';
import { CurrencyProvider } from './CurrencyProvider';

// ============================================
// Context Creation
// ============================================

const StoreContext = createContext<StoreContextType>({
    store: null,
    templateId: DEFAULT_TEMPLATE_ID,
    themeConfig: null,
    isLoading: false,
    error: null,
    menus: undefined,
});

// ============================================
// Custom Hook
// ============================================

export function useStore(): StoreContextType {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}

// Convenience hook for just templateId
export function useTemplateId(): string {
    const { templateId } = useStore();
    return templateId;
}

// Convenience hook for theme config
export function useThemeConfig(): ThemeConfig | null {
    const { themeConfig } = useStore();
    return themeConfig;
}

// ============================================
// Provider Props
// ============================================

interface StoreProviderProps {
    store: Store | null;
    children: React.ReactNode;
    currentCurrency?: import("@/types").Currency;
    availableCurrencies?: import("@/types").Currency[];
    menus?: Record<string, import("@/types/menu").Menu>; // SSR enriched menus
}

// ============================================
// Provider Component
// ============================================

export function StoreProvider({ store, children, currentCurrency, availableCurrencies, menus }: StoreProviderProps) {
    const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;
    const themeConfig = store?.theme || null;
    // Set store ID on API client for X-Store-ID header
    useEffect(() => {
        if (store?._id) {
            api.setStoreId(store._id);
        }
    }, [store?._id]);

    // Apply template class to body on mount/update
    // Note: CSS variables are now applied server-side in layout.tsx for better CLS
    useEffect(() => {
        if (!themeConfig) return;

        // Apply Template Class to Body
        const templateClass = `template-${templateId}`;
        document.body.classList.add(templateClass);

        // Cleanup old template classes
        document.body.classList.forEach((cls) => {
            if (cls.startsWith('template-') && cls !== templateClass) {
                document.body.classList.remove(cls);
            }
        });

        // Cleanup on unmount
        return () => {
            document.body.classList.remove(templateClass);
        };
    }, [themeConfig, templateId]);

    // State for dynamic currency updates
    // Initialize with fallback: prop -> first available currency (ensures immediate render)
    const getDefaultCurrency = () => {
        if (currentCurrency) return currentCurrency;
        if (availableCurrencies && availableCurrencies.length > 0) return availableCurrencies[0];
        return undefined;
    };

    const [activeCurrency, setActiveCurrency] = React.useState(getDefaultCurrency);
    const [isDetecting, setIsDetecting] = React.useState(false);

    // Update active currency when prop changes (hydration/SSR)
    useEffect(() => {
        if (currentCurrency) {
            setActiveCurrency(currentCurrency);
        }
    }, [currentCurrency]);

    // Auto-detect currency on first visit (non-blocking, updates reactively)
    useEffect(() => {
        const autoDetectCurrency = async () => {
            // Skip if user has manually selected a currency
            if (hasManualCurrencySelection()) {
                return;
            }

            // Skip if no available currencies
            if (!availableCurrencies || availableCurrencies.length === 0) {
                return;
            }

            setIsDetecting(true);

            try {
                const currencyCodes = availableCurrencies
                    .map(c => c.code)
                    .filter((code): code is string => code !== undefined);
                const detectedCode = await detectCurrency(currencyCodes);

                // Only update if detected currency is different from current
                const detected = availableCurrencies.find(c => c.code === detectedCode);
                if (detected && detected.code !== activeCurrency?.code) {
                    setActiveCurrency(detected);
                    // Don't set cookie - this is auto-detection, not manual selection
                }
            } catch (error) {
                console.error('Currency auto-detection failed:', error);
            } finally {
                setIsDetecting(false);
            }
        };

        autoDetectCurrency();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableCurrencies]); // Only run once on mount when currencies are available

    const setCurrency = (code: string) => {
        // Update local state immediately for dynamic UI
        const newCurrency = availableCurrencies?.find(c => c.code === code);
        if (newCurrency) {
            setActiveCurrency(newCurrency);
        }

        // Set cookie valid for 30 days (marks as manual selection)
        document.cookie = `currency=${code}; path=/; max-age=${60 * 60 * 24 * 30}`;

        // Clear auto-detection cookie since user made manual choice
        document.cookie = 'currency_auto_detected=; path=/; max-age=0';

        // No reload needed - context will propagate changes
    };

    const contextValue: StoreContextType = {
        store,
        templateId,
        themeConfig,
        isLoading: false,
        error: null,
        currentCurrency: activeCurrency,
        availableCurrencies,
        setCurrency,
        menus, // Add menus to context
    };

    return (
        <CurrencyProvider 
            initialCurrency={activeCurrency}
            availableCurrencies={availableCurrencies}
        >
            <StoreContext.Provider value={contextValue}>
                {children}
            </StoreContext.Provider>
        </CurrencyProvider>
    );
}

export default StoreProvider;
