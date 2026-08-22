import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    exposeTestingApiInProductionBuild: process.env.CI === 'true',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(import.meta.dirname, 'src'),
    };
    return config;
  },
  transpilePackages: [
    '@strudel/web',
    '@strudel/core',
    '@strudel/webaudio',
    '@strudel/transpiler',
    '@strudel/mini',
    '@strudel/tonal',
  ],
};

export default nextConfig;
