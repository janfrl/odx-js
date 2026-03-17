import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', ({ serviceName }) => {
    // Silent in dev
  })

  nitro.hooks.hook('odx:proxy:response', ({ serviceName, response }) => {
    // Silent in dev
  })
})
