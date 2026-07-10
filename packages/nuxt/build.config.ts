import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/module', name: 'module' },
    { input: 'src/generate', name: 'generate' },
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
  },
})
