import { useRuntimeConfig } from '#imports'
import { defineEventHandler, getHeader } from 'h3'
import { generateODataTypes } from '../generate'

export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)

  // Inject the configuration into the context for the agnostic proxy handlers
  event.context.odataConfig = runtimeConfig.odata

  // Inject the generator function for the /generate endpoint
  event.context.odataGenerator = generateODataTypes

  // Handle auth header forwarding for createODataClient if needed
  if (runtimeConfig.odata?.forwardAuthHeader) {
    event.context.odataAuth = getHeader(event, 'authorization')
  }
})
