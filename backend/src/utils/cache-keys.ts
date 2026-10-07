/**
 * Cache Keys and TTL Configuration
 * 
 * Centralized cache key generators and TTL values for consistent
 * caching across the application.
 */

/**
 * Helper to get TTL (in seconds) from environment variables with fallback default.
 */
const getEnvTtl = (envVar: string, defaultSeconds: number): number => {
    const raw = process.env[envVar];
    if (raw) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return defaultSeconds;
};

/**
 * Cache TTL values (in seconds)
 * Reads from process.env with default fallbacks if not defined.
 */
export const CACHE_TTL = {
    /** Store basic info - default 1 hour */
    get STORE(): number { return getEnvTtl('CACHE_TTL_STORE', 3600); },
    /** Store settings - default 1 hour */
    get STORE_SETTINGS(): number { return getEnvTtl('CACHE_TTL_STORE_SETTINGS', 3600); },
    /** Category tree/list - default 1 hour */
    get CATEGORIES(): number { return getEnvTtl('CACHE_TTL_CATEGORIES', 3600); },
    /** Menu configurations - default 10 days */
    get MENUS(): number { return getEnvTtl('CACHE_TTL_MENUS', 864000); },
    /** Brand list - default 1 hour */
    get BRANDS(): number { return getEnvTtl('CACHE_TTL_BRANDS', 3600); },
    /** Tax rate lookups - default 1 hour */
    get TAX_RATES(): number { return getEnvTtl('CACHE_TTL_TAX_RATES', 3600); },
    /** Currency list and rates - default 1 hour */
    get CURRENCIES(): number { return getEnvTtl('CACHE_TTL_CURRENCIES', 3600); },
    /** Shipping rules - default 1 hour */
    get SHIPPING_RULES(): number { return getEnvTtl('CACHE_TTL_SHIPPING_RULES', 3600); },
    /** Page metadata - default 1 hour */
    get PAGES(): number { return getEnvTtl('CACHE_TTL_PAGES', 3600); },
    /** Layout configurations - default 1 hour */
    get LAYOUTS(): number { return getEnvTtl('CACHE_TTL_LAYOUTS', 3600); },
    /** API key validation - default 1 hour */
    get API_KEY(): number { return getEnvTtl('CACHE_TTL_API_KEY', 3600); },
    /** Domain allowed check - default 1 hour */
    get DOMAIN_CHECK(): number { return getEnvTtl('CACHE_TTL_DOMAIN_CHECK', 3600); },
    /** Testimonials - default 10 minutes */
    get TESTIMONIALS(): number { return getEnvTtl('CACHE_TTL_TESTIMONIALS', 600); },
    /** Banners/Sliders - default 5 minutes */
    get BANNERS(): number { return getEnvTtl('CACHE_TTL_BANNERS', 300); },
    /** Form configurations - default 10 minutes */
    get FORMS(): number { return getEnvTtl('CACHE_TTL_FORMS', 600); },
    /** Geo data - default 1 hour */
    get GEO(): number { return getEnvTtl('CACHE_TTL_GEO', 3600); },
    /** Product listings and detail - default 1 hour */
    get PRODUCTS(): number { return getEnvTtl('CACHE_TTL_PRODUCTS', 3600); },
    /** Blog categories and tags - default 30 minutes */
    get BLOG_CATEGORIES(): number { return getEnvTtl('CACHE_TTL_BLOG_CATEGORIES', 1800); },
    /** Blog posts listing - default 15 minutes */
    get BLOG_POSTS(): number { return getEnvTtl('CACHE_TTL_BLOG_POSTS', 900); },
    /** Blog post detail - default 1 hour */
    get BLOG_POST_DETAIL(): number { return getEnvTtl('CACHE_TTL_BLOG_POST_DETAIL', 3600); },
};

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

    // ===== Blog Keys =====
    /** Blog categories for a store with queryHash: blog:categories:${storeId}:${queryHash} */
    blogCategories: (storeId: string, queryHash: string) => `blog:categories:${storeId}:${queryHash}`,
    /** Blog category by ID: blog:category:id:${id} */
    blogCategoryById: (id: string) => `blog:category:id:${id}`,
    /** Blog posts list: blog:posts:${storeId}:${queryHash} */
    blogPostsList: (storeId: string, queryHash: string) => `blog:posts:${storeId}:${queryHash}`,
    /** Blog post by ID: blog:post:id:${id} */
    blogPostById: (id: string) => `blog:post:id:${id}`,
    /** Blog post by slug: blog:post:slug:${storeId}:${slug} */
    blogPostSlug: (storeId: string, slug: string) => `blog:post:slug:${storeId}:${slug}`,
    /** Blog popular tags: blog:tags:${storeId}:${queryHash} */
    blogTags: (storeId: string, queryHash: string) => `blog:tags:${storeId}:${queryHash}`,
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
    /** All blog cache for a store: blog:*:${storeId}* */
    allBlog: (storeId: string) => `blog:*:${storeId}*`,
    /** All blog categories for a store: blog:categories:${storeId}* */
    allBlogCategories: (storeId: string) => `blog:categories:${storeId}*`,
    /** All blog posts for a store: blog:posts:${storeId}* */
    allBlogPosts: (storeId: string) => `blog:posts:${storeId}*`,
    /** All blog tags for a store: blog:tags:${storeId}* */
    allBlogTags: (storeId: string) => `blog:tags:${storeId}*`,
};
