import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://api-openhaven.vercel.app/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
