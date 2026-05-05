import type { MeasurementSummary } from './benchmark-report'
import { describe, expect, it } from 'vitest'
import { assignAverageOverhead, createBenchmarkOutput, formatBenchmarkReport } from './benchmark-report'

function summary(overrides: Partial<MeasurementSummary> = {}): MeasurementSummary {
  return {
    label: 'small seq buffer',
    path: '/api/odx/BufferService/Products',
    iterations: 50,
    rounds: 5,
    concurrency: 1,
    minMs: 0.5,
    avgMs: 0.8,
    medianRoundAvgMs: 0.75,
    roundStdDevMs: 0.1,
    p50Ms: 0.7,
    p95Ms: 1.1,
    maxMs: 1.4,
    ...overrides,
  }
}

describe('proxy benchmark report formatting', () => {
  it('renders average overhead columns when overhead values exist', () => {
    const output = formatBenchmarkReport([
      summary({
        overheadAvgMs: 0.45,
        overheadAvgPercent: 128.8,
      }),
    ])

    expect(output).toContain('avg overhead')
    expect(output).toContain('avg overhead %')
    expect(output).toContain('0.45ms')
    expect(output).toContain('+128.8%')
  })

  it('renders missing overhead values as dashes', () => {
    const output = formatBenchmarkReport([summary()])

    expect(output).toContain('small seq buffer')
    expect(output).toMatch(/small seq buffer[\s\S]*-\s+-/)
  })

  it('creates benchmark JSON output with stable metadata and scenario categories', () => {
    const output = createBenchmarkOutput(
      [
        summary({ label: 'small seq direct', path: '/Products' }),
        summary({ label: 'large conc stream', path: '/api/odx/StreamService/LargeProducts' }),
        summary({ label: 'small seq devtools buffer', path: '/api/odx/DevToolsBufferService/Products' }),
      ],
      {
        iterations: 50,
        rounds: 7,
        warmupIterations: 10,
        defaultConcurrency: 5,
      },
      {
        createdAt: '2026-05-05T10:00:00.000Z',
        lifecycleEvent: 'bench:proxy',
        metadata: {
          node: 'v24.13.1',
          platform: 'win32',
          arch: 'x64',
        },
      },
    )

    expect(output).toMatchObject({
      name: 'ODX proxy performance baseline',
      createdAt: '2026-05-05T10:00:00.000Z',
      metadata: {
        node: 'v24.13.1',
        platform: 'win32',
        arch: 'x64',
        iterations: 50,
        rounds: 7,
        warmupIterations: 10,
        defaultConcurrency: 5,
        lifecycleEvent: 'bench:proxy',
      },
    })
    expect(output.scenarios.map(item => item.category)).toEqual(['small', 'large', 'devtools'])
  })

  it('assigns average overhead from a direct baseline', () => {
    const baseline = summary({ avgMs: 0.4 })
    const proxied = summary({ avgMs: 0.9 })

    assignAverageOverhead(proxied, baseline)

    expect(proxied.overheadAvgMs).toBeCloseTo(0.5)
    expect(proxied.overheadAvgPercent).toBeCloseTo(125)
  })
})
