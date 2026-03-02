import type { ODataProxyConfig } from '@bc8-odx/core'
import { ofetch } from 'ofetch'

export interface ODataClientOptions {
  config: ODataProxyConfig
  authorization?: string
}

export function createODataClient(options: ODataClientOptions): any {
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
    onResponseError({ response }) {
      console.error('[@bc8-odx/proxy] request failed', response?._data || response)
    },
  })
}
