'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig } from '../types/theme';

interface StoreThemeContextType {
    themeConfig?: ThemeConfig;
    templateId?: string;
}

const StoreThemeContext = createContext<StoreThemeContextType>({});

export const useStoreTheme = () => useContext(StoreThemeContext);

interface StoreThemeProviderProps {
    themeConfig?: ThemeConfig;
    children: React.ReactNode;
}

export default function StoreThemeProvider({ themeConfig, children }: StoreThemeProviderProps) {
    // Only access document in useEffect to avoid hydration mismatches
    useEffect(() => {
        if (!themeConfig) return;

        const root = document.documentElement;

        // Apply Colors
        if (themeConfig.colors) {
            if (themeConfig.colors.primary) root.style.setProperty('--color-primary', themeConfig.colors.primary);
            if (themeConfig.colors.secondary) root.style.setProperty('--color-secondary', themeConfig.colors.secondary);
            if (themeConfig.colors.accent) root.style.setProperty('--color-accent', themeConfig.colors.accent);
            if (themeConfig.colors.background) root.style.setProperty('--color-background', themeConfig.colors.background);
            if (themeConfig.colors.text) root.style.setProperty('--color-text', themeConfig.colors.text);
        }

        // Apply Fonts
        if (themeConfig.fonts) {
            if (themeConfig.fonts.heading) root.style.setProperty('--font-heading', themeConfig.fonts.heading);
            if (themeConfig.fonts.body) root.style.setProperty('--font-body', themeConfig.fonts.body);
        }

        // Apply Template ID to Body
        if (themeConfig.templateId) {
            document.body.classList.add(`template-${themeConfig.templateId}`);

            // Cleanup old classes
            const classes = document.body.classList;
            classes.forEach(c => {
                if (c.startsWith('template-') && c !== `template-${themeConfig.templateId}`) {
                    classes.remove(c);
                }
            });
        }

    }, [themeConfig]);

    return (
        <StoreThemeContext.Provider value={{ themeConfig, templateId: themeConfig?.templateId }}>
            {children}
        </StoreThemeContext.Provider>
    );
}
