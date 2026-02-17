import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    basePath: config.public.odata?.basePath || '/api/sap-odata',
    mode: config.public.odata?.mode || 'sdk',
    services: config.odata?.services || [],
    buildDir: config.odata?.buildDir,
    forwardAuthHeader: config.odata?.forwardAuthHeader
  }
})
