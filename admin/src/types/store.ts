import { ThemeConfig } from './theme';

export interface Currency {
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
    createdAt: string;
    updatedAt: string;
}

export interface Geo {
    _id: string;
    name: string;
    type: 'country' | 'state' | 'city';
    code?: string;
    parentId?: string | Geo; // Can be populated
    isActive: boolean;
    isShippingAvailable?: boolean; // Only for countries
    createdAt: string;
    updatedAt: string;
}

export interface GeoGroup {
    _id: string;
    name: string;
    storeId: string;
    description?: string;
    geos: string[]; // Deprecated, use countries
    countries?: string[];
    includeAllCountries?: boolean;
    excludedCountries?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}



export interface Store {
    _id: string;
    name: string;
    slug: string;
    domains: string[];
    description?: string;
    logo?: string;
    favicon?: string;
    currency: string;
    timezone: string;
    isActive: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        ogTitle?: string;
        ogDescription?: string;
    };
    settings?: {
        emailNotifications?: boolean;
        orderNotifications?: boolean;
        maintenanceMode?: boolean;
        allowGuestCheckout?: boolean;
        requireEmailVerification?: boolean;
        minOrderAmount?: number;
        maxOrderAmount?: number;
        shippingEnabled?: boolean;
        socialLogin?: {
            google?: {
                enabled: boolean;
                clientId?: string;
                clientSecret?: string;
            };
            facebook?: {
                enabled: boolean;
                clientId?: string;
                clientSecret?: string;
            };
        };
        [key: string]: any;
    };
    theme?: ThemeConfig;
    createdAt: string;
    updatedAt: string;
}
