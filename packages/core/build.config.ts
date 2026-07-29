import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/server',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
  },
  externals: ['@me-tools/odx-metadata', 'ofetch'],
})
