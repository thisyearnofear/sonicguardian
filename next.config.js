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
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Use standard terser with keep_fnames for all code
      // This is the most compatible fix for CodeMirror 6 "X is not a function" errors
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              keep_fnames: true,
              keep_classnames: true,
            },
            mangle: {
              keep_fnames: true,
              keep_classnames: true,
              // Preserve top-level function names
              toplevel: true,
            },
            format: {
              // Preserve comments
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