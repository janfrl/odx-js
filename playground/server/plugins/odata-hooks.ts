import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Globaler Hook für alle OData Proxy Requests
  nitro.hooks.hook('odx:proxy:request', ({ serviceName, fetchOptions }) => {
    console.warn(`[Playground Hook] Intercepting request to service: ${serviceName}`)

    // Test: Wir fügen einen Custom Header dynamisch hinzu
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'x-odx-interceptor': 'active',
    }
  })

  // Globaler Hook für alle OData Proxy Responses
  nitro.hooks.hook('odx:proxy:response', ({ serviceName, response }) => {
    console.warn(`[Playground Hook] Intercepted response from ${serviceName}. Status: ${response.status}`)
  })

  // Service-spezifischer Hook (nur für V2Service)
  nitro.hooks.hook('odx:proxy:request:V2Service', () => {
    console.warn('[Playground Hook] Specific interceptor for V2Service only!')
  })
})
