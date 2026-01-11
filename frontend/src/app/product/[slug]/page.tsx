// Product Page - Server Component with SSR and SEO support
import { Metadata } from 'next';
import { notFound } from 'next/navigation';


import { getServerStore } from '@/lib/api/server-store';
import ProductPageClient from './ProductPageClient';
import ProductSeoShell from '@/components/seo/ProductSeoShell';
import { getRevalidateTime } from '@/lib/revalidation';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

// ISG: Revalidate product page based on environment configuration
// ISG: Revalidate product page (15 minutes)
export const revalidate = 900;
// This ensures customers always see current stock status and pricing

// Server-side product fetching with short cache
async function getProduct(storeId: string, slug: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
            `${apiUrl}/products/slug/${storeId}/${slug}`,
            {
                // Short cache but allow revalidation for better performance
                cache: 'no-store', // Always fetch fresh for stock accuracy
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.product || data;
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return null;
    }
}

// Server-side layout fetching (can be cached longer as it changes rarely)
async function getProductLayout(storeId: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
            `${apiUrl}/layouts?storeId=${storeId}&type=product&isDefault=true`,
            {
                next: {
                    revalidate: 3600, // Cache for 1 hour
                    tags: ['product-layout']
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.data?.[0] || null;
    } catch (error) {
        console.error('Failed to fetch product layout:', error);
        return null;
    }
}

// Server-side reviews fetching
async function getProductReviews(productId: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
            `${apiUrl}/reviews/product/${productId}?limit=1`,
            {
                next: { revalidate: 60 },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.stats || null;
    } catch (error) {
        console.error('Failed to fetch product reviews:', error);
        return null;
    }
}


// Generate SEO metadata
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();
    const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';

    if (!store?._id) {
        return { title: 'Product Not Found' };
    }

    const product = await getProduct(store._id, slug);

    if (!product) {
        return { title: 'Product Not Found' };
    }

    const title = product.seo?.metaTitle || product.name;
    const description = product.seo?.metaDescription || product.shortDescription || product.description?.replace(/<[^>]*>/g, '').substring(0, 160);
    const image = product.seo?.ogImage || product.featuredImage || product.images?.[0];
    const canonical = product.seo?.canonicalUrl || `https://${domain}/product/${slug}`;

    return {
        title,
        description,
        keywords: product.seo?.metaKeywords?.join(', '),
        alternates: {
            canonical,
        },
        openGraph: {
            title: product.seo?.ogTitle || title,
            description: product.seo?.ogDescription || description,
            images: image ? [{ url: image, width: 1200, height: 630, alt: product.name }] : [],
            type: 'website',
            url: canonical,
            siteName: store.name,
        },
        twitter: {
            card: 'summary_large_image',
            title: product.seo?.ogTitle || title,
            description: product.seo?.ogDescription || description,
            images: image ? [image] : [],
        },
        robots: {
            index: product.isActive,
            follow: product.isActive,
        },
    };
}

// Main Product Page Component (Server Component)
export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const store = await getServerStore();
    const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';

    if (!store?._id) {
        notFound();
    }

    const [product, layout] = await Promise.all([
        getProduct(store._id, slug),
        getProductLayout(store._id),
    ]);

    if (!product) {
        notFound();
    }

    // Fetch review stats separately as they might not be synced to product object yet
    const reviewStats = await getProductReviews(product._id);

    // Merge stats into product for easier use in schema generation
    if (reviewStats) {
        product.averageRating = reviewStats.averageRating;
        product.reviewCount = reviewStats.totalReviews;
    }


    // Generate JSON-LD structured data for SEO
    const productUrl = `https://${domain}/product/${slug}`;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        url: productUrl,
        name: product.name,
        description: product.shortDescription || product.description?.replace(/<[^>]*>/g, '').substring(0, 500),
        image: product.images,
        sku: product.sku,
        brand: {
            '@type': 'Brand',
            name: product.brand
                ? (typeof product.brand === 'object' ? product.brand.name : product.brand)
                : store.name,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': productUrl,
        },
        offers: {
            '@type': 'Offer',
            '@id': `${productUrl}#offer`,
            url: productUrl,
            priceCurrency: store.currency || 'USD',
            price: product.isOnSale && product.salePrice ? product.salePrice : product.price,
            priceValidUntil: product.salePriceEndDate,
            availability: product.stockStatus === 'in_stock'
                ? 'https://schema.org/InStock'
                : product.stockStatus === 'on_backorder'
                    ? 'https://schema.org/BackOrder'
                    : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                '@id': `https://${domain}/#organization`,
                name: store.name,
            },
        },
        aggregateRating: product.reviewCount > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating?.toFixed(1) || '0',
            reviewCount: product.reviewCount,
            bestRating: '5',
            worstRating: '1',
        } : undefined,
    };

    // Generate Breadcrumb JSON-LD
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `https://${domain}/`,
            },
            ...(product.categories?.length > 0 ? [{
                '@type': 'ListItem',
                position: 2,
                name: product.categories[0].title,
                item: `https://${domain}/category/${product.categories[0].slug}`,
            }] : []),
            {
                '@type': 'ListItem',
                position: product.categories?.length > 0 ? 3 : 2,
                name: product.name,
            },
        ],
    };

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* Server-Rendered SEO Shell - Critical HTML for crawlers */}
            {/* This content appears in "View Page Source" and is indexable */}
            <ProductSeoShell product={product} store={store} />

            {/* Client Component for interactive parts */}
            <ProductPageClient
                product={product}
                layout={layout}
            />
        </>
    );
}
