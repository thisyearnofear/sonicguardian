import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'tailwind.config.js', 'postcss.config.js', 'e2e/**', 'playwright.config.ts'],
}, {
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-require-imports': 'off',
    'react/no-unescaped-entities': 'off',
    'prefer-const': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/purity': 'warn',
  },
}];

export default eslintConfig;
