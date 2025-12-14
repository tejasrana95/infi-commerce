import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import MUIThemeProvider from "@/theme/MUIThemeProvider";

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MUIThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </AuthProvider>
          </NotificationProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}

