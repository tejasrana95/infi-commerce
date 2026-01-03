import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  experimental: {
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
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
