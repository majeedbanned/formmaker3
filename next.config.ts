import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'randomuser.me',
      'images.unsplash.com',
      'cdn-icons-png.flaticon.com',
      'images.pexels.com',
      'i.ibb.co',
      'localhost'
    ],
    // Allow local images from uploads directory
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.farsamooz.ir',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '*.farsamooz.ir',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'farsamooz.ir',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'farsamooz.ir',
        pathname: '/uploads/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors
  },
  experimental: {
    turbo: {
      rules: {
        // Disable turbopack for font processing
        "*.woff2": ["file-system"],
        "*.ttf": ["file-system"],
      },
    },
  },
};

export default nextConfig;
