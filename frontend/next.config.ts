import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  generateBuildId: async () => {
    // This will force the client to clear cache by providing a new build ID every time
    return `build-${Date.now()}`;
  },
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion'],
  },
  // Disable compression temporarily to debug "transformAlgorithm is not a function" error
  compress: false,
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
  webpack: (config, { isServer }) => {
    // Only apply optimizations for client-side bundles
    if (!isServer) {
      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks for better caching
            default: false,
            vendors: false,

            // Framework chunk (React, Next.js core)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
              enforce: true,
            },

            // Stripe libraries
            stripe: {
              name: 'stripe',
              test: /[\\/]node_modules[\\/](@stripe)[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },

            // Animation libraries
            animations: {
              name: 'animations',
              test: /[\\/]node_modules[\\/](framer-motion|swiper)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },

            // Icons - each library as separate chunk (only loaded when used)
            iconsFA: {
              name: 'icons-fa',
              test: /[\\/]node_modules[\\/]react-icons[\\/]fa[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsMD: {
              name: 'icons-md',
              test: /[\\/]node_modules[\\/]react-icons[\\/]md[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsBi: {
              name: 'icons-bi',
              test: /[\\/]node_modules[\\/]react-icons[\\/]bi[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsBs: {
              name: 'icons-bs',
              test: /[\\/]node_modules[\\/]react-icons[\\/]bs[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsHi: {
              name: 'icons-hi',
              test: /[\\/]node_modules[\\/]react-icons[\\/]hi[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsRi: {
              name: 'icons-ri',
              test: /[\\/]node_modules[\\/]react-icons[\\/]ri[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsIo: {
              name: 'icons-io',
              test: /[\\/]node_modules[\\/]react-icons[\\/]io5[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsAi: {
              name: 'icons-ai',
              test: /[\\/]node_modules[\\/]react-icons[\\/]ai[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            iconsLucide: {
              name: 'icons-lucide',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },

            // Other common libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                // Get the package name
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                // npm package names are URL-safe, but some servers don't like @ symbols
                return `npm.${packageName?.replace('@', '')}`;
              },
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },

            // Common app code used across the site
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
          // Set maximum size limits for chunks
          maxSize: 500000, // 500KB - forces splitting of large chunks
          minSize: 20000, // 20KB minimum
        },
      };
    }

    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);

