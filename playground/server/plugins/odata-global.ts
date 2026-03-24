import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', ({ event, serviceName }) => {
    const addTrace = event.context.proxyTrace
    addTrace?.('Rules', 'Executing global interceptors', { 
      service: serviceName,
      stage: 'request'
    })
  })

  nitro.hooks.hook('odx:proxy:response', ({ event, serviceName, response }) => {
    const addTrace = event.context.proxyTrace
    addTrace?.('Rules', 'Global response interceptor executed', {
      service: serviceName,
      status: response.status,
      stage: 'response'
    })
  })
})
