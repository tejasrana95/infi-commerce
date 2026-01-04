import type { Metadata } from "next";
import pkg from "../../package.json";
import { Geist, Geist_Mono } from "next/font/google";
import { headers, cookies } from "next/headers";
import "./globals.scss";

import { StoreProvider } from "@/providers/StoreProvider";
import { UIProvider } from "@/providers/UIProvider";
import { CustomerProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { WishlistProvider } from "@/providers/WishlistProvider";
import { CompareProvider } from "@/providers/CompareProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { DialogProvider } from "@/providers/DialogProvider";
import { Maintenance } from "@/components/layout/Maintenance/Maintenance";
import { fetchCurrencies, getStore } from "@/lib/api";
import ThemeScriptInjector from "@/components/ThemeScriptInjector";
import { getEnrichedMenus } from "@/lib/server-menu";
import { getComponent } from "@/components/templates/registry";
import { Currency, DEFAULT_TEMPLATE_ID } from "@/types";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { InterestProvider } from "@/providers/InterestProvider";
import AutoAnalytics from "@/components/analytics/AutoAnalytics";
import ClientWidgets from "@/components/core/ClientWidgets";
import NextTopLoader from "nextjs-toploader";
import AIAssistant from "@/components/core/AIAssistant/AIAssistant";

// Optimized font loading with display: swap to prevent FOIT
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ============================================
// Generate CSS Variables from Theme Config (Server-Side)
// ============================================
function generateThemeCSSVariables(themeConfig: any): string {
  if (!themeConfig) return '';

  const variables: string[] = [];

  // Colors
  if (themeConfig.colors) {
    const { primary, secondary, accent, background, text, headerBg, footerBg } = themeConfig.colors;
    if (primary) variables.push(`--color-primary: ${primary}`);
    if (secondary) variables.push(`--color-secondary: ${secondary}`);
    if (accent) variables.push(`--color-accent: ${accent}`);
    if (background) variables.push(`--color-background: ${background}`);
    if (text) variables.push(`--color-text: ${text}`);
    if (headerBg) variables.push(`--color-header-bg: ${headerBg}`);
    if (footerBg) variables.push(`--color-footer-bg: ${footerBg}`);
  }

  // Fonts
  if (themeConfig.fonts) {
    const { heading, body } = themeConfig.fonts;
    if (heading) variables.push(`--font-heading: ${heading}`);
    if (body) variables.push(`--font-body: ${body}`);
  }

  if (variables.length === 0) return '';
  return `:root { ${variables.join('; ')}; }`;
}

// ============================================
// Generate Google Fonts URL
// ============================================
function generateGoogleFontsUrl(themeConfig: any): string | null {
  if (!themeConfig?.fonts) return null;

  const { heading, body } = themeConfig.fonts;
  const fontsToLoad = new Set<string>();

  if (heading) fontsToLoad.add(heading);
  if (body) fontsToLoad.add(body);

  if (fontsToLoad.size === 0) return null;

  const fontFamilies = Array.from(fontsToLoad).map(font => {
    // Replace spaces with + for URL
    const family = font.replace(/\s+/g, '+');
    // Load standard weights: 300, 400, 500, 600, 700
    return `family=${family}:wght@300;400;500;600;700`;
  });

  return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
}

// ============================================
// Metadata Generation
// ============================================

export async function generateMetadata() {
  const headersList = await headers();
  const domain = headersList.get("host") || "localhost:3000";
  const store = await getStore(domain);

  if (!store) {
    return {
      title: "Store",
      description: "Store not found",
    };
  }

  // Fetch currencies for metadata in parallel if needed
  const currencies = await fetchCurrencies(store._id);
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value || store.currency || "USD";
  const selectedCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];

  return {
    title: {
      default: store.seo?.metaTitle || store.name || "Store",
      template: `%s | ${store.name || "Store"}`
    },
    description: store.seo?.metaDescription || store.description || "Your one-stop e-commerce solution",
    icons: {
      icon: store.favicon || '/favicon.ico',
      shortcut: store.favicon || '/favicon.ico',
      apple: store.favicon || '/favicon.ico', // Defaulting to favicon if no specific apple icon is provided
    },
    other: {
      "currency": selectedCurrency?.code || "USD",
      "available-currencies": currencies.map(c => c.code).join(","),
    }
  };
}

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

  const themeCSSVariables = generateThemeCSSVariables(store?.theme);
  const googleFontsUrl = generateGoogleFontsUrl(store?.theme);

  // Fetch currencies and menus in parallel
  const [currencies, menus] = await Promise.all([
    store ? fetchCurrencies(store._id) : Promise.resolve([]),
    (store?.theme?.header && store?._id)
      ? getEnrichedMenus(store.theme.header, store._id)
      : Promise.resolve({})
  ]);

  let selectedCurrency: Currency | undefined;

  if (store && currencies.length > 0) {
    const cookieStore = await cookies();
    const currencyCode = cookieStore.get("currency")?.value || store.currency || "USD";
    selectedCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];
  }

  // Get template-specific components
  const Header = getComponent("Header", templateId);
  const Footer = getComponent("Footer", templateId);

  return (
    <html lang="en">
      <head>
        {/* Server-rendered CSS variables - prevents CLS */}
        {themeCSSVariables && (
          <style dangerouslySetInnerHTML={{ __html: themeCSSVariables }} />
        )}
        {/* Dynamic Google Fonts Loading */}
        {googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
            <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
            <link href={googleFontsUrl} rel="stylesheet" />
          </>
        )}
        {/* Infi Commerce Identification for Tools (BuiltWith, etc.) */}
        <meta name="generator" content={`Infi Commerce v${pkg.version}`} />
        <meta name="application-name" content="Infi Commerce" />
        <meta name="platform" content="Infi Commerce" />
        {/*
          Powered by Infi Commerce v${pkg.version}
          https://inficommerce.com
        */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextTopLoader showSpinner={false} color="#29D" />
        {store && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `https://${domain}/#organization`,
                "name": store.name,
                "description": store.description,
                "currenciesAccepted": currencies.map(c => c.code).join(", "),
                "url": `https://${domain}`,
                "logo": store.logo || undefined,
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
          <UIProvider>
            <AnalyticsProvider>
              <AutoAnalytics />
              <ThemeScriptInjector
                header={store?.theme?.customScripts?.header}
                footer={store?.theme?.customScripts?.footer}
              />
              <CustomerProvider>
                <InterestProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <CompareProvider>
                        <ToastProvider>
                          <DialogProvider>
                            {store?.settings?.maintenanceMode ? (
                              <Maintenance />
                            ) : (
                              <div className="flex flex-col min-h-screen">
                                {/* Header - Template-specific container */}
                                <Header config={store?.theme?.header} store={store} templateId={templateId} menus={menus} />

                                {/* Main Content */}
                                <main className="flex-1">
                                  {children}
                                </main>

                                {/* Footer - Template-specific container */}
                                <Footer config={store?.theme?.footer} store={store} templateId={templateId} />
                              </div>
                            )}
                            <ClientWidgets showCompare={!store?.settings?.maintenanceMode} />
                            <AIAssistant />
                          </DialogProvider>
                        </ToastProvider>
                      </CompareProvider>
                    </WishlistProvider>
                  </CartProvider>
                </InterestProvider>
              </CustomerProvider>
            </AnalyticsProvider>
          </UIProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
