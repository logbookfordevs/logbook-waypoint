import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  {
    files: ['components/ink-map-*.ts', 'components/ink-map-*.tsx', 'components/site-chrome.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        window: 'readonly', document: 'readonly', performance: 'readonly',
        getComputedStyle: 'readonly', matchMedia: 'readonly',
        innerWidth: 'readonly', innerHeight: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        AbortController: 'readonly', Element: 'readonly',
      },
    },
  },
);
