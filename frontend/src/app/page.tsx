import { headers } from "next/headers";
import { getStore } from "@/lib/api";
import { getLayoutByType } from "@/lib/api/layouts";
import { getEnrichedMenus } from "@/lib/server-menu";
import { getComponent } from "@/components/templates/registry";
import { DEFAULT_TEMPLATE_ID } from "@/types";

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

export default async function Page() {
  // Fetch store data server-side for SEO
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  // Get template ID (falls back to default if not set)
  const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;

  // Get template-specific components (following Header/Footer pattern)
  const Header = getComponent("Header", templateId);
  const HomePage = getComponent("HomePage", templateId);
  const Footer = getComponent("Footer", templateId);

  // Pre-fetch menus for SSR
  const menus = (store?.theme?.header && store?._id) ? await getEnrichedMenus(store.theme.header, store._id) : {};

  // Fetch homepage layout from layout builder
  const layout = store?._id ? await getLayoutByType('homepage', store._id) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Template-specific container */}
      <Header
        config={store?.theme?.header}
        store={store}
        templateId={templateId}
        menus={menus}
      />

      {/* Main Content - Template-specific HomePage container */}
      <main className="flex-1">
        <HomePage
          layout={layout}
          store={store}
          templateId={templateId}
        />
      </main>

      {/* Footer - Template-specific container */}
      <Footer config={store?.theme?.footer} store={store} templateId={templateId} />
    </div>
  );
}