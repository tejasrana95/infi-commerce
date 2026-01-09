// ============================================
// Geo-location based Currency Detection
// ============================================

// Comprehensive currency mapping by country code (ISO 3166-1 alpha-2)
// Each country can have multiple currency preferences in priority order
// Format: 'COUNTRY_CODE': ['PRIMARY', 'SECONDARY', ...] or 'SINGLE_CURRENCY'
type CurrencyPreference = string | string[];

const COUNTRY_TO_CURRENCY: Record<string, CurrencyPreference> = {
    // === AMERICAS ===

    // North America
    'US': 'USD',
    'CA': 'CAD',
    'MX': ['MXN', 'USD'],

    // Central America & Caribbean
    'BZ': ['BZD', 'USD'], 'CR': ['CRC', 'USD'], 'SV': 'USD',
    'GT': ['GTQ', 'USD'], 'HN': ['HNL', 'USD'], 'NI': ['NIO', 'USD'],
    'PA': ['PAB', 'USD'], 'BS': ['BSD', 'USD'], 'BB': ['BBD', 'USD'],
    'CU': ['CUP', 'USD'], 'DO': ['DOP', 'USD'], 'HT': ['HTG', 'USD'],
    'JM': ['JMD', 'USD'], 'TT': ['TTD', 'USD'],

    // South America
    'AR': ['ARS', 'USD'], 'BO': ['BOB', 'USD'], 'BR': ['BRL', 'USD'],
    'CL': ['CLP', 'USD'], 'CO': ['COP', 'USD'], 'EC': 'USD',
    'GY': ['GYD', 'USD'], 'PY': ['PYG', 'USD'], 'PE': ['PEN', 'USD'],
    'SR': ['SRD', 'USD'], 'UY': ['UYU', 'USD'], 'VE': ['VES', 'USD'],

    // === EUROPE ===

    // United Kingdom & Dependencies
    'GB': 'GBP', 'GG': 'GBP', 'IM': 'GBP', 'JE': 'GBP',

    // Eurozone (19 core countries)
    'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR', 'EE': 'EUR', 'FI': 'EUR',
    'FR': 'EUR', 'DE': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'IT': 'EUR',
    'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR',
    'PT': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'ES': 'EUR',

    // Other European countries using EUR
    'AD': 'EUR', 'MC': 'EUR', 'SM': 'EUR', 'VA': 'EUR', 'ME': 'EUR', 'XK': 'EUR',

    // Non-Eurozone Europe (with EUR as preferred alternative)
    'AL': ['ALL', 'EUR', 'USD'], // Albania: Lek → Euro → USD
    'BY': ['BYN', 'EUR', 'USD'], // Belarus: Ruble → Euro → USD
    'BA': ['BAM', 'EUR', 'USD'], // Bosnia: Mark → Euro → USD
    'BG': ['BGN', 'EUR', 'USD'], // Bulgaria: Lev → Euro → USD
    'HR': 'EUR', // Croatia (joined Eurozone 2023)
    'CZ': ['CZK', 'EUR', 'USD'], // Czech Republic: Koruna → Euro → USD
    'DK': ['DKK', 'EUR', 'USD'], // Denmark: Krone → Euro → USD
    'HU': ['HUF', 'EUR', 'USD'], // Hungary: Forint → Euro → USD
    'IS': ['ISK', 'EUR', 'USD'], // Iceland: Króna → Euro → USD
    'LI': ['CHF', 'EUR', 'USD'], // Liechtenstein: Franc → Euro → USD
    'MK': ['MKD', 'EUR', 'USD'], // North Macedonia: Denar → Euro → USD
    'MD': ['MDL', 'EUR', 'USD'], // Moldova: Leu → Euro → USD
    'NO': ['NOK', 'EUR', 'USD'], // Norway: Krone → Euro → USD
    'PL': ['PLN', 'EUR', 'USD'], // Poland: Złoty → Euro → USD
    'RO': ['RON', 'EUR', 'USD'], // Romania: Leu → Euro → USD
    'RU': ['RUB', 'EUR', 'USD'], // Russia: Ruble → Euro → USD
    'RS': ['RSD', 'EUR', 'USD'], // Serbia: Dinar → Euro → USD
    'SE': ['SEK', 'EUR', 'USD'], // Sweden: Krona → Euro → USD
    'CH': ['CHF', 'EUR', 'USD'], // Switzerland: Franc → Euro → USD
    'TR': ['TRY', 'EUR', 'USD'], // Turkey: Lira → Euro → USD
    'UA': ['UAH', 'EUR', 'USD'], // Ukraine: Hryvnia → Euro → USD

    // === ASIA ===

    // South Asia
    'IN': 'INR',
    'AF': ['AFN', 'USD'], 'BD': ['BDT', 'USD'], 'BT': ['BTN', 'INR', 'USD'],
    'MV': ['MVR', 'USD'], 'NP': ['NPR', 'INR', 'USD'], 'PK': ['PKR', 'USD'],
    'LK': ['LKR', 'USD'],

    // Southeast Asia
    'BN': ['BND', 'USD'], 'KH': ['KHR', 'USD'], 'ID': ['IDR', 'USD'],
    'LA': ['LAK', 'USD'], 'MY': ['MYR', 'USD'], 'MM': ['MMK', 'USD'],
    'PH': ['PHP', 'USD'], 'SG': ['SGD', 'USD'], 'TH': ['THB', 'USD'],
    'TL': 'USD', 'VN': ['VND', 'USD'],

    // East Asia
    'CN': ['CNY', 'USD'], 'HK': ['HKD', 'USD'], 'JP': ['JPY', 'USD'],
    'KP': ['KPW', 'USD'], 'KR': ['KRW', 'USD'], 'MO': ['MOP', 'USD'],
    'MN': ['MNT', 'USD'], 'TW': ['TWD', 'USD'],

    // Central Asia
    'KZ': ['KZT', 'USD'], 'KG': ['KGS', 'USD'], 'TJ': ['TJS', 'USD'],
    'TM': ['TMT', 'USD'], 'UZ': ['UZS', 'USD'],

    // Middle East
    'AE': ['AED', 'USD'], 'BH': ['BHD', 'USD'], 'IQ': ['IQD', 'USD'],
    'IR': ['IRR', 'USD'], 'IL': ['ILS', 'USD'], 'JO': ['JOD', 'USD'],
    'KW': ['KWD', 'USD'], 'LB': ['LBP', 'USD'], 'OM': ['OMR', 'USD'],
    'PS': ['ILS', 'USD'], 'QA': ['QAR', 'USD'], 'SA': ['SAR', 'USD'],
    'SY': ['SYP', 'USD'], 'YE': ['YER', 'USD'],

    // === AFRICA ===

    // North Africa
    'DZ': ['DZD', 'EUR', 'USD'], 'EG': ['EGP', 'USD'], 'LY': ['LYD', 'USD'],
    'MA': ['MAD', 'EUR', 'USD'], 'SD': ['SDG', 'USD'], 'TN': ['TND', 'EUR', 'USD'],
    'EH': ['MAD', 'EUR', 'USD'],

    // West Africa
    'BJ': ['XOF', 'USD'], 'BF': ['XOF', 'USD'], 'CV': ['CVE', 'EUR', 'USD'],
    'CI': ['XOF', 'USD'], 'GM': ['GMD', 'USD'], 'GH': ['GHS', 'USD'],
    'GN': ['GNF', 'USD'], 'GW': ['XOF', 'USD'], 'LR': ['LRD', 'USD'],
    'ML': ['XOF', 'USD'], 'MR': ['MRU', 'USD'], 'NE': ['XOF', 'USD'],
    'NG': ['NGN', 'USD'], 'SN': ['XOF', 'USD'], 'SL': ['SLL', 'USD'],
    'TG': ['XOF', 'USD'],

    // Central Africa
    'AO': ['AOA', 'USD'], 'CM': ['XAF', 'USD'], 'CF': ['XAF', 'USD'],
    'TD': ['XAF', 'USD'], 'CG': ['XAF', 'USD'], 'CD': ['CDF', 'USD'],
    'GQ': ['XAF', 'USD'], 'GA': ['XAF', 'USD'], 'ST': ['STN', 'USD'],

    // East Africa
    'BI': ['BIF', 'USD'], 'KM': ['KMF', 'USD'], 'DJ': ['DJF', 'USD'],
    'ER': ['ERN', 'USD'], 'ET': ['ETB', 'USD'], 'KE': ['KES', 'USD'],
    'MG': ['MGA', 'USD'], 'MW': ['MWK', 'USD'], 'MU': ['MUR', 'USD'],
    'MZ': ['MZN', 'USD'], 'RE': 'EUR', 'RW': ['RWF', 'USD'],
    'SC': ['SCR', 'USD'], 'SO': ['SOS', 'USD'], 'SS': ['SSP', 'USD'],
    'TZ': ['TZS', 'USD'], 'UG': ['UGX', 'USD'], 'ZM': ['ZMW', 'USD'],
    'ZW': ['ZWL', 'USD'],

    // Southern Africa
    'BW': ['BWP', 'USD'], 'LS': ['LSL', 'ZAR', 'USD'], 'NA': ['NAD', 'ZAR', 'USD'],
    'ZA': ['ZAR', 'USD'], 'SZ': ['SZL', 'ZAR', 'USD'],

    // === OCEANIA ===

    // Australia & New Zealand
    'AU': 'AUD', 'NZ': 'NZD',

    // Pacific Islands
    'FJ': ['FJD', 'AUD', 'USD'], 'NC': ['XPF', 'AUD', 'USD'],
    'PG': ['PGK', 'AUD', 'USD'], 'SB': ['SBD', 'AUD', 'USD'],
    'VU': ['VUV', 'AUD', 'USD'], 'WS': ['WST', 'AUD', 'USD'],
    'TO': ['TOP', 'AUD', 'USD'], 'TV': ['AUD', 'USD'], 'KI': ['AUD', 'USD'],
    'NR': ['AUD', 'USD'], 'PW': 'USD', 'FM': 'USD', 'MH': 'USD',
    'MP': 'USD', 'GU': 'USD', 'AS': 'USD', 'PF': ['XPF', 'EUR', 'USD'],
    'WF': ['XPF', 'EUR', 'USD'],

    // === TERRITORIES & DEPENDENCIES ===

    // US Territories
    'PR': 'USD', 'VI': 'USD', 'UM': 'USD',

    // UK Territories
    'AI': ['XCD', 'USD'], 'BM': ['BMD', 'USD'], 'IO': 'USD', 'VG': 'USD',
    'KY': ['KYD', 'USD'], 'FK': ['FKP', 'GBP', 'USD'], 'GI': ['GIP', 'GBP', 'EUR', 'USD'],
    'MS': ['XCD', 'USD'], 'PN': ['NZD', 'USD'], 'SH': ['SHP', 'GBP', 'USD'],
    'GS': 'GBP', 'TC': 'USD',

    // French Territories
    'BL': 'EUR', 'GF': 'EUR', 'GP': 'EUR', 'MF': 'EUR', 'MQ': 'EUR',
    'PM': 'EUR', 'YT': 'EUR', 'TF': 'EUR',

    // Netherlands Territories
    'AW': ['AWG', 'USD'], 'BQ': 'USD', 'CW': ['ANG', 'USD'], 'SX': ['ANG', 'USD'],

    // Other Territories
    'AX': 'EUR', 'CK': ['NZD', 'USD'], 'FO': ['DKK', 'EUR', 'USD'],
    'GL': ['DKK', 'EUR', 'USD'], 'NU': ['NZD', 'USD'], 'SJ': ['NOK', 'EUR', 'USD'],
    'TK': ['NZD', 'USD'],
};

