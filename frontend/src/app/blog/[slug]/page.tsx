import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerStore, fetchBlogPostBySlug } from '@/lib/api/server-store';
import { fetchBlogPosts } from '@/lib/api';
import BlogPostContainer from '@/components/templates/core/BlogPost/Container';
import BlogPostSeoShell from '@/components/seo/BlogPostSeoShell';
import { headers } from 'next/headers';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for blog posts at build time
export async function generateStaticParams() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const storesRes = await fetch(`${apiUrl}/stores`, {
            next: { revalidate: false },
            signal: AbortSignal.timeout(5000)
        }).catch(() => null);

        if (!storesRes || !storesRes.ok) {
            console.warn('API unreachable during generateStaticParams for blog posts. Skipping static generation.');
            return [];
        }

        const storesData = await storesRes.json();
        const stores = Array.isArray(storesData) ? storesData : storesData.data || [];

        const paths = [];

        for (const store of stores) {
            try {
                const postsRes = await fetch(
                    `${apiUrl}/blog-posts?storeId=${store._id}&status=published&limit=100`,
                    {
                        next: { revalidate: false },
                        signal: AbortSignal.timeout(5000)
                    }
                ).catch(() => null);

                if (postsRes && postsRes.ok) {
                    const postsData = await postsRes.json();
                    const posts = postsData.data || [];
                    for (const post of posts) {
                        if (post.slug) paths.push({ slug: post.slug });
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch blog posts for store ${store._id}:`, error);
            }
        }
        return paths;
    } catch (error) {
        console.error('Failed to generate static params for blog posts:', error);
        return [];
    }
}

export const revalidate = 1800;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) return { title: 'Blog Post Not Found' };

    const { data } = await fetchBlogPostBySlug(store._id, slug);
    if (!data || !data.data._id) return { title: 'Blog Post Not Found' };

    const post = data.data;
    const headersList = await headers();
    const requestHost = headersList.get('host');
    const domain = requestHost || ((store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002');

    return {
        title: post.seo?.metaTitle || post.title,
        description: post.seo?.metaDescription || post.excerpt,
        keywords: post.seo?.metaKeywords,
        openGraph: {
            title: post.seo?.metaTitle || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.author.name],
            images: post.seo?.ogImage || post.featuredImage ? [post.seo?.ogImage || post.featuredImage] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.seo?.metaTitle || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            images: post.seo?.ogImage || post.featuredImage ? [post.seo?.ogImage || post.featuredImage] : [],
        },
        alternates: {
            canonical: post.seo?.canonicalUrl || `https://${domain}/blog/${slug}`,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) notFound();

    const { data, layout } = await fetchBlogPostBySlug(store._id, slug);
    if (!data || !data.data._id) notFound();

    const post = data.data;

    // Fetch related posts
    let relatedPosts: any[] = [];
    if (post.categoryIds?.length > 0) {
        const categoryId = post.categoryIds[0]._id;
        const relatedData = await fetchBlogPosts(store._id, { category: categoryId, limit: 3 });
        relatedPosts = relatedData.data.filter((p: any) => p._id !== post._id);
    }

    // Fetch linked products if configured
    const lpc = post.linkedProductsConfig;
    if (lpc?.enabled) {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const qp = new URLSearchParams();
            qp.append('isActive', 'true');

            if (lpc.sourceType === 'products' && Array.isArray(lpc.productIds) && lpc.productIds.length > 0) {
                const ids = lpc.productIds
                    .map((p: any) => (typeof p === 'object' ? p._id || p.toString() : p))
                    .join(',');
                qp.append('ids', ids);
                qp.append('sort', 'false');
                qp.append('limit', String(lpc.productIds.length));
            } else if (lpc.sourceType === 'category' && lpc.categoryId) {
                const catId = typeof lpc.categoryId === 'object'
                    ? (lpc.categoryId as any)._id || lpc.categoryId
                    : lpc.categoryId;
                qp.append('categoryIds', catId);
                qp.append('limit', String(lpc.limit ?? 8));
                if (lpc.order === 'best-selling') qp.append('sort', 'best-selling');
                else if (lpc.order === 'random') qp.append('sort', 'random');
                else if (lpc.order === 'most-viewed') qp.append('sort', 'most-viewed');
                else qp.append('sort', 'newest');
            }

            const res = await fetch(`${apiUrl}/products?${qp.toString()}`, {
                headers: { 'x-store-id': store._id },
                next: { revalidate: 300 },
                signal: AbortSignal.timeout(5000),
            }).catch(() => null);

            if (res?.ok) {
                const json = await res.json();
                post.linkedProducts = json.products || json.data || [];
            }
        } catch (err) {
            console.error('Failed to fetch blog post linked products:', err);
        }
    }

    return (
        <>
            <BlogPostSeoShell post={post} storeName={store.name} />
            <BlogPostContainer post={post} relatedPosts={relatedPosts} initialLayout={layout} />
        </>
    );
}
