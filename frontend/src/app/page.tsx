import { headers } from "next/headers";
import { getStore } from "@/lib/api";
import { getLayoutByType } from "@/lib/api/layouts";
import { getComponent } from "@/components/templates/registry";
import { DEFAULT_TEMPLATE_ID } from "@/types";
import { prefetchModuleData } from "@/lib/api/server-modules";

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

  // Pre-fetch module data for SSR
  let moduleData: Record<string, any> = {};
  if (layout?.sections && store?._id) {
    // Collect all modules from all sections
    const allModules: Array<{ id: string; type: string; config: any }> = [];

    for (const section of layout.sections) {
      // Direct modules in section
      if (section.modules) {
        for (const module of section.modules) {
          allModules.push({ id: module.id, type: module.type, config: module.config });
        }
      }
      // Modules in columns
      if (section.columns) {
        for (const column of section.columns) {
          if (column.modules) {
            for (const module of column.modules) {
              allModules.push({ id: module.id, type: module.type, config: module.config });
            }
          }
        }
      }
    }

    moduleData = await prefetchModuleData(allModules, store._id);
  }

  return (
    <HomePage
      layout={layout}
      store={store}
      templateId={templateId}
      moduleData={moduleData}
    />
  );
}