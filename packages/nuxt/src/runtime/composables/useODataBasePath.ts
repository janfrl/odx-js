import { useRuntimeConfig } from '#imports'

export function useODataBasePath(serviceName?: string): string {
  const config = useRuntimeConfig()
  const publicConfig = config.public.odata

  if (serviceName && publicConfig.services) {
    const service = publicConfig.services.find((s: any) => s.name === serviceName)
    if (service?.strategy === 'direct') {
      return service.url
    }
  }

  return publicConfig.basePath || '/api/sap-odata'
}
