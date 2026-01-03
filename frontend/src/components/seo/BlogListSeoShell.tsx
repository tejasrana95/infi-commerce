// Server Component - Renders SEO-critical HTML for blog listing page
// This content appears in "View Page Source" and is indexable by search engines

interface BlogListSeoShellProps {
    posts: any[];
    storeName?: string;
    currentPage?: number;
    totalPosts?: number;
}

/**
 * BlogListSeoShell - Server-rendered HTML for blog listing SEO
 */
export default function BlogListSeoShell({
    posts,
    storeName,
    currentPage = 1,
    totalPosts = 0
}: BlogListSeoShellProps) {
    return (
        <div
            className="sr-only"
            itemScope
            itemType="https://schema.org/Blog"
            aria-hidden="true"
        >
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li aria-current="page">Blog</li>
                </ol>
            </nav>

            {/* Page Title */}
            <h1 itemProp="name">Blog</h1>

            {/* Description */}
            <p itemProp="description">
                Latest articles and insights from {storeName || 'our store'}.
                Showing page {currentPage} of {totalPosts} posts.
            </p>

            {/* Blog Posts List */}
            <ul>
                {posts.slice(0, 10).map((post) => (
                    <li key={post._id} itemProp="blogPost" itemScope itemType="https://schema.org/BlogPosting">
                        <h2 itemProp="headline">
                            <a href={`/blog/${post.slug}`} itemProp="url">
                                {post.title}
                            </a>
                        </h2>

                        {post.featuredImage && (
                            <img
                                src={post.featuredImage}
                                alt={post.title}
                                itemProp="image"
                                width={400}
                                height={300}
                            />
                        )}

                        {post.excerpt && (
                            <p itemProp="description">{post.excerpt}</p>
                        )}

                        {post.author?.name && (
                            <span itemProp="author" itemScope itemType="https://schema.org/Person">
                                <span itemProp="name">{post.author.name}</span>
                            </span>
                        )}

                        {post.publishedAt && (
                            <time itemProp="datePublished" dateTime={post.publishedAt}>
                                {new Date(post.publishedAt).toLocaleDateString()}
                            </time>
                        )}
                    </li>
                ))}
            </ul>

            {/* Publisher */}
            {storeName && (
                <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                    <span itemProp="name">{storeName}</span>
                </div>
            )}
        </div>
    );
}
