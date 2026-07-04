import { headers } from "next/headers";
import { getStore } from "@/lib/api";
import { getLayoutByType } from "@/lib/api/layouts";
import { getComponent } from "@/components/templates/registry";
import { DEFAULT_TEMPLATE_ID } from "@/types";
import { prefetchModuleData } from "@/lib/api/server-modules";
import HomepageSeoShell from "@/components/seo/HomepageSeoShell";



export async function generateMetadata() {
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  if (!store) return {};

  if (!store.isActive) {
    return {
      title: "Store Unavailable",
      description: "This store is currently unavailable.",
      robots: "noindex, nofollow",
    };
  }

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

// ISG: Revalidate homepage based on environment configuration
// Each store's homepage is cached separately by domain
// ISG: Revalidate homepage (5 minutes)
export const revalidate = 300;

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

  // Find LCP image for preloading (first banner slider slide)
  let lcpImageUrl = '';
  if (layout?.sections) {
    outer: for (const section of layout.sections) {
      const modules = [...(section.modules || [])];
      if (section.columns) {
        for (const col of section.columns) {
          if (col.modules) modules.push(...col.modules);
        }
      }

      for (const mod of modules) {
        if (mod.type === 'banner-slider' && moduleData[mod.id]) {
          const sliderData = moduleData[mod.id];
          if (sliderData?.slides?.length > 0) {
            lcpImageUrl = sliderData.slides[0].image;
            break outer;
          }
        }
      }
    }
  }

  return (
    <>
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          // @ts-ignore
          fetchpriority="high"
        />
      )}

      {/* Server-Rendered SEO Shell */}
      {store && <HomepageSeoShell store={store} />}

      {/* Client Component for interactive parts */}
      <HomePage
        layout={layout}
        store={store}
        templateId={templateId}
        moduleData={moduleData}
      />
    </>
  );
}