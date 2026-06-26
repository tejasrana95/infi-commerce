/**
 * Cache Keys and TTL Configuration
 * 
 * Centralized cache key generators and TTL values for consistent
 * caching across the application.
 */

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
    /** Store basic info - 1 hour */
    STORE: 3600,
    /** Store settings - 1 hour (may change more often) */
    STORE_SETTINGS: 3600,
    /** Category tree/list - 1 hour */
    CATEGORIES: 3600,
    /** Menu configurations - 2 hours (rarely change) */
    MENUS: 864000,
    /** Brand list - 1 hour */
    BRANDS: 3600,
    /** Tax rate lookups - 1 hour */
    TAX_RATES: 3600,
    /** Currency list and rates - 1 hour */
    CURRENCIES: 3600,
    /** Shipping rules - 1 hour */
    SHIPPING_RULES: 3600,
    /** Page metadata - 1 hour */
    PAGES: 3600,
    /** Layout configurations - 1 hour */
    LAYOUTS: 3600,
    /** API key validation - 1 hour */
    API_KEY: 3600,
    /** Domain allowed check - 1 hour (domains rarely change) */
    DOMAIN_CHECK: 3600,
    /** Testimonials - 10 minutes */
    TESTIMONIALS: 600,
    /** Banners/Sliders - 5 minutes */
    BANNERS: 300,
    /** Form configurations - 10 minutes */
    FORMS: 600,
    /** Geo data - 1 hour (country/state data is static) */
    GEO: 3600,
    /** Product listings and detail - 1 hour */
    PRODUCTS: 3600,
} as const;

/**
 * Cache key generators
 * 
 * Use these functions to generate consistent cache keys across the app.
 * Keys follow the pattern: entity:identifier[:sub-identifier]
 */
export const CacheKeys = {
    // ===== Store Keys =====
    /** Store by ID: store:{storeId} */
    store: (storeId: string) => `store:${storeId}`,
    /** Store settings: store:{storeId}:settings */
    storeSettings: (storeId: string) => `store:${storeId}:settings`,
    /** Store by domain lookup: store:domain:{domain} */
    storeByDomain: (domain: string) => `store:domain:${domain}`,

    // ===== Category Keys =====
    /** All categories for a store: categories:{storeId} */
    categories: (storeId: string) => `categories:${storeId}`,
    /** Category tree for a store: categories:{storeId}:tree */
    categoryTree: (storeId: string) => `categories:${storeId}:tree`,
    /** Single category by ID: category:{categoryId} */
    category: (categoryId: string) => `category:${categoryId}`,
    /** Category by slug: category:{storeId}:{slug} */
    categoryBySlug: (storeId: string, slug: string) => `category:${storeId}:${slug}`,

    // ===== Menu Keys =====
    /** All menus for a store: menus:{storeId} */
    menus: (storeId: string) => `menus:${storeId}`,
    /** Single menu by ID: menu:{menuId} */
    menu: (menuId: string) => `menu:${menuId}`,
    /** Menu by slug: menu:{storeId}:{slug} */
    menuBySlug: (storeId: string, slug: string) => `menu:${storeId}:${slug}`,

    // ===== Brand Keys =====
    /** All brands for a store: brands:{storeId} */
    brands: (storeId: string) => `brands:${storeId}`,
    /** Single brand by ID: brand:{brandId} */
    brand: (brandId: string) => `brand:${brandId}`,

    // ===== Tax Rate Keys =====
    /** All tax rates: taxrates:all */
    taxRates: () => `taxrates:all`,
    /** Single tax rate by ID: taxrate:{taxRateId} */
    taxRate: (taxRateId: string) => `taxrate:${taxRateId}`,

    // ===== Currency Keys =====
    /** All active currencies: currencies:all */
    currencies: () => `currencies:all`,
    /** Currency by code: currency:{code} */
    currencyByCode: (code: string) => `currency:${code.toUpperCase()}`,
    /** Base currency: currency:base */
    baseCurrency: () => `currency:base`,

    // ===== Shipping Keys =====
    /** Shipping rules for a store: shipping:{storeId} */
    shippingRules: (storeId: string) => `shipping:${storeId}`,

    // ===== Page Keys =====
    /** All pages for a store: pages:{storeId} */
    pages: (storeId: string) => `pages:${storeId}`,
    /** Single page by ID: page:{pageId} */
    page: (pageId: string) => `page:${pageId}`,
    /** Page by slug: page:{storeId}:{slug} */
    pageBySlug: (storeId: string, slug: string) => `page:${storeId}:${slug}`,

    // ===== Layout Keys =====
    /** All layouts for a store: layouts:{storeId} */
    layouts: (storeId: string) => `layouts:${storeId}`,
    /** Layout by page type: layout:{storeId}:{pageType} */
    layout: (storeId: string, pageType: string) => `layout:${storeId}:${pageType}`,
    /** Header layout: header:{storeId} */
    header: (storeId: string) => `header:${storeId}`,
    /** Footer layout: footer:{storeId} */
    footer: (storeId: string) => `footer:${storeId}`,

    // ===== API Key & Domain Keys =====
    /** API key by hash: apikey:{hash} */
    apiKeyByHash: (hash: string) => `apikey:${hash}`,
    /** Domain allowed check: domain:{domain} */
    domainAllowed: (domain: string) => `domain:${domain}`,

    // ===== Other Entity Keys =====
    /** Testimonials for a store: testimonials:{storeId} */
    testimonials: (storeId: string) => `testimonials:${storeId}`,
    /** Banners for a store: banners:{storeId} */
    banners: (storeId: string) => `banners:${storeId}`,
    /** Hero sliders for a store: herosliders:{storeId} */
    heroSliders: (storeId: string) => `herosliders:${storeId}`,
    /** Forms for a store: forms:{storeId} */
    forms: (storeId: string) => `forms:${storeId}`,
    /** Geo countries: geo:countries */
    geoCountries: () => `geo:countries`,
    /** Geo states for country: geo:states:{countryCode} */
    geoStates: (countryCode: string) => `geo:states:${countryCode}`,

    // ===== Product Keys =====
    /** Product by ID: product:id:${productId} */
    productId: (productId: string) => `product:id:${productId}`,
    /** Product by Slug: product:slug:${storeId}:${slug} */
    productSlug: (storeId: string, slug: string) => `product:slug:${storeId}:${slug}`,
    /** Products list: products:list:${storeId}:${channel}:${queryHash} */
    productsList: (storeId: string, channel: string, queryHash: string) => `products:list:${storeId}:${channel}:${queryHash}`,
};

