/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Strudel packages - they use ESM and need proper handling
  transpilePackages: [
    '@strudel/core',
    '@strudel/codemirror',
    '@strudel/webaudio',
    '@strudel/transpiler',
    '@strudel/mini',
    '@strudel/tonal',
    '@strudel/draw',
    '@strudel/web',
    'superdough',
    '@kabelsalat/web',
  ],
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Keep minification but configure terser to not mangle function names
      // This fixes CodeMirror 6 "X is not a function" errors
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Keep function names to prevent "X is not a function" errors
              keep_fnames: true,
            },
            mangle: {
              // Keep function names during mangling
              keep_fnames: true,
            },
          },
        }),
      ];
    }
    return config;
  },
};

module.exports = nextConfig;