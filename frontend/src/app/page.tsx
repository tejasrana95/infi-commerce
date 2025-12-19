import { headers } from "next/headers";
import { getStore } from "@/lib/api";
import { getLayoutByType } from "@/lib/api/layouts";
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

  // Get template-specific components
  const HomePage = getComponent("HomePage", templateId);

  // Fetch homepage layout from layout builder
  const layout = store?._id ? await getLayoutByType('homepage', store._id) : null;

  return (
    <HomePage
      layout={layout}
      store={store}
      templateId={templateId}
    />
  );
}