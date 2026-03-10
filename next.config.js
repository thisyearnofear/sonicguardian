/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Strudel packages to avoid minification issues
  transpilePackages: [
    '@strudel/core',
    '@strudel/codemirror',
    '@strudel/webaudio',
    '@strudel/transpiler',
    '@strudel/mini',
    '@strudel/tonal',
  ],
  // Disable minification for Strudel to prevent "g is not a function" errors
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Strudel from minification
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (minimizer) => minimizer.constructor.name !== 'TerserPlugin'
      );
    }
    return config;
  },
};

module.exports = nextConfig;