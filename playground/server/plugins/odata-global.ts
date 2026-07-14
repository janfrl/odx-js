import { odataGuard } from '@me-tools/odx-proxy'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', (ctx) => {
    odataGuard(ctx).info('Executing global interceptors')
  })

  nitro.hooks.hook('odx:proxy:response', (ctx) => {
    odataGuard(ctx).info('Global response interceptor executed')
  })
})
