import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Global logic applied to ALL OData services
  nitro.hooks.hook('odx:proxy:request', ({ serviceName, fetchOptions }) => {
    console.warn(`[ODX Global] Request to service: "${serviceName}"`)
    console.warn(`[ODX Global] Available headers:`, Object.keys(fetchOptions.headers || {}))

    // Example: Track global request count or inject telemetry headers
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'x-odx-global-interceptor': 'active',
    }
  })

  nitro.hooks.hook('odx:proxy:response', ({ serviceName, response }) => {
    console.warn(`[ODX Global] Intercepted response from ${serviceName}. Status: ${response.status}`)
  })
})
