import { defineEventHandler, useRuntimeConfig, getQuery } from "#imports";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const serviceParam = event.context.params?.service as string
  const services = (config.odata?.services || []) as Array<{ name: string; route?: string }>
  const matched = services.find(
    (svc) => (svc.route || svc.name.toLowerCase()) === serviceParam
  )

  const query = getQuery(event)

  if (!matched) {
    return {
      error: `Unknown service "${serviceParam}"`,
      knownServices: services.map((s) => s.name)
    }
  }

  return {
    service: matched.name,
    query,
    message: 'Mock response from nuxt-sap-odata (SAP SDK not yet wired)',
    sampleItems: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  }
})
