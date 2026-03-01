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
import StoreInactive from "@/components/templates/core/StoreInactive";
import ServerUnavailable from "@/components/layout/ServerUnavailable/ServerUnavailable";
import ThemeScriptInjector from "@/components/ThemeScriptInjector";
import { getComponent } from "@/components/templates/registry";
import { Currency, DEFAULT_TEMPLATE_ID } from "@/types";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { InterestProvider } from "@/providers/InterestProvider";
import AutoAnalytics from "@/components/analytics/AutoAnalytics";
import NavigationProgress from '@/components/ui/NavigationProgress';
import ClientOnlyWidgets from "@/components/core/ClientOnlyWidgets";
import DeferredGlobalWidgets from "@/components/core/DeferredGlobalWidgets";
import { formatFontFamily } from "@/lib/fonts";
import { DynamicHeader } from "@/components/layout/DynamicHeader";
import { DynamicFooter } from "@/components/layout/DynamicFooter";
import { fetchMenusByIds } from "@/lib/api/server-menu";
import FontLoader from "@/components/core/FontLoader";


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
    if (heading) variables.push(`--font-heading: ${formatFontFamily(heading)}`);
    if (body) variables.push(`--font-body: ${formatFontFamily(body)}`);
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
    // Load standard weights: 300, 400, 500, 600, 700, 800, 900
    return `family=${family}:wght@300;400;500;600;700;800;900`;
  });

  return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
}

function extractMenuIds(obj: any, menuIds: Set<string>) {
  if (!obj || typeof obj !== 'object') return;

  if (typeof obj.menuId === 'string') {
    menuIds.add(obj.menuId);
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (Array.isArray(value)) {
      value.forEach((item) => extractMenuIds(item, menuIds));
    } else if (value && typeof value === 'object') {
      extractMenuIds(value, menuIds);
    }
  });
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
    metadataBase: new URL(`https://${domain}`),
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
  let store;
  try {
    store = await getStore(domain);
  } catch (error) {
    // If backend is down, render a fallback UI
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ServerUnavailable />
        </body>
      </html>
    );
  }

  // Get template ID
  const templateId = store?.theme?.templateId || DEFAULT_TEMPLATE_ID;

  const themeCSSVariables = generateThemeCSSVariables(store?.theme);
  const googleFontsUrl = generateGoogleFontsUrl(store?.theme);

  // Fetch currencies
  const currencies = store ? await fetchCurrencies(store._id) : [];

  // Fetch menus separately by menu IDs referenced in theme config
  let menus: Record<string, any> = {};
  if (store?.theme) {
    const menuIds = new Set<string>();
    extractMenuIds(store.theme, menuIds);
    if (menuIds.size > 0) {
      const menuList = await fetchMenusByIds(Array.from(menuIds));
      menus = menuList.reduce((acc, menu) => {
        acc[menu._id] = menu;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  let selectedCurrency: Currency | undefined;

  if (store && currencies.length > 0) {
    const cookieStore = await cookies();
    const currencyCode = cookieStore.get("currency")?.value || store.currency || "USD";
    selectedCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];
  }

  // Handle inactive store globally
  if (store && !store.isActive) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <StoreInactive />
        </body>
      </html>
    );
  }

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
            {/* Non-blocking font loading: preload + onload swap via client component */}
            <FontLoader href={googleFontsUrl} />
          </>
        )}
        {/* Infi Commerce Identification for Tools (BuiltWith, etc.) */}
        <meta name="generator" content={`Infi Commerce v${pkg.version}`} />
        <meta name="application-name" content="Infi Commerce" />
        <meta name="platform" content="Infi Commerce" />

        {/* PWA Meta Tags */}
        {store?.pwaSettings?.enabled && (
          <>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content={store.pwaSettings.themeColor || store.theme?.colors?.primary || '#000000'} />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content={store.pwaSettings.appShortName || store.name} />
            {store.pwaSettings.icons?.appleTouchIcon && (
              <link rel="apple-touch-icon" href={store.pwaSettings.icons.appleTouchIcon} />
            )}
            {store.pwaSettings.icons?.icon192 && (
              <link rel="icon" type="image/png" sizes="192x192" href={store.pwaSettings.icons.icon192} />
            )}
            {store.pwaSettings.icons?.icon512 && (
              <link rel="icon" type="image/png" sizes="512x512" href={store.pwaSettings.icons.icon512} />
            )}
          </>
        )}

        {/*
          Powered by Infi Commerce v${pkg.version}
          https://inficommerce.com
        */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NavigationProgress />
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
          menus={menus}
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
                            {store?.maintenanceMode ? (
                              <Maintenance />
                            ) : (
                              <div className="flex flex-col min-h-screen">
                                {/* Header - Template-specific container */}
                                <DynamicHeader config={store?.theme?.header} store={store} templateId={templateId} />

                                {/* Main Content */}
                                <main className="flex-1">
                                  {children}
                                </main>

                                {/* Footer - Template-specific container */}
                                <DynamicFooter config={store?.theme?.footer} store={store} templateId={templateId} />
                              </div>
                            )}
                            <ClientOnlyWidgets showCompare={!store?.maintenanceMode} />
                            <DeferredGlobalWidgets pwaEnabled={!!store?.pwaSettings?.enabled} />
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
