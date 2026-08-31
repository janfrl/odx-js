import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import process from 'node:process'
import { clearODataLogs, getODataLogs } from '@me-tools/odx-core'
import { toNodeListener } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listenOnLoopback } from './fixtures/listen'
import { createProxyServer } from './fixtures/server'

const servers: Server[] = []
beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'test')
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('NUXT_ODATA_DEVTOOLS_LOG_'))
      vi.stubEnv(name, undefined)
  }
  await clearODataLogs()
})
afterEach(async () => {
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
  }
  await clearODataLogs()
  vi.unstubAllEnvs()
})

describe.each(['buffer', 'stream'] as const)('%s URL credential diagnostics', (proxyMode) => {
  it.each([false, true])('redacts logs without changing real backend requests with logPayloads=%s', async (logPayloads) => {
    const received: string[] = []
    const backend = createServer((request, response) => {
      received.push(request.url ?? '')
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ value: [{ ID: 1 }] }))
    })
    servers.push(backend)
    const backendUrl = await listenOnLoopback(backend)
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      rootDir: '.',
      mode: 'sdk',
      devtools: { enabled: true, logPayloads },
      services: [{ name: 'Catalog', url: backendUrl, proxyMode }],
    }
    const proxy = createServer(toNodeListener(createProxyServer(config)))
    servers.push(proxy)
    const proxyUrl = await listenOnLoopback(proxy)
    const query = '?access_token=fixture-backend-token&$filter=Name%20eq%20%27Desk%27&sap-client=100'
    const response = await fetch(`${proxyUrl}/api/odx/Catalog/Products${query}`)
    expect(response.status).toBe(200)
    await response.text()
    expect(received).toEqual([`/Products${query}`])
    await expect.poll(async () => (await getODataLogs())[0]?.isPending).toBe(false)
    const logs = await getODataLogs()
    expect(logs).toHaveLength(1)
    const redactedQuery = query.replace('fixture-backend-token', '[Redacted]')
    expect(logs[0]).toMatchObject({
      url: `/api/odx/Catalog/Products${redactedQuery}`,
      targetUrl: `${backendUrl}/Products${redactedQuery}`,
    })
    expect(JSON.stringify(logs)).not.toContain('fixture-backend-token')
    expect(logs[0]?.proxyTrace?.some(entry => entry.message.includes(`Forwarding request to: ${backendUrl}/Products${redactedQuery}`))).toBe(true)
  })
})
