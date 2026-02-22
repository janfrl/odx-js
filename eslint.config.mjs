// @ts-check
import antfu from '@antfu/eslint-config'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default antfu(
  {},
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
).append({
  rules: {
    '@typescript-eslint/unified-signatures': 'off',
  },
})
