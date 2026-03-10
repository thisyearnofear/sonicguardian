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
    '@codemirror/state',
    '@codemirror/view',
    '@codemirror/language',
    '@codemirror/commands',
    '@codemirror/search',
    '@codemirror/autocomplete',
    '@codemirror/lang-javascript',
    '@lezer/highlight',
    '@lezer/common',
    '@replit/codemirror-emacs',
    '@replit/codemirror-vim',
    '@replit/codemirror-vscode-keymap',
  ],
  // Production source maps for debugging
  productionBrowserSourceMaps: true,
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // CodeMirror 6 requires consistent module naming to work properly
      // Using 'named' prevents hash-based module IDs that break dynamic imports
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
      
      // Use terser with conservative settings
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Keep function and class names
              keep_fnames: true,
              keep_classnames: true,
              // Disable some aggressive optimizations
              pure_getters: false,
              passes: 1,
            },
            mangle: {
              // Keep function and class names
              keep_fnames: true,
              keep_classnames: true,
              // Don't mangle top-level
              toplevel: false,
            },
            format: {
              // Keep comments
              comments: false,
            },
          },
        }),
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
