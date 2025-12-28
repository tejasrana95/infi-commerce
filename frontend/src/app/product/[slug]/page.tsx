// Product Page - Server Component with SSR and SEO support
import { Metadata } from 'next';
import { notFound } from 'next/navigation';


import { getServerStore } from '@/lib/api/server-store';
import ProductPageClient from './ProductPageClient';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

// Server-side product fetching
async function getProduct(storeId: string, slug: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
            `${apiUrl}/products/slug/${storeId}/${slug}`,
            {
                next: { revalidate: 60 }, // Revalidate every minute
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

// Server-side layout fetching
async function getProductLayout(storeId: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
            `${apiUrl}/layouts?storeId=${storeId}&type=product&isDefault=true`,
            {
                next: { revalidate: 300 }, // Cache for 5 minutes
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

// Generate SEO metadata
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();

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
    const canonical = product.seo?.canonicalUrl || `https://${store.domain}/product/${slug}`;

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

    // Generate JSON-LD structured data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.description?.replace(/<[^>]*>/g, '').substring(0, 500),
        image: product.images,
        sku: product.sku,
        brand: product.brand ? {
            '@type': 'Brand',
            name: product.brand,
        } : undefined,
        offers: {
            '@type': 'Offer',
            url: `https://${store.domain}/product/${slug}`,
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
                item: `https://${store.domain}/`,
            },
            ...(product.categories?.length > 0 ? [{
                '@type': 'ListItem',
                position: 2,
                name: product.categories[0].title,
                item: `https://${store.domain}/category/${product.categories[0].slug}`,
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

            {/* Client Component for interactive parts */}
            <ProductPageClient
                product={product}
                layout={layout}
            />
        </>
    );
}
