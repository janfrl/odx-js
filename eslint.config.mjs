// @ts-check
import antfu from '@antfu/eslint-config'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default antfu(
  {
    type: 'lib',
    pnpm: {
      yaml: false,
    },
    ignores: [
      '.claude/**',
      '.agents/skills/**',
      '.gemini/**',
      '.github/**',
      '.specify/**',
    ],
  },
  createConfigForNuxt({
    features: {
      standalone: false,
      tooling: false,
      stylistic: false,
    },
    dirs: {
      src: [
        './playground',
      ],
    },
  }),
).append(
  {
    rules: {
      '@typescript-eslint/unified-signatures': 'off',
    },
  },
  {
    files: ['**/*.md'],
    rules: {
      'markdown/no-missing-atx-heading-space': 'off',
    },
  },
)
