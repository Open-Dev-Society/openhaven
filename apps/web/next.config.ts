import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api-openhaven.vercel.app/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
