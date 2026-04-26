'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useAuth } from '@/providers/AuthProvider';

// ============================================
// Types
// ============================================

interface GeoData {
    country_code?: string;
    region_code?: string;  // state/province code
    city?: string;
    source?: string; // e.g. 'cloudflare', 'ipapi', etc.
}

interface PriceVisibilityResult {
    /** Whether price should be displayed */
    shouldShowPrice: boolean;
    /** Message to show when price is hidden */
    hiddenMessage: string;
    /** Link for the Contact Us button (shown when price is hidden) */
    contactUsLink: string;
    /** Whether the check is still loading (geo detection in progress) */
    isLoading: boolean;
}

// ============================================
// Cookie Utilities (Simple Encryption)
// ============================================

const GEO_COOKIE_NAME = 'geo_data';
const GEO_COOKIE_EXPIRY_DAYS = 1;

// Simple encoding (not cryptographic encryption, just obfuscation)
function encodeData(data: GeoData): string {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
}

function decodeData(encoded: string): GeoData | null {
    try {
        const json = decodeURIComponent(atob(encoded));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60; // Convert days to seconds
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getGeoCookie(): GeoData | null {
    const encoded = getCookie(GEO_COOKIE_NAME);
    if (!encoded) return null;
    return decodeData(encoded);
}

function setGeoCookie(data: GeoData): void {
    const encoded = encodeData(data);
    setCookie(GEO_COOKIE_NAME, encoded, GEO_COOKIE_EXPIRY_DAYS);
}

// ============================================
// Geo Detection Cache
// ============================================

let geoCache: GeoData | null = null;
let geoPromise: Promise<GeoData> | null = null;

async function detectGeo(): Promise<GeoData> {
    // Check cookie first (1-day cache)
    const cookieData = getGeoCookie();
    if (cookieData) {
        geoCache = cookieData;
        return geoCache;
    }

    // Return in-memory cached result
    if (geoCache) return geoCache;

    // Return existing promise if detection is in progress
    if (geoPromise) return geoPromise;

    geoPromise = (async () => {
        try {
            // Use our backend endpoint which checks Cloudflare headers first
            // This provides instant response when behind Cloudflare
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/geo/detect`, {
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) throw new Error('Geo detection failed');

            const data = await response.json();
            geoCache = {
                country_code: data.country_code,
                region_code: data.region_code,
                city: data.city,
            };

            // Store in cookie for 1 day
            setGeoCookie(geoCache);

            return geoCache;
        } catch {
            // On failure, return empty data (don't block price display)
            geoCache = {};
            return geoCache;
        }
    })();

    return geoPromise;
}

// ============================================
// Hook
// ============================================

/**
 * Hook to determine if prices should be shown based on store settings.
 *
 * Checks (in order):
 * 1. Master toggle: if showPrice is false, prices are always hidden
 * 2. Authentication: if hideForUnauthenticated, prices hidden for guests
 * 3. Geo restrictions: if visitor matches any geo rule, prices hidden
 */
export function usePriceVisibility(): PriceVisibilityResult {
    const { store } = useStore();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [geoData, setGeoData] = useState<GeoData | null>(geoCache);
    const [geoLoading, setGeoLoading] = useState(false);

    const settings = (store as any)?.priceVisibility;

    // Default message
    const hiddenMessage = settings?.hiddenPriceMessage || 'Login to View Price';

    // Check if we need geo detection
    const hasGeoRestrictions = (settings?.geoRestrictions?.length ?? 0) > 0;

    useEffect(() => {
        // Only detect geo if there are geo restrictions AND showPrice is true
        if (!hasGeoRestrictions || !settings?.showPrice) return;
        if (geoCache) {
            setGeoData(geoCache);
            return;
        }

        setGeoLoading(true);
        detectGeo().then((data) => {
            setGeoData(data);
            setGeoLoading(false);
        });
    }, [hasGeoRestrictions, settings?.showPrice]);

    const hasStoredAuthToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

    const isUserAuthenticated = isAuthenticated || hasStoredAuthToken;

    const shouldShowPrice = useMemo(() => {
        // If no settings configured, default to showing price
        if (!settings) return true;

        // 1. Master toggle check
        if (!settings.showPrice) return false;

        // 2. Authentication check
        if (settings.hideForUnauthenticated && !isUserAuthenticated) return false;

        // If user is authenticated, always show price regardless of geo restrictions.
        if (isUserAuthenticated) return true;

        // 3. Geo restriction check
        if (hasGeoRestrictions && geoData) {
            const restrictions = settings.geoRestrictions!;
            for (const rule of restrictions) {
                // Skip invalid rules
                if (!rule) continue;

                // Determine which fields are filled in the rule
                const hasCountry = (rule.countryCodes?.length ?? 0) > 0;
                const hasState = (rule.stateCodes?.length ?? 0) > 0;
                const hasCity = (rule.cityNames?.length ?? 0) > 0;

                // Check matches only for filled fields
                const countryMatch = hasCountry
                    ? rule.countryCodes!.some((code: string) =>
                        code.toUpperCase() === geoData.country_code?.toUpperCase()
                    )
                    : true; // If not specified, consider it a match

                const stateMatch = hasState
                    ? rule.stateCodes!.some((code: string) =>
                        code.toUpperCase() === geoData.region_code?.toUpperCase()
                    )
                    : true; // If not specified, consider it a match

                const cityMatch = hasCity
                    ? rule.cityNames!.some((name: string) =>
                        name.toLowerCase() === geoData.city?.toLowerCase()
                    )
                    : true; // If not specified, consider it a match

                // Strict matching based on which fields are filled
                if (hasCountry && hasState && hasCity) {
                    // All three fields filled → all three must match
                    if (countryMatch && stateMatch && cityMatch) return false;
                } else if (hasCountry && hasState) {
                    // Only country and state filled → both must match
                    if (countryMatch && stateMatch) return false;
                } else if (hasCountry) {
                    // Only country filled → country must match
                    if (countryMatch) return false;
                }
                // If no fields are filled, the rule doesn't apply
            }
        }

        return true;
    }, [settings, isUserAuthenticated, geoData, hasGeoRestrictions]);

    // Contact link
    const contactUsLink = settings?.contactUsLink || '/contact-us';

    return {
        shouldShowPrice,
        hiddenMessage,
        contactUsLink,
        isLoading: authLoading || geoLoading,
    };
}
