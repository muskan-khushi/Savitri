import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow optimised images from Open-Meteo and other external sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.open-meteo.com' },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
