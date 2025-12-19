'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { Store, StoreContextType, ThemeConfig, DEFAULT_TEMPLATE_ID } from '@/types';

// ============================================
// Context Creation
// ============================================

const StoreContext = createContext<StoreContextType>({
    store: null,
    templateId: DEFAULT_TEMPLATE_ID,
    themeConfig: null,
    isLoading: false,
    error: null,
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
}

// ============================================
// Provider Component
// ============================================

export function StoreProvider({ store, children, currentCurrency, availableCurrencies }: StoreProviderProps) {
    const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;
    const themeConfig = store?.theme || null;

    // Apply CSS variables and body class on mount/update
    useEffect(() => {
        if (!themeConfig) return;

        const root = document.documentElement;

        // Apply Colors as CSS Variables
        if (themeConfig.colors) {
            const colors = themeConfig.colors;
            if (colors.primary) root.style.setProperty('--color-primary', colors.primary);
            if (colors.secondary) root.style.setProperty('--color-secondary', colors.secondary);
            if (colors.accent) root.style.setProperty('--color-accent', colors.accent);
            if (colors.background) root.style.setProperty('--color-background', colors.background);
            if (colors.text) root.style.setProperty('--color-text', colors.text);
            if (colors.headerBg) root.style.setProperty('--color-header-bg', colors.headerBg);
            if (colors.footerBg) root.style.setProperty('--color-footer-bg', colors.footerBg);
        }

        // Apply Fonts as CSS Variables
        if (themeConfig.fonts) {
            const fonts = themeConfig.fonts;
            if (fonts.heading) root.style.setProperty('--font-heading', fonts.heading);
            if (fonts.body) root.style.setProperty('--font-body', fonts.body);
        }

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
    const [activeCurrency, setActiveCurrency] = React.useState(currentCurrency);

    // Update active currency when prop changes (hydration/SSR)
    useEffect(() => {
        if (currentCurrency) {
            setActiveCurrency(currentCurrency);
        }
    }, [currentCurrency]);

    const setCurrency = (code: string) => {
        // Update local state immediately for dynamic UI
        const newCurrency = availableCurrencies?.find(c => c.code === code);
        if (newCurrency) {
            setActiveCurrency(newCurrency);
        }

        // Set cookie valid for 30 days
        document.cookie = `currency=${code}; path=/; max-age=${60 * 60 * 24 * 30}`;

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
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
}

export default StoreProvider;
