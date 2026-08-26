import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript strict mode enabled - build akan fail jika ada errors
  // Ini memastikan code quality dan mengelak bugs dalam production
  typescript: {
    ignoreBuildErrors: false, // ✅ FIXED: Enable type checking untuk production safety
  },
  
  // Enable React strict mode untuk detect potential issues
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Untuk Supabase Storage images
      },
    ],
  },
};

export default nextConfig;