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
            title: page.seo?.metaTitle || page.title,
            description: page.seo?.metaDescription,
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
