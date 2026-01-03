import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://adventurous-integrity-production.up.railway.app/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
