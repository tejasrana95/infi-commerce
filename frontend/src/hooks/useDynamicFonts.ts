import { useEffect } from 'react';

/**
 * Hook to dynamically load Google Fonts for the provided font families.
 * This ensures fonts are properly loaded in Safari and other browsers.
 * 
 * @param fontFamilies - Array of font family names to load (e.g., ['Montserrat', 'Roboto'])
 */
export function useDynamicFonts(fontFamilies: string[]) {
    useEffect(() => {
        if (!fontFamilies || fontFamilies.length === 0) return;

        const uniqueFonts = new Set<string>();

        // Extract and clean font names
        fontFamilies.forEach(font => {
            if (!font) return;

            // Extract font name without quotes and fallbacks
            const fontName = font
                .split(',')[0]
                .replace(/['"]/g, '')
                .trim();

            // Skip generic font families
            if (fontName &&
                fontName !== 'sans-serif' &&
                fontName !== 'serif' &&
                fontName !== 'monospace' &&
                fontName !== 'cursive' &&
                fontName !== 'fantasy' &&
                fontName !== 'system-ui') {
                uniqueFonts.add(fontName);
            }
        });

        // Load fonts if any valid fonts found
        if (uniqueFonts.size > 0) {
            const fontFamiliesArray = Array.from(uniqueFonts).map(font => {
                const family = font.replace(/\s+/g, '+');
                return `family=${family}:wght@300;400;500;600;700;800;900`;
            });

            const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontFamiliesArray.join('&')}&display=swap`;

            // Check if link already exists
            const existingLink = document.querySelector(`link[href="${googleFontsUrl}"]`);
            if (!existingLink) {
                // Create and inject the Google Fonts link
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = googleFontsUrl;
                document.head.appendChild(link);

                // Add preconnect links if they don't exist
                if (!document.querySelector('link[href="https://fonts.googleapis.com"]')) {
                    const preconnect1 = document.createElement('link');
                    preconnect1.rel = 'preconnect';
                    preconnect1.href = 'https://fonts.googleapis.com';
                    document.head.appendChild(preconnect1);

                    const preconnect2 = document.createElement('link');
                    preconnect2.rel = 'preconnect';
                    preconnect2.href = 'https://fonts.gstatic.com';
                    preconnect2.crossOrigin = 'anonymous';
                    document.head.appendChild(preconnect2);
                }
            }
        }
    }, [fontFamilies]);
}

/**
 * Extract font families from style objects.
 * Handles nested style objects and arrays of styles.
 * 
 * @param styles - Style objects or array of style objects
 * @returns Array of font family names
 */
export function extractFontFamilies(...styles: any[]): string[] {
    const fonts: string[] = [];

    const extract = (obj: any) => {
        if (!obj) return;

        if (Array.isArray(obj)) {
            obj.forEach(extract);
        } else if (typeof obj === 'object') {
            if (obj.fontFamily) {
                fonts.push(obj.fontFamily);
            }
            if (obj.subFontFamily) {
                fonts.push(obj.subFontFamily);
            }
            // Recursively check nested objects
            Object.values(obj).forEach(value => {
                if (typeof value === 'object') {
                    extract(value);
                }
            });
        }
    };

    styles.forEach(extract);
    return fonts.filter(Boolean);
}
