import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/nitro',
    'src/api/config',
    'src/api/generate',
    'src/api/logs',
    'src/api/me',
    'src/api/odata',
    'src/api/schema',
    'src/api/types',
    'src/plugins/auth-btp',
    'src/plugins/btp-auth',
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
    '@me-tools/odx-core',
    '@sap/xssec',
    '@sap/xsenv',
  ],
})
