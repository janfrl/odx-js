import type { ODataPublicConfig } from '@bc8-odx/core'
import { useRuntimeConfig } from '#imports'

export function useODataBasePath(serviceName?: string): string {
  const config = useRuntimeConfig()
  const publicConfig = config.public.odata as unknown as ODataPublicConfig

  if (serviceName && publicConfig?.services) {
    const service = publicConfig.services.find(s => s.name === serviceName)
    if (service?.strategy === 'direct') {
      return service.url
    }
  }

  return publicConfig?.basePath || '/api/odx'
}
