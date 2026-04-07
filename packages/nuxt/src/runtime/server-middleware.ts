import { defineEventHandler, getHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { generateODataTypes } from '../generate'

export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const nitroApp = useNitroApp()

  // Inject the configuration into the context for the agnostic proxy handlers
  event.context.odataConfig = runtimeConfig.odata

  // Inject the runtime hooks for the proxy handlers
  // This ensures plugins registered in server/plugins can be called
  event.context.odataHooks = nitroApp.hooks

  // Inject the generator function for the /generate endpoint
  event.context.odataGenerator = generateODataTypes

  // Handle auth header forwarding for createODataClient if needed
  if (runtimeConfig.odata?.forwardAuthHeader) {
    event.context.odataAuth = getHeader(event, 'authorization')
  }
})
