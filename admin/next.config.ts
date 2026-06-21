import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nodeEnv = (globalThis as any)?.process?.env?.NODE_ENV;
const isProd = nodeEnv === 'production';
const analyzeEnabled = (globalThis as any)?.process?.env?.ANALYZE === 'true';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,

  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-data-grid',
      'recharts',
      '@tiptap/react',
      '@tiptap/starter-kit'
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days
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
    unoptimized: nodeEnv === 'development',
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      // Cache static assets aggressively (content-hash filenames make this safe)
      {
        source: '/:path*.(js|css|woff|woff2|ttf|otf|png|jpg|jpeg|gif|svg|ico|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // HTML and data routes: no cache (admin data must be fresh)
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: analyzeEnabled,
})(nextConfig);
