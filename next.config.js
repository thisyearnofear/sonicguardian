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
    const webpack = require('webpack');

    // ProvidePlugin for h function - helps with CodeMirror using h from preact
    config.plugins.push(
      new webpack.ProvidePlugin({
        h: ['preact/compat', 'h'],
      })
    );

    if (!isServer && !dev) {
      // COMPLETELY DISABLE MINIFICATION
      // CodeMirror 6 and Strudel are incompatible with webpack minification
      // This is the only reliable fix for "X is not a function" errors
      // Bundle size increase is acceptable for functionality
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
      
      // Use named module IDs for consistency
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
    }
    return config;
  },
};

module.exports = nextConfig;
