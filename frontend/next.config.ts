import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const isProd = process.env.NODE_ENV === 'production';
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3001';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Tell Next.js to never bundle these packages — they use Node.js built-ins
  // (net, tls, dns) and must be required at runtime by the Node.js server only.
  serverExternalPackages: ['ioredis', 'memjs'],
  compiler: {
    // Remove client/server console noise from production bundles.
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,

    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion', 'swiper', 'react-fast-marquee', 'swr', '@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
  // Enable compression for smaller transfer sizes and faster TTFB.
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow unoptimized images in development to avoid issues with localhost
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.(woff|woff2|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  // Added turbopack config to silence Next.js 16 build error
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Externalize Node.js built-in modules for client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    // Keep Next.js default chunking strategy for best route-level code splitting.
    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
