import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerStore, fetchBlogPostBySlug } from '@/lib/api/server-store';
import { fetchBlogPosts } from '@/lib/api';
import BlogPostContainer from '@/components/templates/core/BlogPost/Container';
import BlogPostSeoShell from '@/components/seo/BlogPostSeoShell';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for blog posts at build time
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

        // For each store, fetch published blog posts
        for (const store of stores) {
            try {
                const postsRes = await fetch(
                    `${apiUrl}/blog-posts?storeId=${store._id}&status=published&limit=100`,
                    { next: { revalidate: false } }
                );

                if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    const posts = postsData.data || [];

                    for (const post of posts) {
                        if (post.slug) {
                            paths.push({ slug: post.slug });
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch blog posts for store ${store._id}:`, error);
            }
        }

        console.log(`Generated ${paths.length} static blog post pages`);
        return paths;
    } catch (error) {
        console.error('Failed to generate static params for blog posts:', error);
        return [];
    }
}

// Revalidate every 30 minutes
export const revalidate = 1800;

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        return { title: 'Blog Post Not Found' };
    }

    const { data } = await fetchBlogPostBySlug(store._id, slug);

    if (!data || !data.data._id) {
        return { title: 'Blog Post Not Found' };
    }
    const post = data.data;
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
            canonical: post.seo?.canonicalUrl,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const store = await getServerStore();

    if (!store?._id) {
        notFound();
    }

    const { data, layout } = await fetchBlogPostBySlug(store._id, slug);
    if (!data || !data.data._id) {
        notFound();
    }

    const post = data.data;

    // Fetch related posts
    let relatedPosts = [];
    if (post.categoryIds?.length > 0) {
        const categoryId = post.categoryIds[0]._id;
        const relatedData = await fetchBlogPosts(store._id, {
            category: categoryId,
            limit: 3
        });
        relatedPosts = relatedData.data.filter((p: any) => p._id !== post._id);
    }

    return (
        <>
            {/* Server-Rendered SEO Shell */}
            <BlogPostSeoShell post={post} storeName={store.name} />

            {/* Client Component for interactive parts */}
            <BlogPostContainer post={post} relatedPosts={relatedPosts} initialLayout={layout} />
        </>
    );
}
