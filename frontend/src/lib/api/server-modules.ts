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
    name: string;
    role?: string;
    company?: string;
    content: string;
    avatar?: string;
    rating?: number;
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
        params.append('limit', (config.limit || 8).toString());
        params.append('isActive', 'true');

        if (config.source === 'custom' && config.productIds?.length) {
            params.append('ids', config.productIds.join(','));
        } else if (config.source === 'category' && config.categoryIds?.length) {
            params.append('categoryIds', config.categoryIds.join(','));
        } else if (config.source === 'best-sellers') {
            params.append('sort', 'salesCount');
        } else if (config.source === 'new-arrivals') {
            params.append('sort', 'createdAt');
        }

        const response = await fetch(`${API_BASE}/products?${params.toString()}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 60 } // Cache for 60 seconds
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
): Promise<BannerSlide[]> {
    try {
        const response = await fetch(`${API_BASE}/banner-sliders/${sliderId}`, {
            headers: { 'x-store-id': storeId },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.slides || data.bannerSlider?.slides || [];
    } catch (error) {
        console.error('Error fetching banner slider:', error);
        return [];
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
                    case 'testimonials':
                        if (module.config.testimonialIds) {
                            moduleData[module.id] = await fetchTestimonialsData(module.config.testimonialIds, storeId);
                        }
                        break;
                }
            } catch (error) {
                console.error(`Error prefetching data for module ${module.id}:`, error);
            }
        })
    );

    return moduleData;
}
