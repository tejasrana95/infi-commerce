import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { fetchLayout, getServerStore } from '@/lib/api/server-store';
import { headers } from 'next/headers';

// Product Imports
import ProductPageClient from '@/components/slug-pages/product/ProductPageClient';
import ProductSeoShell from '@/components/seo/ProductSeoShell';

// Category Imports
import CategoryPageClient from '@/components/slug-pages/category/CategoryPageClient';
import CategoryPageSkeleton from '@/components/slug-pages/category/CategoryPageSkeleton';

// Page Imports
import StaticPageContainer from '@/components/templates/core/StaticPage/Container';
import StaticPageSeoShell from '@/components/seo/StaticPageSeoShell';
import { Suspense } from 'react';

// Revalidation
// export const revalidate = 900; // 15 minutes default
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering for multi-tenant support

interface UniversalPageProps {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function resolveSlug(storeId: string, slug: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/slug/resolve/${storeId}/${slug}`, {
            next: { revalidate: 60 }, // Cache resolution for 1 minute
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.data; // { entityType, entityId, slug } or { type: 'redirect', destination_url }
    } catch (error) {
        console.error('Failed to resolve slug:', error);
        return null;
    }
}

// Reuse existing data fetching functions (copied/adapted from original pages)
// Ideally these should be in a shared lib, but for now defining/importing here or duplicating
// We can use the existing `getProduct` etc from the original pages if they were exported, but they are not (usually local).
// So redefining them or importing `fetchCategoryPageData` etc which ARE exported.

import { fetchCategoryPageData, fetchPageBySlug } from '@/lib/api/server-store';

// Redefine getProduct helper (as it was local in product page)
async function getProduct(storeId: string, slug: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/products/slug/${storeId}/${slug}`, {
            next: { revalidate: 120 },
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.product || data;
    } catch (err) { return null; }
}

async function getProductLayout(storeId: string, slug: string) {
    try {
        const layout = await fetchLayout(storeId, 'product', slug)
        if (!layout) return null;
        return layout;
    } catch (err) { return null; }
}

async function getProductReviews(productId: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/reviews/product/${productId}?limit=1`, {
            next: { revalidate: 60 },
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.stats || null;
    } catch (err) { return null; }
}

async function getProductShippingDetails(storeId: string, productId: string, country = 'US') {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/shipping/calculate-smart`, {
            method: 'POST',
            next: { revalidate: 300 },
            headers: {
                'Content-Type': 'application/json',
                'x-store-id': storeId,
            },
            body: JSON.stringify({
                storeId,
                country,
                items: [{ productId, quantity: 1 }],
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (!data?.success || typeof data?.shippingCost !== 'number') return null;

        return {
            country,
            shippingCost: data.shippingCost,
            name: data.name,
            description: data.description,
        };
    } catch (err) {
        return null;
    }
}

export async function generateMetadata({ params }: UniversalPageProps): Promise<Metadata> {
    const { slug: slugParts } = await params;
    const slug = slugParts.join('/'); // Reconstruct slug from parts
    const store = await getServerStore();

    if (!store?._id) return { title: 'Not Found' };

    const resolved = await resolveSlug(store._id, slug);
    if (!resolved) return { title: 'Not Found' };

    const headersList = await headers();
    const requestHost = headersList.get('host');
    const domain = requestHost || ((store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002');

    if (resolved.entityType === 'product') {
        const product = await getProduct(store._id, slug);
        if (!product) return { title: 'Product Not Found' };

        const title = product.seo?.metaTitle || product.name;
        const description = product.seo?.metaDescription || product.shortDescription || product.description?.replace(/<[^>]*>/g, '').substring(0, 160);
        const image = product.seo?.ogImage || product.featuredImage || product.images?.[0];
        const canonical = `https://${domain}/${slug}`; // Flat URL

        return {
            title,
            description,
            keywords: product.seo?.metaKeywords?.join(', '),
            alternates: { canonical },
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
            robots: { index: product.isActive, follow: product.isActive },
        };
    } else if (resolved.entityType === 'category') {
        const category = await fetchCategoryPageData(store._id, slug, {}); // Just need basic category info for metadata, or fetchCategoryBySlug if exported
        // fetchCategoryPageData returns { category, ... }
        const catData = category.category;
        if (!catData) return { title: 'Category Not Found' };

        return {
            title: catData.seo?.metaTitle || `${catData.title} | ${store.name}`,
            description: catData.seo?.metaDescription || catData.description || `Browse ${catData.title} products`,
            keywords: catData.seo?.metaKeywords?.join(', '),
            alternates: { canonical: `https://${domain}/${slug}` },
            openGraph: {
                title: catData.seo?.metaTitle || catData.title,
                description: catData.seo?.metaDescription || catData.description,
                images: catData.image ? [catData.image] : [],
            },
        };
    } else if (resolved.entityType === 'page') {
        const result = await fetchPageBySlug(store._id, slug);
        if (!result || !result.data || !result.data.data) return { title: 'Page Not Found' };
        const page = result.data.data;
        return {
            title: page.seo?.metaTitle || page.title,
            description: page.seo?.metaDescription,
            keywords: page.seo?.metaKeywords,
            openGraph: {
                title: page.seo?.ogTitle || page.seo?.metaTitle || page.title,
                description: page.seo?.ogDescription || page.seo?.metaDescription,
                type: 'website',
                images: page.seo?.ogImage || page.featuredImage ? [page.seo?.ogImage || page.featuredImage] : [],
            },
            alternates: { canonical: page.seo?.canonicalUrl || `https://${domain}/${slug}` },
        };
    }

    return { title: 'Not Found' };
}

export default async function UniversalPage({ params, searchParams }: UniversalPageProps) {
    const { slug: slugParts } = await params;
    const slug = slugParts.join('/');
    const resolvedSearchParams = await searchParams;
    const store = await getServerStore();

    if (!store?._id) notFound();

    // Try to resolve slug
    const resolved = await resolveSlug(store._id, slug);

    if (!resolved) {
        // Fallback: Check if it's a legacy URL structure (e.g. valid prefixed URL but user somehow landed on [...slug]?)
        // But [...slug] captures everything. 
        // If resolution fails, it's 404.
        notFound();
    }

    // --- REDIRECT ---
    // Check if this is a redirection before rendering entities
    if (resolved.type === 'redirect') {
        const destination = resolved.destination_url;
        // Use 307 (Temporary Redirect) to preserve method and body
        redirect(destination);
        return; // TypeScript safety, though redirect() never returns
    }

    // --- PRODUCT ---
    if (resolved.entityType === 'product') {
        const [product, layout] = await Promise.all([
            getProduct(store._id, slug),
            getProductLayout(store._id, slug),
        ]);

        if (!product) notFound();

        const reviewStats = await getProductReviews(product._id);
        if (reviewStats) {
            product.averageRating = reviewStats.averageRating;
            product.reviewCount = reviewStats.totalReviews;
        }

        const shippingDetails = product.type !== 'digital'
            ? await getProductShippingDetails(store._id, product._id, 'US')
            : null;

        // Schema.org JSON-LD
        const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
        const productUrl = `https://${domain}/${slug}`;
        const condition = product?.googleMerchant?.condition || 'new';
        const conditionMap: Record<string, string> = {
            new: 'https://schema.org/NewCondition',
            refurbished: 'https://schema.org/RefurbishedCondition',
            used: 'https://schema.org/UsedCondition',
        };
        const availabilityMap: Record<string, string> = {
            in_stock: 'https://schema.org/InStock',
            out_of_stock: 'https://schema.org/OutOfStock',
            on_backorder: 'https://schema.org/BackOrder',
            made_to_order: 'https://schema.org/PreOrder',
            low_stock: 'https://schema.org/LimitedAvailability',
        };
        const priceValidUntil = product.salePriceEndDate
            ? new Date(product.salePriceEndDate).toISOString().split('T')[0]
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const offerShippingDetails = shippingDetails
            ? {
                '@type': 'OfferShippingDetails',
                shippingDestination: {
                    '@type': 'DefinedRegion',
                    addressCountry: shippingDetails.country,
                },
                shippingRate: {
                    '@type': 'MonetaryAmount',
                    value: shippingDetails.shippingCost,
                    currency: store.currency || 'USD',
                },
                name: shippingDetails.name,
                description: shippingDetails.description,
            }
            : undefined;
        const aggregateRating = (typeof product.averageRating === 'number' && (product.reviewCount || 0) > 0)
            ? {
                '@type': 'AggregateRating',
                ratingValue: Number(product.averageRating.toFixed(1)),
                reviewCount: product.reviewCount,
            }
            : undefined;
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            '@id': `${productUrl}#product`,
            url: productUrl,
            name: product.name,
            description: product.shortDescription || product.description?.replace(/<[^>]*>/g, '').substring(0, 500),
            image: product.images,
            sku: product.sku,
            brand: { '@type': 'Brand', name: product.brand ? (typeof product.brand === 'object' ? product.brand.name : product.brand) : store.name },
            offers: {
                '@type': 'Offer',
                priceCurrency: store.currency || 'USD',
                price: product.isOnSale && product.salePrice ? product.salePrice : product.price,
                priceValidUntil,
                itemCondition: conditionMap[condition] || 'https://schema.org/NewCondition',
                availability: availabilityMap[product.stockStatus] || 'https://schema.org/OutOfStock',
                shippingDetails: offerShippingDetails,
                seller: { '@type': 'Organization', name: store.name },
            },
            aggregateRating,
        };

        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <ProductSeoShell product={product} store={store} />
                <ProductPageClient product={product} layout={layout} />
            </>
        );
    }

    // --- CATEGORY ---
    if (resolved.entityType === 'category') {
        const sort = typeof resolvedSearchParams.sort === 'string'
            ? resolvedSearchParams.sort
            : store?.theme?.category?.sorting?.defaultSort || 'featured';

        const { category, products, filters, layout, pagination } = await fetchCategoryPageData(
            store._id,
            slug, // Slug is now passed directly (flat)
            { sort }
        );

        if (!category) notFound();

        return (
            <Suspense fallback={<CategoryPageSkeleton />}>
                <CategoryPageClient
                    category={category}
                    initialProducts={products}
                    initialFilters={filters}
                    initialLayout={layout}
                    initialPagination={pagination}
                />
            </Suspense>
        );
    }

    // --- PAGE ---
    if (resolved.entityType === 'page') {
        const result = await fetchPageBySlug(store._id, slug);
        if (!result || !result.data || !result.data.data) notFound();

        const page = result.data.data;
        const layout = result.layout;

        return (
            <>
                <StaticPageSeoShell page={page} storeName={store.name} />
                <StaticPageContainer page={page} initialLayout={layout} />
            </>
        );
    }

    return notFound();
}
