import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/nitro',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  externals: [
    'h3',
    'ofetch',
    'hookable',
    'nitropack',
    '@bc8-odx/core',
  ],
})
