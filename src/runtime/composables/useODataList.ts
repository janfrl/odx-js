import { useFetch } from '#imports'
import { useODataBasePath } from './useODataBasePath'

export function useODataList(service: string, query: Record<string, unknown> = {}) {
  const basePath = useODataBasePath()
  return useFetch(() => `${basePath}/${service}`, { query })
}
