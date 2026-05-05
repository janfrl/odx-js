import type { ODataProxyConfig } from '@bc8-odx/core'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import { performance } from 'node:perf_hooks'
import { clearODataLogs } from '@bc8-odx/core'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'

interface MeasurementSummary {
  label: string
  path: string
  iterations: number
  concurrency: number
  minMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
  overheadAvgMs?: number
}

const shouldRunBenchmark = process.env.npm_lifecycle_event === 'bench:proxy' || process.env.ODX_PROXY_BENCHMARK === '1'
const benchmarkIterations = Number.parseInt(process.env.ODX_PROXY_BENCHMARK_ITERATIONS || '50', 10)
const warmupIterations = 10
const concurrentRequests = Number.parseInt(process.env.ODX_PROXY_BENCHMARK_CONCURRENCY || '5', 10)
const describeBenchmark = shouldRunBenchmark ? describe : describe.skip

async function listen(app: ReturnType<typeof createBackend>): Promise<{ server: Server, url: string }> {
  const port = await getPort()
  const server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(port, () => resolve()))
  return {
    server,
    url: `http://127.0.0.1:${port}`,
  }
}

async function closeServer(server?: Server): Promise<void> {
  await new Promise<void>((resolve) => {
    if (!server) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      server.closeAllConnections?.()
      resolve()
    }, 2000)

    server.close(() => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

async function measureSequential(label: string, path: string, request: () => Promise<unknown>): Promise<MeasurementSummary> {
  for (let i = 0; i < warmupIterations; i++) {
    await request()
  }

  const timings: number[] = []
  for (let i = 0; i < benchmarkIterations; i++) {
    const start = performance.now()
    await request()
    timings.push(performance.now() - start)
  }

  const sorted = [...timings].sort((a, b) => a - b)
  const total = timings.reduce((sum, timing) => sum + timing, 0)

  return {
    label,
    path,
    iterations: benchmarkIterations,
    concurrency: 1,
    minMs: sorted[0] ?? 0,
    avgMs: total / timings.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted.at(-1) ?? 0,
  }
}

async function measureConcurrent(
  label: string,
  path: string,
  concurrency: number,
  request: () => Promise<unknown>,
): Promise<MeasurementSummary> {
  for (let i = 0; i < warmupIterations; i += concurrency) {
    const batchSize = Math.min(concurrency, warmupIterations - i)
    const batch: Array<Promise<unknown>> = []
    for (let j = 0; j < batchSize; j++) {
      batch.push(request())
    }
    await Promise.all(batch)
  }

  const timings: number[] = []
  for (let i = 0; i < benchmarkIterations; i += concurrency) {
    const batchSize = Math.min(concurrency, benchmarkIterations - i)
    await Promise.all(Array.from({ length: batchSize }, async () => {
      const start = performance.now()
      await request()
      timings.push(performance.now() - start)
    }))
  }

  const sorted = [...timings].sort((a, b) => a - b)
  const total = timings.reduce((sum, timing) => sum + timing, 0)

  return {
    label,
    path,
    iterations: benchmarkIterations,
    concurrency,
    minMs: sorted[0] ?? 0,
    avgMs: total / timings.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted.at(-1) ?? 0,
  }
}

function percentile(sortedTimings: number[], percentileRank: number): number {
  const index = Math.min(
    sortedTimings.length - 1,
    Math.max(0, Math.ceil((percentileRank / 100) * sortedTimings.length) - 1),
  )
  return sortedTimings[index] ?? 0
}

function formatBenchmarkReport(summaries: MeasurementSummary[]): string {
  const rows = summaries.map(summary => [
    summary.label.padEnd(24),
    summary.path.padEnd(43),
    String(summary.iterations).padStart(10),
    String(summary.concurrency).padStart(11),
    formatMs(summary.minMs).padStart(10),
    formatMs(summary.avgMs).padStart(10),
    formatMs(summary.p50Ms).padStart(10),
    formatMs(summary.p95Ms).padStart(10),
    formatMs(summary.maxMs).padStart(10),
    formatOptionalMs(summary.overheadAvgMs).padStart(15),
  ])

  return [
    '',
    'ODX proxy performance baseline',
    [
      'scenario'.padEnd(24),
      'path'.padEnd(43),
      'iterations'.padStart(10),
      'concurrency'.padStart(11),
      'min'.padStart(10),
      'avg'.padStart(10),
      'p50'.padStart(10),
      'p95'.padStart(10),
      'max'.padStart(10),
      'avg overhead'.padStart(15),
    ].join('  '),
    ...rows.map(row => row.join('  ')),
    '',
  ].join('\n')
}

function formatMs(value: number): string {
  return `${value.toFixed(2)}ms`
}

function formatOptionalMs(value?: number): string {
  return typeof value === 'number' ? formatMs(value) : '-'
}

describeBenchmark('proxy performance baseline', () => {
  let backendServer: Server
  let proxyServer: Server
  let devtoolsProxyServer: Server
  let backendUrl: string
  let proxyUrl: string
  let devtoolsProxyUrl: string

  beforeAll(async () => {
    const backend = await listen(createBackend())
    backendServer = backend.server
    backendUrl = backend.url

    const config: ODataProxyConfig = {
      services: [
        {
          name: 'BufferService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
        },
        {
          name: 'StreamService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'stream',
        },
      ],
      basePath: '/api/odx',
      buildDir: '',
      rootDir: '',
      mode: 'sdk',
      devtools: {
        enabled: false,
      },
    }

    const proxy = await listen(createProxyServer(config))
    proxyServer = proxy.server
    proxyUrl = proxy.url

    const devtoolsConfig: ODataProxyConfig = {
      ...config,
      services: [
        {
          name: 'DevToolsBufferService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
        },
      ],
      devtools: {
        enabled: true,
        maxLogs: 20,
      },
    }

    const devtoolsProxy = await listen(createProxyServer(devtoolsConfig))
    devtoolsProxyServer = devtoolsProxy.server
    devtoolsProxyUrl = devtoolsProxy.url

    const direct = await ofetch(`${backendUrl}/Products`)
    const buffered = await ofetch(`${proxyUrl}/api/odx/BufferService/Products`)
    const streamed = await ofetch(`${proxyUrl}/api/odx/StreamService/Products`)
    const largeDirect = await ofetch(`${backendUrl}/LargeProducts`)
    const largeBuffered = await ofetch(`${proxyUrl}/api/odx/BufferService/LargeProducts`)
    const largeStreamed = await ofetch(`${proxyUrl}/api/odx/StreamService/LargeProducts`)

    expect(direct).toEqual(buffered)
    expect(direct).toEqual(streamed)
    expect(largeDirect).toEqual(largeBuffered)
    expect(largeDirect).toEqual(largeStreamed)
  }, 20000)

  afterAll(async () => {
    await Promise.all([
      closeServer(backendServer),
      closeServer(proxyServer),
      closeServer(devtoolsProxyServer),
    ])
  }, 20000)

  it('reports direct backend, proxied buffer, and proxied stream GET timings', async () => {
    const smallDirect = await measureSequential('small seq direct', '/Products', () => ofetch(`${backendUrl}/Products`))
    const smallBuffered = await measureSequential('small seq buffer', '/api/odx/BufferService/Products', () => ofetch(`${proxyUrl}/api/odx/BufferService/Products`))
    const smallStreamed = await measureSequential('small seq stream', '/api/odx/StreamService/Products', () => ofetch(`${proxyUrl}/api/odx/StreamService/Products`))

    const largeDirect = await measureSequential('large seq direct', '/LargeProducts', () => ofetch(`${backendUrl}/LargeProducts`))
    const largeBuffered = await measureSequential('large seq buffer', '/api/odx/BufferService/LargeProducts', () => ofetch(`${proxyUrl}/api/odx/BufferService/LargeProducts`))
    const largeStreamed = await measureSequential('large seq stream', '/api/odx/StreamService/LargeProducts', () => ofetch(`${proxyUrl}/api/odx/StreamService/LargeProducts`))

    const concurrentDirect = await measureConcurrent('large conc direct', '/LargeProducts', concurrentRequests, () => ofetch(`${backendUrl}/LargeProducts`))
    const concurrentBuffered = await measureConcurrent('large conc buffer', '/api/odx/BufferService/LargeProducts', concurrentRequests, () => ofetch(`${proxyUrl}/api/odx/BufferService/LargeProducts`))
    const concurrentStreamed = await measureConcurrent('large conc stream', '/api/odx/StreamService/LargeProducts', concurrentRequests, () => ofetch(`${proxyUrl}/api/odx/StreamService/LargeProducts`))

    clearODataLogs()
    const devtoolsBuffered = await measureSequential('small seq devtools buffer', '/api/odx/DevToolsBufferService/Products', () => ofetch(`${devtoolsProxyUrl}/api/odx/DevToolsBufferService/Products`))

    const summaries = [
      smallDirect,
      smallBuffered,
      smallStreamed,
      largeDirect,
      largeBuffered,
      largeStreamed,
      concurrentDirect,
      concurrentBuffered,
      concurrentStreamed,
      devtoolsBuffered,
    ]
    for (const summary of summaries) {
      expect(Number.isFinite(summary.avgMs)).toBe(true)
      expect(Number.isFinite(summary.p95Ms)).toBe(true)
      expect(summary.iterations).toBeGreaterThanOrEqual(10)
      expect(summary.concurrency).toBeGreaterThanOrEqual(1)
      expect(summary.p95Ms).toBeLessThan(1000)
      expect(summary.maxMs).toBeLessThan(3000)
    }

    smallBuffered.overheadAvgMs = smallBuffered.avgMs - smallDirect.avgMs
    smallStreamed.overheadAvgMs = smallStreamed.avgMs - smallDirect.avgMs
    largeBuffered.overheadAvgMs = largeBuffered.avgMs - largeDirect.avgMs
    largeStreamed.overheadAvgMs = largeStreamed.avgMs - largeDirect.avgMs
    concurrentBuffered.overheadAvgMs = concurrentBuffered.avgMs - concurrentDirect.avgMs
    concurrentStreamed.overheadAvgMs = concurrentStreamed.avgMs - concurrentDirect.avgMs
    devtoolsBuffered.overheadAvgMs = devtoolsBuffered.avgMs - smallBuffered.avgMs

    process.stdout.write(formatBenchmarkReport(summaries))
  }, 120000)
})