/**
 * Invalidation patterns for bulk clearing
 * 
 * Use these patterns with deleteByPattern() to clear related cache entries.
 * The '*' wildcard matches any characters.
 */
export const InvalidationPatterns = {
    /** All store-related cache: store:{storeId}* */
    allStore: (storeId: string) => `store:${storeId}*`,
    /** All categories for a store: categories:{storeId}* and category:{storeId}:* */
    allCategories: (storeId: string) => `categories:${storeId}*`,
    /** All cached category list responses */
    allCategoryLists: () => `categories:list:*`,
    /** Single category patterns */
    categoryById: (categoryId: string) => `category:${categoryId}*`,
    /** All menus for a store: menus:{storeId}* and menu:{storeId}:* */
    allMenus: (storeId: string) => `menus:${storeId}*`,
    /** All brands for a store: brands:{storeId}* */
    allBrands: (storeId: string) => `brands:${storeId}*`,
    /** All tax rates: taxrate* */
    allTaxRates: () => `taxrate*`,
    /** All currencies: currency* */
    allCurrencies: () => `currency*`,
    /** All shipping for a store: shipping:{storeId}* */
    allShipping: (storeId: string) => `shipping:${storeId}*`,
    /** All pages for a store: pages:{storeId}* and page:{storeId}:* */
    allPages: (storeId: string) => `pages:${storeId}*`,
    /** All layouts for a store: layouts:{storeId}* and layout:{storeId}:* */
    allLayouts: (storeId: string) => `layout*:${storeId}*`,
    /** All headers/footers for a store */
    allHeadersFooters: (storeId: string) => `header:${storeId}*`,
    /** All testimonials for a store */
    allTestimonials: (storeId: string) => `testimonials:${storeId}*`,
    /** All banners for a store */
    allBanners: (storeId: string) => `banners:${storeId}*`,
    /** All domain checks */
    allDomains: () => `domain:*`,
    /** All products for a store: products:list:${storeId}* */
    allProductsList: (storeId: string) => `products:list:${storeId}*`,
};
