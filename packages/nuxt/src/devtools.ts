import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { existsSync } from 'node:fs'
import { startSubprocess } from '@nuxt/devtools-kit'

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
    // 1. Start the explorer dev server on localhost:3300
    const explorerDir = resolver.resolve('../../explorer')
    if (existsSync(explorerDir)) {
      startSubprocess(
        {
          command: 'npx',
          args: ['nuxi', 'dev', '--port', DEVTOOLS_UI_LOCAL_PORT.toString()],
          cwd: explorerDir,
        },
        {
          id: 'odx:client',
          name: 'ODX Explorer Dev',
        },
      )
    }
    // 2. Proxy the route to the local dev server using Nitro's devProxy
    nuxt.options.nitro.devProxy ||= {}
    nuxt.options.nitro.devProxy[DEVTOOLS_UI_ROUTE] = {
      target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}/`,
      changeOrigin: true,
    }

    // Also add to Vite for better HMR support
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
      icon: 'i-lucide-cable',
      view: {
        type: 'iframe',
        src: `${DEVTOOLS_UI_ROUTE}/`,
      },
    })
  })
}
