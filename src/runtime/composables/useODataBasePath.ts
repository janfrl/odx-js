import { useRuntimeConfig } from '#imports'

export function useODataBasePath() {
  const config = useRuntimeConfig()
  return config.public.odata?.basePath || '/api/sap-odata'
}
