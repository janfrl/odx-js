import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: './packages/nuxt/src/module', name: 'module' },
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
})
