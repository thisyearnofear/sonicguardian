import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    exposeTestingApiInProductionBuild: process.env.CI === 'true',
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
