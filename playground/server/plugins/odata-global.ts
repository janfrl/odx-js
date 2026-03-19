import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', ({ serviceName: _serviceName }) => {
    // Silent in dev
  })

  nitro.hooks.hook('odx:proxy:response', ({ serviceName: _serviceName, response: _response }) => {
    // Silent in dev
  })
})
