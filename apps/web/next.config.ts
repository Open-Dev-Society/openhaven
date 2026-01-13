import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.SERVER_API_URL || 'http://localhost:3002/api/v1'}/:path*`, // Proxy to Backend
      },
    ];
  },
};


export default nextConfig;
