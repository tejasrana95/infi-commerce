import { Metadata } from 'next';
import { getServerStore, fetchBlogPageData } from '@/lib/api/server-store';
import BlogListingContainer from '@/components/templates/core/BlogListing/Container';
import BlogListSeoShell from '@/components/seo/BlogListSeoShell';

interface BlogPageProps {
    searchParams: Promise<{
        page?: string;
        category?: string;
        tag?: string;
        search?: string;
    }>;
}

import { headers } from 'next/headers';

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
    const params = await searchParams;
    const store = await getServerStore();
    const headersList = await headers();
    const requestHost = headersList.get('host');
    const domain = requestHost || ((store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002');
    const canonical = `https://${domain}/blog`;

    // If search filter is active, don't index internal search query results
    const hasSearch = Boolean(params.search?.trim());

    return {
        title: 'Blog | Latest Articles & Insights',
        description: 'Discover our latest blog posts, articles, and insights on various topics.',
        alternates: {
            canonical,
        },
        robots: hasSearch ? { index: false, follow: true } : { index: true, follow: true },
        openGraph: {
            title: 'Blog | Latest Articles & Insights',
            description: 'Discover our latest blog posts, articles, and insights on various topics.',
            url: canonical,
            type: 'website',
        },
    };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const category = params.category;
    const tag = params.tag;
    const search = params.search;

    // Get store from domain (SSR)
    const store = await getServerStore();

    if (!store?._id) {
        return (
            <BlogListingContainer
                initialPosts={[]}
                initialCategories={[]}
                initialTags={[]}
                initialPagination={{ page: 1, limit: 12, pages: 1, total: 0 }}
                page={page}
                category={category}
                tag={tag}
                search={search}
            />
        );
    }

    // Fetch all blog data including layout using SSR helper
    const { posts, categories, tags, pagination, totalPosts, layout } = await fetchBlogPageData(
        store._id,
        { page, limit: 12, category, tag, search }
    );

    return (
        <>
            {/* Server-Rendered SEO Shell */}
            <BlogListSeoShell
                posts={posts}
                storeName={store.name}
                currentPage={page}
                totalPosts={pagination.total}
            />

            {/* Client Component for interactive parts */}
            <BlogListingContainer
                initialPosts={posts}
                initialCategories={categories}
                initialTags={tags}
                initialPagination={pagination}
                initialTotalPosts={totalPosts}
                initialLayout={layout}
                page={page}
                category={category}
                tag={tag}
                search={search}
            />
        </>
    );
}
