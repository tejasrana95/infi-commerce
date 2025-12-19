import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers, cookies } from "next/headers";
import "./globals.scss";

import { StoreProvider } from "@/providers/StoreProvider";
import { fetchCurrencies, getStore } from "@/lib/api";
import { getEnrichedMenus } from "@/lib/server-menu";
import { getComponent } from "@/components/templates/registry";
import { Currency, DEFAULT_TEMPLATE_ID } from "@/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================
// Metadata Generation
// ============================================

export async function generateMetadata() {
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  if (!store) {
    return {
      title: "Infi-Commerce",
      description: "Store not found",
    };
  }

  // Fetch currencies for metadata
  const currencies = await fetchCurrencies(store._id);
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value || store.currency || "USD";
  const selectedCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];

  return {
    title: store.seo?.metaTitle || store.name || "Infi-Commerce",
    description: store.seo?.metaDescription || store.description || "Your one-stop e-commerce solution",
    other: {
      "currency": selectedCurrency?.code || "USD",
      "available-currencies": currencies.map(c => c.code).join(","),
    }
  };
}

// ============================================
// Root Layout - Server Component
// ============================================

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch store data SERVER-SIDE for SEO
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";

  // Get store data on the server
  const store = await getStore(domain);

  // Get template ID
  const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;

  // Fetch currencies
  let currencies: Currency[] = [];
  let selectedCurrency: Currency | undefined;

  if (store) {
    currencies = await fetchCurrencies(store._id);
    const cookieStore = await cookies();
    const currencyCode = cookieStore.get("currency")?.value || store.currency || "USD";
    selectedCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];
  }

  // Pre-fetch menus for SSR
  const menus = (store?.theme?.header && store?._id) ? await getEnrichedMenus(store.theme.header, store._id) : {};

  // Get template-specific components
  const Header = getComponent("Header", templateId);
  const Footer = getComponent("Footer", templateId);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {store && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "OnlineStore",
                "name": store.name,
                "description": store.description,
                "currenciesAccepted": currencies.map(c => c.code).join(", "),
                "url": `https://${domain}`,
              })
            }}
          />
        )}
        {/* StoreProvider is a client component that wraps server-rendered children */}
        <StoreProvider
          store={store}
          currentCurrency={selectedCurrency}
          availableCurrencies={currencies}
        >
          <div className="min-h-screen flex flex-col">
            {/* Header - Template-specific container */}
            <Header
              config={store?.theme?.header}
              store={store}
              templateId={templateId}
              menus={menus}
            />

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer - Template-specific container */}
            <Footer config={store?.theme?.footer} store={store} templateId={templateId} />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}

