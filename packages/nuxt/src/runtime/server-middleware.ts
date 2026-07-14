import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { generateODataTypes } from '../generate'
import { defineEventHandler, getHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'

type ODataTypeGenerator = typeof generateODataTypes

const loadODataTypeGenerator: ODataTypeGenerator = async (...args) => {
  const { generateODataTypes } = await import('../generate')
  return generateODataTypes(...args)
}

export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const nitroApp = useNitroApp()

  // Inject the configuration into the context for the agnostic proxy handlers
  event.context.odataConfig = runtimeConfig.odata as unknown as ODataProxyConfig

  // Inject the runtime hooks for the proxy handlers
  // This ensures plugins registered in server/plugins can be called
  event.context.odataHooks = nitroApp.hooks

  // Runtime SDK generation is a development-only DevTools action. Keeping it
  // out of production Nitro bundles avoids bundling build-time CLI resolution.
  if (import.meta.dev) {
    event.context.odataGenerator = loadODataTypeGenerator
  }

  // Handle auth header forwarding for createODataClient if needed
  if (runtimeConfig.odata?.forwardAuthHeader) {
    event.context.odataAuth = getHeader(event, 'authorization')
  }
})
