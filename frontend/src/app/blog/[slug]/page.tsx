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
