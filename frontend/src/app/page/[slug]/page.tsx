import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerStore, fetchPageBySlug } from '@/lib/api/server-store';
import StaticPageContainer from '@/components/templates/core/StaticPage/Container';
import StaticPageSeoShell from '@/components/seo/StaticPageSeoShell';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for static pages at build time
export async function generateStaticParams() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        // Fetch all stores
        const storesRes = await fetch(`${apiUrl}/stores`, {
            next: { revalidate: false }
        });

        if (!storesRes.ok) return [];

        const storesData = await storesRes.json();
        const stores = Array.isArray(storesData) ? storesData : storesData.data || [];

        const paths = [];

        // For each store, fetch published pages
        for (const store of stores) {
            try {
                const pagesRes = await fetch(
                    `${apiUrl}/pages?storeId=${store._id}&status=published`,
                    { next: { revalidate: false } }
                );

                if (pagesRes.ok) {
                    const pagesData = await pagesRes.json();
                    const pages = pagesData.data || [];

                    for (const page of pages) {
                        if (page.slug) {
                            paths.push({ slug: page.slug });
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch pages for store ${store._id}:`, error);
            }
        }

        console.log(`Generated ${paths.length} static pages`);
        return paths;
    } catch (error) {
        console.error('Failed to generate static params for pages:', error);
        return [];
    }
}

// Revalidate every hour
export const revalidate = 3600;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        return { title: 'Page Not Found' };
    }

    const result = await fetchPageBySlug(store._id, slug);

    if (!result || !result.data.data) {
        return { title: 'Page Not Found' };
    }

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
        alternates: {
            canonical: page.seo?.canonicalUrl,
        },
    };
}

export default async function StaticPage({ params }: PageProps) {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        notFound();
    }

    const result = await fetchPageBySlug(store._id, slug);

    if (!result || !result.data || !result.data.data) {
        notFound();
    }

    const page = result.data.data;
    const layout = result.layout;

    return (
        <>
            {/* Server-Rendered SEO Shell */}
            <StaticPageSeoShell page={page} storeName={store.name} />

            {/* Client Component for interactive parts */}
            <StaticPageContainer page={page} initialLayout={layout} />
        </>
    );
}
