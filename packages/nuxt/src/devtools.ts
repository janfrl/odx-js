import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { existsSync } from 'node:fs'

export const DEVTOOLS_UI_ROUTE = '/__odx__/client'
export const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver): void {
  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)

  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      server.middlewares.use(
        DEVTOOLS_UI_ROUTE,
        sirv(clientPath, { dev: true, single: true }),
      )
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    nuxt.hook('vite:extendConfig', (config) => {
      if (config.server) {
        config.server.proxy ||= {}
        config.server.proxy[DEVTOOLS_UI_ROUTE] = {
          target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}`,
          changeOrigin: true,
          followRedirects: true,
        }
      }
    })
  }

  (nuxt as any).hook('devtools:customTabs', (tabs: any[]) => {
    tabs.push({
      name: 'odx',
      title: 'ODX',
      icon: 'logos:odata',
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })
}
