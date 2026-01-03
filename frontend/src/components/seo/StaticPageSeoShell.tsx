// Server Component - Renders SEO-critical HTML for static pages
// This content appears in "View Page Source" and is indexable by search engines

interface StaticPageSeoShellProps {
    page: any;
    storeName?: string;
}

/**
 * StaticPageSeoShell - Server-rendered HTML for SEO
 */
export default function StaticPageSeoShell({ page, storeName }: StaticPageSeoShellProps) {
    // Strip HTML tags from content for plain text excerpt
    const plainTextContent = page.content?.replace(/<[^>]*>/g, '').substring(0, 500) || '';

    return (
        <article
            className="sr-only"
            itemScope
            itemType="https://schema.org/WebPage"
            aria-hidden="true"
        >
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li aria-current="page">{page.title}</li>
                </ol>
            </nav>

            {/* Page Title */}
            <h1 itemProp="name">{page.title}</h1>

            {/* Featured Image */}
            {page.featuredImage && (
                <img
                    src={page.featuredImage}
                    alt={page.title}
                    itemProp="image"
                    width={1200}
                    height={630}
                />
            )}

            {/* Description/Excerpt */}
            {plainTextContent && (
                <div itemProp="description">
                    {plainTextContent}
                </div>
            )}

            {/* Publisher */}
            {storeName && (
                <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                    <span itemProp="name">{storeName}</span>
                </div>
            )}

            {/* Last Modified */}
            {page.updatedAt && (
                <meta itemProp="dateModified" content={page.updatedAt} />
            )}
        </article>
    );
}
