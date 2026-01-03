// Server Component - Renders SEO-critical HTML for blog post page
// This content appears in "View Page Source" and is indexable by search engines

interface BlogPostSeoShellProps {
    post: any;
    storeName?: string;
}

/**
 * BlogPostSeoShell - Server-rendered HTML for blog post SEO
 */
export default function BlogPostSeoShell({ post, storeName }: BlogPostSeoShellProps) {
    // Strip HTML tags from content for plain text
    const plainTextContent = post.content?.replace(/<[^>]*>/g, '').substring(0, 500) || '';

    return (
        <article
            className="sr-only"
            itemScope
            itemType="https://schema.org/BlogPosting"
            aria-hidden="true"
        >
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li><a href="/blog">Blog</a></li>
                    <li aria-current="page">{post.title}</li>
                </ol>
            </nav>

            {/* Post Title */}
            <h1 itemProp="headline">{post.title}</h1>

            {/* Featured Image */}
            {post.featuredImage && (
                <img
                    src={post.featuredImage}
                    alt={post.title}
                    itemProp="image"
                    width={1200}
                    height={630}
                />
            )}

            {/* Author */}
            {post.author && (
                <div itemProp="author" itemScope itemType="https://schema.org/Person">
                    <span itemProp="name">{post.author.name}</span>
                </div>
            )}

            {/* Publish Date */}
            {post.publishedAt && (
                <time itemProp="datePublished" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                </time>
            )}

            {/* Modified Date */}
            {post.updatedAt && (
                <meta itemProp="dateModified" content={post.updatedAt} />
            )}

            {/* Excerpt */}
            {post.excerpt && (
                <p itemProp="description">{post.excerpt}</p>
            )}

            {/* Article Body */}
            {plainTextContent && (
                <div itemProp="articleBody">
                    {plainTextContent}
                </div>
            )}

            {/* Categories */}
            {post.categoryIds?.length > 0 && (
                <div>
                    {post.categoryIds.map((category: any) => (
                        <a
                            key={category._id}
                            href={`/blog?category=${category._id}`}
                            itemProp="articleSection"
                        >
                            {category.name}
                        </a>
                    ))}
                </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
                <div>
                    {post.tags.map((tag: string, idx: number) => (
                        <span key={idx} itemProp="keywords">{tag}</span>
                    ))}
                </div>
            )}

            {/* Publisher */}
            {storeName && (
                <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                    <span itemProp="name">{storeName}</span>
                </div>
            )}

            {/* Word count estimate */}
            {post.content && (
                <meta itemProp="wordCount" content={String(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length)} />
            )}
        </article>
    );
}
