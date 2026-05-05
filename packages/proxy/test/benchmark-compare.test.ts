import { describe, expect, it } from 'vitest'
import { formatComparison, parseBenchmarkReport } from '../../../scripts/compare-proxy-benchmarks'

describe('proxy benchmark comparison helper', () => {
  it('formats matching scenario average timing deltas', () => {
    const output = formatComparison(
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1 },
          { label: 'small seq buffer', path: '/api/odx/BufferService/Products', avgMs: 2 },
        ],
      },
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1.5 },
          { label: 'small seq buffer', path: '/api/odx/BufferService/Products', avgMs: 1 },
        ],
      },
    )

    expect(output).toContain('ODX proxy benchmark comparison')
    expect(output).toContain('small seq direct')
    expect(output).toContain('+0.50ms')
    expect(output).toContain('+50.0%')
    expect(output).toContain('-1.00ms')
    expect(output).toContain('-50.0%')
  })

  it('uses metadata and median round averages when reports include them', () => {
    const output = formatComparison(
      {
        createdAt: '2026-05-05T08:00:00.000Z',
        metadata: {
          node: 'v24.13.1',
          iterations: 50,
          rounds: 5,
          defaultConcurrency: 5,
        },
        scenarios: [
          { label: 'large conc stream', path: '/api/odx/StreamService/LargeProducts', avgMs: 10, medianRoundAvgMs: 8 },
        ],
      },
      {
        createdAt: '2026-05-05T08:05:00.000Z',
        metadata: {
          node: 'v24.13.1',
          iterations: 50,
          rounds: 5,
          defaultConcurrency: 5,
        },
        scenarios: [
          { label: 'large conc stream', path: '/api/odx/StreamService/LargeProducts', avgMs: 10, medianRoundAvgMs: 12 },
        ],
      },
    )

    expect(output).toContain('baseline: created=2026-05-05T08:00:00.000Z')
    expect(output).toContain('candidate: created=2026-05-05T08:05:00.000Z')
    expect(output).toContain('timing basis: median round average')
    expect(output).toContain('8.00ms')
    expect(output).toContain('12.00ms')
    expect(output).toContain('+50.0%')
  })

  it('keeps old reports without metadata compatible', () => {
    const output = formatComparison(
      { scenarios: [{ label: 'small seq direct', avgMs: 1 }] },
      { scenarios: [{ label: 'small seq direct', avgMs: 2 }] },
    )

    expect(output).not.toContain('baseline: created=')
    expect(output).toContain('1.00ms')
    expect(output).toContain('2.00ms')
  })

  it('reports scenarios that exist only in the baseline report', () => {
    const output = formatComparison(
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1 },
          { label: 'large seq direct', path: '/LargeProducts', avgMs: 4 },
        ],
      },
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1.5 },
        ],
      },
    )

    expect(output).toContain('small seq direct')
    expect(output).toContain('+0.50ms')
    expect(output).toContain('missing from candidate: large seq direct')
  })

  it('reports scenarios that exist only in the candidate report', () => {
    const output = formatComparison(
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1 },
        ],
      },
      {
        scenarios: [
          { label: 'small seq direct', path: '/Products', avgMs: 1.5 },
          { label: 'small seq devtools buffer', path: '/api/odx/DevToolsBufferService/Products', avgMs: 2 },
        ],
      },
    )

    expect(output).toContain('small seq direct')
    expect(output).toContain('+0.50ms')
    expect(output).toContain('missing from baseline: small seq devtools buffer')
  })

  it('rejects malformed report shapes', () => {
    expect(() => parseBenchmarkReport('{}', 'baseline')).toThrow('baseline report is missing scenarios array')
  })

  it('rejects scenarios without finite average timings', () => {
    expect(() => formatComparison(
      { scenarios: [{ label: 'small seq direct', avgMs: Number.NaN }] },
      { scenarios: [{ label: 'small seq direct', avgMs: 1 }] },
    )).toThrow('baseline scenario "small seq direct" is missing a finite avgMs value')
  })
})
