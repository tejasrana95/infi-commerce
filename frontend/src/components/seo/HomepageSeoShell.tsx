// Server Component - Renders SEO-critical HTML for homepage
// This content appears in "View Page Source" and is indexable by search engines

import { Store } from '@/types';

interface HomepageSeoShellProps {
    store: Store;
    featuredProducts?: any[];
    categories?: any[];
}

/**
 * HomepageSeoShell - Server-rendered HTML for homepage SEO
 */
export default function HomepageSeoShell({
    store,
    featuredProducts = [],
    categories = []
}: HomepageSeoShellProps) {
    const currencySymbol = store?.currency === 'INR' ? '₹' : '$';

    return (
        <div
            className="sr-only"
            itemScope
            itemType="https://schema.org/WebSite"
            aria-hidden="true"
        >
            {/* Site Name */}
            <h1 itemProp="name">{store.name}</h1>

            {/* Site Description */}
            {store.description && (
                <p itemProp="description">{store.description}</p>
            )}

            {/* Site URL */}
            <link itemProp="url" href={`https://${store.domain}`} />

            {/* Search Action for Sitelinks Search Box */}
            <div itemProp="potentialAction" itemScope itemType="https://schema.org/SearchAction">
                <link itemProp="target" href={`https://${store.domain}/search?q={search_term_string}`} />
                <input type="hidden" itemProp="query-input" name="search_term_string" />
            </div>

            {/* Organization info */}
            <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">{store.name}</span>
                {store.logo && (
                    <img itemProp="logo" src={store.logo} alt={store.name} width={200} height={200} />
                )}
                <link itemProp="url" href={`https://${store.domain}`} />
            </div>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section>
                    <h2>Featured Products</h2>
                    <ul>
                        {featuredProducts.slice(0, 6).map((product) => (
                            <li key={product._id} itemScope itemType="https://schema.org/Product">
                                <a href={`/product/${product.slug}`} itemProp="url">
                                    <span itemProp="name">{product.name}</span>
                                </a>
                                {product.images?.[0] && (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        itemProp="image"
                                        width={200}
                                        height={200}
                                    />
                                )}
                                <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                                    <span itemProp="price" content={product.price?.toString()}>
                                        {currencySymbol}{product.price}
                                    </span>
                                    <meta itemProp="priceCurrency" content={store.currency || 'USD'} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <nav aria-label="Product Categories">
                    <h2>Shop by Category</h2>
                    <ul>
                        {categories.slice(0, 10).map((category) => (
                            <li key={category._id}>
                                <a href={`/category/${category.slug}`}>
                                    {category.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
}
