// Server-side module data fetching
// These functions fetch data for page modules server-side to enable SSR and prevent CLS
// Note: These functions should only be called from Server Components

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    averageRating?: number;
    reviewCount?: number;
    isNew?: boolean;
    inStock?: boolean;
}

interface BannerSlide {
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    buttonText?: string;
}

interface Testimonial {
    _id: string;
    customerName: string;
    customerTitle?: string;
    customerImage?: string;
    productPurchased?: string;
    content: string;
    rating?: number;
    company?: string;
}

/**
 * Fetch products for modules (ProductCarousel, ProductGrid)
 */
export async function fetchProductsForModule(
    config: {
        source?: string;
        limit?: number;
        categoryIds?: string[];
        productIds?: string[];
    },
    storeId: string
): Promise<Product[]> {
    try {
        const params = new URLSearchParams();
        params.append('isActive', 'true');
        params.append('limit', (config.limit || 8).toString());

        if (config.source === 'custom' && config.productIds?.length) {
            params.append('ids', config.productIds.join(','));
        } else if (config.source === 'category' && config.categoryIds?.length) {
            params.append('categoryIds', config.categoryIds.join(','));
        } else if (config.source === 'best-sellers') {
            params.append('sort', 'best-selling');
        } else if (config.source === 'new-arrivals') {
            params.append('sort', 'newest');
        } else if (config.source === 'random') {
            params.append('sort', 'random');
        }

        // Random source caches for a full day (matches backend's daily seed).
        const revalidateSeconds = config.source === 'random' ? 86400 : 300;

        const response = await fetch(`${API_BASE}/products?${params.toString()}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: revalidateSeconds }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : data.products || [];
    } catch (error) {
        console.error('Error fetching products for module:', error);
        return [];
    }
}

/**
 * Fetch banner slider data
 */
export async function fetchBannerSliderData(
    sliderId: string,
    storeId: string
): Promise<any> {
    try {
        const response = await fetch(`${API_BASE}/banner-sliders/${sliderId}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.slider || data;
    } catch (error) {
        console.error('Error fetching banner slider:', error);
        return null;
    }
}

/**
 * Fetch hero slider data
 */
export async function fetchHeroSliderData(
    sliderId: string,
    storeId: string
): Promise<any> {
    try {
        const response = await fetch(`${API_BASE}/hero-sliders/${sliderId}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.slider || data;
    } catch (error) {
        console.error('Error fetching hero slider:', error);
        return null;
    }
}

/**
 * Fetch testimonials data
 */
export async function fetchTestimonialsData(
    testimonialIds: string[],
    storeId: string
): Promise<Testimonial[]> {
    try {
        if (!testimonialIds?.length) return [];

        const params = new URLSearchParams();
        params.append('ids', testimonialIds.join(','));

        const response = await fetch(`${API_BASE}/testimonials?${params.toString()}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : data.testimonials || [];
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }
}
/**
 * Fetch blog posts for modules (BlogGrid, RecentPosts)
 */
export async function fetchBlogPostsForModule(
    config: {
        numberOfPosts?: number;
        filterByCategory?: string;
        filterByTag?: string;
        sortBy?: string;
        showFeaturedOnly?: boolean;
    },
    storeId: string
): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        params.append('limit', (config.numberOfPosts || 6).toString());
        params.append('status', 'published');

        if (config.filterByCategory) params.append('category', config.filterByCategory);
        if (config.filterByTag) params.append('tag', config.filterByTag);
        if (config.showFeaturedOnly) params.append('featured', 'true');
        if (config.sortBy) params.append('sortBy', config.sortBy);

        const response = await fetch(`${API_BASE}/blog/posts?${params.toString()}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching blog posts for module:', error);
        return [];
    }
}

/**
 * Pre-fetch all module data for a layout
 * Returns a map of moduleId -> data
 */
export async function prefetchModuleData(
    modules: Array<{ id: string; type: string; config: any }>,
    storeId: string
): Promise<Record<string, any>> {
    const moduleData: Record<string, any> = {};

    await Promise.all(
        modules.map(async (module) => {
            try {
                switch (module.type) {
                    case 'product-carousel':
                    case 'product-grid':
                        moduleData[module.id] = await fetchProductsForModule(module.config, storeId);
                        break;
                    case 'banner-slider':
                        if (module.config.sliderId) {
                            moduleData[module.id] = await fetchBannerSliderData(module.config.sliderId, storeId);
                        }
                        break;
                    case 'hero-slider':
                        if (module.config.sliderId) {
                            moduleData[module.id] = await fetchHeroSliderData(module.config.sliderId, storeId);
                        }
                        break;
                    case 'testimonials':
                        if (module.config.testimonialIds) {
                            moduleData[module.id] = await fetchTestimonialsData(module.config.testimonialIds, storeId);
                        }
                        break;
                    case 'blog-grid':
                    case 'blog-listing':
                    case 'recent-posts':
                    case 'popular-posts':
                        moduleData[module.id] = await fetchBlogPostsForModule(module.config, storeId);
                        break;
                }
            } catch (error) {
                console.error(`Error prefetching data for module ${module.id}:`, error);
            }
        })
    );

    return moduleData;
}
