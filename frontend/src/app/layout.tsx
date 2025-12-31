import type { Metadata } from "next";
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
import CompareFloatingWidget from "@/components/core/CompareFloatingWidget";
import AuthModal from "@/components/organisms/AuthModal/AuthModal";
import { Maintenance } from "@/components/layout/Maintenance/Maintenance";
import { fetchCurrencies, getStore } from "@/lib/api";
import ThemeScriptInjector from "@/components/ThemeScriptInjector";
import { getEnrichedMenus } from "@/lib/server-menu";
import { getComponent } from "@/components/templates/registry";
import { Currency, DEFAULT_TEMPLATE_ID } from "@/types";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import AutoAnalytics from "@/components/analytics/AutoAnalytics";

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

  const themeCSSVariables = generateThemeCSSVariables(store?.theme);
  const googleFontsUrl = generateGoogleFontsUrl(store?.theme);

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
            <link href={googleFontsUrl} rel="stylesheet" />
          </>
        )}
      </head>
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
          <UIProvider>
            <AnalyticsProvider>
              <AutoAnalytics />
              <ThemeScriptInjector
                header={store?.theme?.customScripts?.header}
                footer={store?.theme?.customScripts?.footer}
              />
              <CustomerProvider>
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
                          <AuthModal />
                          {!store?.settings?.maintenanceMode && <CompareFloatingWidget />}
                        </DialogProvider>
                      </ToastProvider>
                    </CompareProvider>
                  </WishlistProvider>
                </CartProvider>
              </CustomerProvider>
            </AnalyticsProvider>
          </UIProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
