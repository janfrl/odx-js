import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Global hook for all OData Proxy Requests
  nitro.hooks.hook('odx:proxy:request', ({ serviceName, fetchOptions }) => {
    console.warn(`[Playground Hook] Intercepting request to service: ${serviceName}`)

    // Example: Add a custom header dynamically
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'x-odx-interceptor': 'active',
    }
  })

  // Global hook for all OData Proxy Responses
  nitro.hooks.hook('odx:proxy:response', ({ serviceName, response }) => {
    console.warn(`[Playground Hook] Intercepted response from ${serviceName}. Status: ${response.status}`)
  })

  // Service-specific hook (example for V2Service)
  nitro.hooks.hook('odx:proxy:request:V2Service' as any, () => {
    console.warn('[Playground Hook] Specific interceptor for V2Service only!')
  })
})
