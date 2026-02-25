import { useRuntimeConfig } from '#imports'

export function useODataBasePath(): string {
  const config = useRuntimeConfig()
  return config.public.odata?.basePath || '/api/sap-odata'
}
