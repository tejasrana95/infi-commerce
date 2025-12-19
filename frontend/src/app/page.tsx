import { headers } from "next/headers";
import { getStore } from "@/lib/api";
import { getEnrichedMenus } from "@/lib/server-menu";
import { getComponent } from "@/components/templates/registry";
import { DEFAULT_TEMPLATE_ID } from "@/types";

// Mock products for demo (in real app, fetch from API)
const MOCK_PRODUCTS = [
  {
    _id: "1",
    name: "Premium Leather Jacket",
    slug: "premium-leather-jacket",
    price: 299.99,
    compareAtPrice: 399.99,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
    rating: 4.5,
    reviewCount: 128,
  },
  {
    _id: "2",
    name: "Classic White Sneakers",
    slug: "classic-white-sneakers",
    price: 89.99,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"],
    rating: 4.8,
    reviewCount: 256,
  },
  {
    _id: "3",
    name: "Minimalist Watch",
    slug: "minimalist-watch",
    price: 199.99,
    compareAtPrice: 249.99,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500"],
    rating: 4.6,
    reviewCount: 89,
  },
  {
    _id: "4",
    name: "Wool Blend Coat",
    slug: "wool-blend-coat",
    price: 349.99,
    images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500"],
    rating: 4.7,
    reviewCount: 64,
  },
];

export async function generateMetadata() {
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  if (!store) return {};

  return {
    title: store.seo?.metaTitle || store.name,
    description: store.seo?.metaDescription || store.description,
    keywords: store.seo?.metaKeywords,
    openGraph: {
      title: store.seo?.ogTitle || store.seo?.metaTitle || store.name,
      description: store.seo?.ogDescription || store.seo?.metaDescription || store.description,
      images: store.seo?.ogImage ? [store.seo.ogImage] : undefined,
    },
  };
}

export default async function HomePage() {
  // Fetch store data server-side for SEO
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  // Get template ID (falls back to default if not set)
  const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;

  // Get template-specific components (Containers that handle business logic)
  const Header = getComponent("Header", templateId);
  const Footer = getComponent("Footer", templateId);
  const ProductCard = getComponent("ProductCard", templateId);

  // Pre-fetch menus for SSR
  const menus = (store?.theme?.header && store?._id) ? await getEnrichedMenus(store.theme.header, store._id) : {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Container renders with template-specific presentation */}
      <Header
        config={store?.theme?.header}
        store={store}
        templateId={templateId}
        menus={menus}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to {store?.name || "Our Store"}
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover our curated collection of premium products designed for modern living.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/shop"
                className="bg-white text-gray-900 px-8 py-3 font-medium hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </a>
              <a
                href="/collections"
                className="border border-white text-white px-8 py-3 hover:bg-white hover:text-gray-900 transition-colors"
              >
                View Collections
              </a>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
              <p className="text-gray-600">Handpicked items just for you</p>
            </div>

            {/* Product Grid - Uses template-specific ProductCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  currency={store?.currency || "USD"}
                  templateId={templateId}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="/shop"
                className="inline-block border-2 border-gray-900 text-gray-900 px-8 py-3 font-medium hover:bg-gray-900 hover:text-white transition-colors"
              >
                View All Products
              </a>
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl mb-2">🚚</div>
                <h3 className="font-semibold mb-1">Free Shipping</h3>
                <p className="text-sm text-gray-600">On orders over $50</p>
              </div>
              <div>
                <div className="text-3xl mb-2">↩️</div>
                <h3 className="font-semibold mb-1">Easy Returns</h3>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-semibold mb-1">Secure Checkout</h3>
                <p className="text-sm text-gray-600">100% secure payment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Template Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <section className="bg-yellow-50 border-t border-yellow-200 py-4 px-4">
            <div className="container mx-auto text-sm">
              <p>
                <strong>Template:</strong> {templateId} |{" "}
                <strong>Store:</strong> {store?.name || "Not loaded"} |{" "}
                <strong>Domain:</strong> {domain}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer - Rendered with template-specific container */}
      <Footer config={store?.theme?.footer} store={store} templateId={templateId} />
    </div>
  );
}