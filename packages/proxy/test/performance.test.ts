import type { ODataProxyConfig } from '@bc8-odx/core'
import type { Server } from 'node:http'
import type { MeasurementSummary } from './benchmark-report'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname } from 'node:path'
import { performance } from 'node:perf_hooks'
import { clearODataLogs } from '@bc8-odx/core'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { assignAverageOverhead, createBenchmarkOutput, formatBenchmarkReport } from './benchmark-report'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'

const shouldRunBenchmark = process.env.npm_lifecycle_event === 'bench:proxy' || process.env.ODX_PROXY_BENCHMARK === '1'
const benchmarkIterations = parseBenchmarkIterations(process.env.ODX_PROXY_BENCHMARK_ITERATIONS)
const benchmarkRounds = parseBenchmarkRounds(process.env.ODX_PROXY_BENCHMARK_ROUNDS)
const warmupIterations = 10
const concurrentRequests = parseBenchmarkConcurrency(process.env.ODX_PROXY_BENCHMARK_CONCURRENCY)
const benchmarkOutputPath = process.env.ODX_PROXY_BENCHMARK_OUTPUT
const describeBenchmark = shouldRunBenchmark ? describe : describe.skip

function parseBenchmarkIterations(value: string | undefined): number {
  return parsePositiveIntegerEnv('ODX_PROXY_BENCHMARK_ITERATIONS', value, 50)
}

function parseBenchmarkRounds(value: string | undefined): number {
  return parsePositiveIntegerEnv('ODX_PROXY_BENCHMARK_ROUNDS', value, 5)
}

function parseBenchmarkConcurrency(value: string | undefined): number {
  return parsePositiveIntegerEnv('ODX_PROXY_BENCHMARK_CONCURRENCY', value, 5)
}

function parsePositiveIntegerEnv(name: string, value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`)
  }

  return Number.parseInt(value, 10)
}

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
  const roundAvgMs: number[] = []
  for (let round = 0; round < benchmarkRounds; round++) {
    const roundTimings: number[] = []
    for (let i = 0; i < benchmarkIterations; i++) {
      const start = performance.now()
      await request()
      roundTimings.push(performance.now() - start)
    }
    timings.push(...roundTimings)
    roundAvgMs.push(mean(roundTimings))
  }

  return {
    label,
    path,
    iterations: benchmarkIterations,
    rounds: benchmarkRounds,
    concurrency: 1,
    ...summarizeTimings(timings, roundAvgMs),
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
  const roundAvgMs: number[] = []
  for (let round = 0; round < benchmarkRounds; round++) {
    const roundTimings: number[] = []
    for (let i = 0; i < benchmarkIterations; i += concurrency) {
      const batchSize = Math.min(concurrency, benchmarkIterations - i)
      await Promise.all(Array.from({ length: batchSize }, async () => {
        const start = performance.now()
        await request()
        roundTimings.push(performance.now() - start)
      }))
    }
    timings.push(...roundTimings)
    roundAvgMs.push(mean(roundTimings))
  }

  return {
    label,
    path,
    iterations: benchmarkIterations,
    rounds: benchmarkRounds,
    concurrency,
    ...summarizeTimings(timings, roundAvgMs),
  }
}

function summarizeTimings(timings: number[], roundAvgMs: number[]): Omit<MeasurementSummary, 'label' | 'path' | 'iterations' | 'rounds' | 'concurrency' | 'overheadAvgMs' | 'overheadAvgPercent'> {
  const sorted = [...timings].sort((a, b) => a - b)
  const sortedRoundAverages = [...roundAvgMs].sort((a, b) => a - b)

  return {
    minMs: sorted[0] ?? 0,
    avgMs: mean(timings),
    medianRoundAvgMs: percentile(sortedRoundAverages, 50),
    roundStdDevMs: standardDeviation(roundAvgMs),
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted.at(-1) ?? 0,
  }
}

function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0
}

function standardDeviation(values: number[]): number {
  if (values.length < 2)
    return 0

  const average = mean(values)
  const variance = mean(values.map(value => (value - average) ** 2))
  return Math.sqrt(variance)
}

function percentile(sortedTimings: number[], percentileRank: number): number {
  const index = Math.min(
    sortedTimings.length - 1,
    Math.max(0, Math.ceil((percentileRank / 100) * sortedTimings.length) - 1),
  )
  return sortedTimings[index] ?? 0
}

describe('proxy benchmark configuration', () => {
  it('uses the default iteration and round counts when env vars are absent', () => {
    expect(parseBenchmarkIterations(undefined)).toBe(50)
    expect(parseBenchmarkRounds(undefined)).toBe(5)
  })

  it('uses valid positive integer iteration and round overrides', () => {
    expect(parseBenchmarkIterations('75')).toBe(75)
    expect(parseBenchmarkRounds('9')).toBe(9)
  })

  it.each(['0', '-1', '1.5', 'abc', '', '5abc'])(
    'rejects invalid benchmark iteration value %j',
    (value) => {
      expect(() => parseBenchmarkIterations(value)).toThrow('ODX_PROXY_BENCHMARK_ITERATIONS')
    },
  )

  it.each(['0', '-1', '1.5', 'abc', '', '5abc'])(
    'rejects invalid benchmark round value %j',
    (value) => {
      expect(() => parseBenchmarkRounds(value)).toThrow('ODX_PROXY_BENCHMARK_ROUNDS')
    },
  )

  it('uses the default concurrency when the env var is absent', () => {
    expect(parseBenchmarkConcurrency(undefined)).toBe(5)
  })

  it('uses valid positive integer concurrency overrides', () => {
    expect(parseBenchmarkConcurrency('7')).toBe(7)
  })

  it.each(['0', '-1', '1.5', 'abc', '', '5abc'])(
    'rejects invalid benchmark concurrency value %j',
    (value) => {
      expect(() => parseBenchmarkConcurrency(value)).toThrow('ODX_PROXY_BENCHMARK_CONCURRENCY')
    },
  )
})

async function writeBenchmarkOutput(summaries: MeasurementSummary[]): Promise<void> {
  if (!benchmarkOutputPath)
    return

  const output = createBenchmarkOutput(summaries, {
    iterations: benchmarkIterations,
    rounds: benchmarkRounds,
    warmupIterations,
    defaultConcurrency: concurrentRequests,
  })

  await mkdir(dirname(benchmarkOutputPath), { recursive: true })
  await writeFile(benchmarkOutputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
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
    const devtoolsBaseline = await measureSequential('small seq devtools baseline', '/api/odx/BufferService/Products', () => ofetch(`${proxyUrl}/api/odx/BufferService/Products`))
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
      devtoolsBaseline,
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

    assignAverageOverhead(smallBuffered, smallDirect)
    assignAverageOverhead(smallStreamed, smallDirect)
    assignAverageOverhead(largeBuffered, largeDirect)
    assignAverageOverhead(largeStreamed, largeDirect)
    assignAverageOverhead(concurrentBuffered, concurrentDirect)
    assignAverageOverhead(concurrentStreamed, concurrentDirect)
    assignAverageOverhead(devtoolsBuffered, devtoolsBaseline)

    for (const summary of [
      smallBuffered,
      smallStreamed,
      largeBuffered,
      largeStreamed,
      concurrentBuffered,
      concurrentStreamed,
      devtoolsBuffered,
    ]) {
      expect(Number.isFinite(summary.overheadAvgMs)).toBe(true)
      expect(Number.isFinite(summary.overheadAvgPercent)).toBe(true)
    }

    process.stdout.write(formatBenchmarkReport(summaries))
    await writeBenchmarkOutput(summaries)
  }, 120000)
})