const FALLBACK_CURRENCY = 'USD';

interface GeolocationData {
    country_code?: string;
    country?: string;
}

/**
 * Get cookie value by name
 */
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

/**
 * Set cookie with expiry
 */
function setCookie(name: string, value: string, days: number = 30): void {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60; // Convert days to seconds
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

/**
 * Select the best available currency from a list of preferences
 */
function selectBestCurrency(preferences: string[], availableCurrencies: string[]): string {
    // Try each preference in order
    for (const currency of preferences) {
        if (availableCurrencies.includes(currency)) {
            return currency;
        }
    }
    // If none match, return USD fallback
    return FALLBACK_CURRENCY;
}

/**
 * Detect user's location and return appropriate currency
 * Uses ipapi.co free tier (1000 requests/day, no API key required)
 * Falls back to api.country.is if ipapi.co fails
 * 
 * Logic:
 * 1. Detect country code
 * 2. Get currency preferences for country (e.g., CZ → [CZK, EUR, USD])
 * 3. Check each preference in order against available currencies
 * 4. Return first match, or USD if none match
 */
export async function detectCurrency(
    availableCurrencies: string[]
): Promise<string> {
    try {

        // Check if we already have a stored currency in cookie
        const storedCurrency = getCookie('currency');
        if (storedCurrency) {
            return storedCurrency;
        }

        // Testing override for development
        const forceCountry = process.env.NEXT_PUBLIC_FORCE_COUNTRY;

        if (forceCountry) {
            const preferences = COUNTRY_TO_CURRENCY[forceCountry];
            const currencyList = Array.isArray(preferences) ? preferences : [preferences];
            const finalCurrency = selectBestCurrency(currencyList, availableCurrencies);

            if (typeof window !== 'undefined') {
                localStorage.setItem('currency_auto_detected', finalCurrency);
                localStorage.setItem('user_country', forceCountry);
                localStorage.setItem('currency_preferences', JSON.stringify(currencyList));
            }
            return finalCurrency;
        }

        let countryCode: string | null = null;

        // Try primary API (ipapi.co)
        try {
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000), // 3 second timeout
            });
            console.log('No stored currency found, detecting...', response);
            if (response.ok) {
                const data: GeolocationData = await response.json();
                countryCode = data.country_code || null;
            }
        } catch (error) {
            console.warn('Primary geolocation API failed, trying fallback...', error);
        }

        // Fallback API (api.country.is) - free, no limits
        if (!countryCode) {
            try {
                const response = await fetch('https://api.country.is/', {
                    signal: AbortSignal.timeout(3000),
                });

                if (response.ok) {
                    const data: GeolocationData = await response.json();
                    countryCode = data.country || null;
                }
            } catch (error) {
                console.warn('Fallback geolocation API failed', error);
            }
        }

        // If both APIs failed, use fallback currency
        if (!countryCode) {
            console.warn('All geolocation APIs failed, using fallback currency');
            return FALLBACK_CURRENCY;
        }

        // Get currency preferences for country
        const preferences = COUNTRY_TO_CURRENCY[countryCode];
        const currencyList = preferences
            ? (Array.isArray(preferences) ? preferences : [preferences])
            : [FALLBACK_CURRENCY];

        // Select best available currency from preferences
        const finalCurrency = selectBestCurrency(currencyList, availableCurrencies);

        // Store the detected currency in cookie
        setCookie('currency', finalCurrency);

        return finalCurrency;
    } catch (error) {
        console.error('Currency auto-detection failed:', error);
        return FALLBACK_CURRENCY;
    }
}

/**
 * Check if user has manually selected a currency
 */
export function hasManualCurrencySelection(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if currency cookie exists (set by manual selection)
    const cookies = document.cookie.split(';');
    return cookies.some(cookie => cookie.trim().startsWith('currency='));
}

/**
 * Clear auto-detection cache (useful for testing)
 */
export function clearCurrencyCache(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('currency_auto_detected');
    localStorage.removeItem('user_country');
    localStorage.removeItem('currency_preferences');
}

/**
 * Get the detected currency (for debugging/display)
 */
export function getDetectedCurrency(): string | null {
    return getCookie('currency');
}
