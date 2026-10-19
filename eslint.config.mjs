import vitals from 'eslint-config-next/core-web-vitals'
import ts from 'eslint-config-next/typescript'

const eslintConfig = [
  ...vitals,
  ...ts,
  {
    rules: {
      // Neue React-Compiler-Regeln: Hinweise, keine Fehler (bestehender Code funktioniert)
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      // Links in die Verwaltung (/admin) sind bewusst normale Links (eigene App)
      '@next/next/no-html-link-for-pages': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Bilder kommen mit fertigen Größen (srcset) aus der Payload-Mediathek
    files: ['src/bsv/**', 'src/app/(frontend)/**'],
    rules: { '@next/next/no-img-element': 'off' },
  },
  {
    ignores: ['.next/', 'src/payload-types.ts', 'src/payload-generated-schema.ts'],
  },
]

export default eslintConfig
