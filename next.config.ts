import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['randomuser.me','images.unsplash.com','cdn-icons-png.flaticon.com','images.pexels.com','i.ibb.co'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors
  },
};

export default nextConfig;
