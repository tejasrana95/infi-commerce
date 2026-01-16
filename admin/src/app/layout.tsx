import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AdminNotificationProvider } from "@/contexts/AdminNotificationContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import MUIThemeProvider from "@/theme/MUIThemeProvider";
import BrandingManager from "@/components/atoms/BrandingManager";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infi Commerce Admin",
  description: "Admin panel for Infi Commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Prevent browser caching */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextTopLoader showSpinner={false} color="#29D" shadow={false} />
        <MUIThemeProvider>
          <BrandingManager />
          <NotificationProvider>
            <AuthProvider>
              <AdminNotificationProvider>
                <CurrencyProvider>
                  <ConfirmProvider>
                    {children}
                  </ConfirmProvider>
                </CurrencyProvider>
              </AdminNotificationProvider>
            </AuthProvider>
          </NotificationProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}

