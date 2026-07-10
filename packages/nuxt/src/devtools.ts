import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'

export const DEVTOOLS_UI_ROUTE = '/__odx__/client'
export const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver): void {
  function resolveExplorerDirectory(resolver: Resolver): string | undefined {
    const workspaceDirectory = resolver.resolve('../../explorer')
    if (existsSync(workspaceDirectory))
      return workspaceDirectory

    try {
      const require = createRequire(import.meta.url)
      return dirname(require.resolve('@bc8-odx/explorer/package.json'))
    }
    catch {
      return undefined
    }
  }

  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)
  let devtoolsUiSrc = `${DEVTOOLS_UI_ROUTE}/`

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
  // In local development, start a separate Nuxt server and proxy to serve the client.
  else {
    const explorerDir = resolveExplorerDirectory(resolver)
    if (explorerDir) {
      let explorerProcess: ReturnType<typeof startSubprocess> | undefined
      const hostAppUrl = `http://localhost:${nuxt.options.devServer?.port || 3000}`
      const explorerUrl = `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}/`
      devtoolsUiSrc = explorerUrl

      // Start only when Vite is serving. `nuxi prepare` also runs Nuxt modules in
      // dev mode, and starting a long-lived subprocess there keeps prepare alive.
      nuxt.hook('vite:serverCreated', () => {
        explorerProcess ||= startSubprocess(
          {
            command: 'pnpm',
            args: ['exec', 'nuxi', 'dev', '--host', 'localhost', '--port', DEVTOOLS_UI_LOCAL_PORT.toString()],
            cwd: explorerDir,
            env: {
              ODX_EXPLORER_API_PROXY_TARGET: hostAppUrl,
            },
          },
          {
            id: 'odx:client',
            name: 'ODX Explorer Dev',
          },
        )
      })

      nuxt.hook('vite:serverCreated', (server) => {
        server.middlewares.use(DEVTOOLS_UI_ROUTE, (_req, res) => {
          res.statusCode = 302
          res.setHeader('Location', explorerUrl)
          res.end()
        })
      })
    }
  }

  (nuxt as any).hook('devtools:customTabs', (tabs: any[]) => {
    tabs.push({
      name: 'odx',
      title: 'ODX',
      icon: 'i-lucide-cable',
      view: {
        type: 'iframe',
        src: devtoolsUiSrc,
      },
    })
  })
}
