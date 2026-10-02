import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**'] },
  {
    files: ['components/storybook-lab/**/*.{ts,tsx}', 'app/lab/storybook/**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        window: 'readonly', document: 'readonly', HTMLAudioElement: 'readonly',
        HTMLMediaElement: 'readonly', MediaQueryList: 'readonly', Audio: 'readonly', Event: 'readonly',
      },
    },
  },
);
