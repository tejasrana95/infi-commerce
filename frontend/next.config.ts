import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  reactCompiler: true,
  // Tell Next.js to never bundle these packages — they use Node.js built-ins
  // (net, tls, dns) and must be required at runtime by the Node.js server only.
  serverExternalPackages: ['ioredis', 'memjs'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion', 'swiper', 'react-fast-marquee', 'swr', '@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
  // Enable compression for smaller transfer sizes and faster TTFB.
  compress: true,
  images: {
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  // Added turbopack config to silence Next.js 16 build error
  turbopack: {},
  webpack: (config, { isServer, dev }) => {
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

    // Optimization: Only apply heavy splitting for production client builds to avoid worker crashes
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 250000, // 250KB max per chunk for better parallelism
          minSize: 30000,  // 30KB min to avoid micro-chunks
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 50,
              enforce: true,
            },
            // Group icon libraries into a single chunk
            icons: {
              name: 'vendor-icons',
              test: /[\\/]node_modules[\\/](react-icons|lucide-react)[\\/]/,
              priority: 40,
            },
            // Stripe — only loaded on checkout page
            stripe: {
              name: 'vendor-stripe',
              test: /[\\/]node_modules[\\/]@stripe[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Shared application code
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            // All other vendor code in a single group
            vendorMisc: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor-misc',
              priority: 10,
              minChunks: 2,
            },
          },
        },
      };
    }
    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
