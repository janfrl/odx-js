import type { ODataProxyConfig } from './types'
import { ofetch } from 'ofetch'

export interface ODataClientOptions {
  config: ODataProxyConfig
  authorization?: string
}

/** Creates a typed fetch client; the host owns error presentation and logging. */
export function createODataClient(options: ODataClientOptions): ReturnType<typeof ofetch.create> {
  const { config, authorization } = options
  const baseURL = config.basePath || '/api/sap-odata'

  return ofetch.create({
    baseURL,
    onRequest({ options }) {
      if (config.forwardAuthHeader && authorization) {
        if (!(options.headers instanceof Headers)) {
          options.headers = new Headers(options.headers as HeadersInit)
        }
        options.headers.append('authorization', authorization)
      }
    },
  })
}
