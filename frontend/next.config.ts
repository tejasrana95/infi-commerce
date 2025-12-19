import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: '*',
      },
    ],
  },
};

export default nextConfig;
