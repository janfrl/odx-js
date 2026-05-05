import process from 'node:process'

export interface MeasurementSummary {
  label: string
  path: string
  iterations: number
  rounds: number
  concurrency: number
  minMs: number
  avgMs: number
  medianRoundAvgMs: number
  roundStdDevMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
  overheadAvgMs?: number
  overheadAvgPercent?: number
}

export interface BenchmarkOutputMetadata {
  node: string
  platform: string
  arch: string
  iterations: number
  rounds: number
  warmupIterations: number
  defaultConcurrency: number
  lifecycleEvent?: string
}

export interface BenchmarkOutput {
  name: string
  createdAt: string
  metadata: BenchmarkOutputMetadata
  scenarios: Array<MeasurementSummary & {
    category: string
  }>
}

export interface BenchmarkOutputOptions {
  createdAt?: string
  lifecycleEvent?: string
  metadata?: Partial<Pick<BenchmarkOutputMetadata, 'node' | 'platform' | 'arch'>>
}

function formatMs(value: number): string {
  return `${value.toFixed(2)}ms`
}

function formatOptionalMs(value?: number): string {
  return typeof value === 'number' ? formatMs(value) : '-'
}

function formatOptionalPercent(value?: number): string {
  return typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '-'
}

export function formatBenchmarkReport(summaries: MeasurementSummary[]): string {
  const rows = summaries.map(summary => [
    summary.label.padEnd(24),
    summary.path.padEnd(43),
    String(summary.iterations).padStart(10),
    String(summary.rounds).padStart(6),
    String(summary.concurrency).padStart(11),
    formatMs(summary.minMs).padStart(10),
    formatMs(summary.avgMs).padStart(10),
    formatMs(summary.medianRoundAvgMs).padStart(10),
    formatMs(summary.roundStdDevMs).padStart(10),
    formatMs(summary.p50Ms).padStart(10),
    formatMs(summary.p95Ms).padStart(10),
    formatMs(summary.maxMs).padStart(10),
    formatOptionalMs(summary.overheadAvgMs).padStart(15),
    formatOptionalPercent(summary.overheadAvgPercent).padStart(15),
  ])

  return [
    '',
    'ODX proxy performance baseline',
    [
      'scenario'.padEnd(24),
      'path'.padEnd(43),
      'iterations'.padStart(10),
      'rounds'.padStart(6),
      'concurrency'.padStart(11),
      'min'.padStart(10),
      'avg'.padStart(10),
      'round med'.padStart(10),
      'round sd'.padStart(10),
      'p50'.padStart(10),
      'p95'.padStart(10),
      'max'.padStart(10),
      'avg overhead'.padStart(15),
      'avg overhead %'.padStart(15),
    ].join('  '),
    ...rows.map(row => row.join('  ')),
    '',
  ].join('\n')
}

function benchmarkCategory(summary: MeasurementSummary): string {
  return summary.path.includes('LargeProducts')
    ? 'large'
    : summary.label.includes('devtools')
      ? 'devtools'
      : 'small'
}

export function createBenchmarkOutput(
  summaries: MeasurementSummary[],
  settings: {
    iterations: number
    rounds: number
    warmupIterations: number
    defaultConcurrency: number
  },
  options: BenchmarkOutputOptions = {},
): BenchmarkOutput {
  return {
    name: 'ODX proxy performance baseline',
    createdAt: options.createdAt || new Date().toISOString(),
    metadata: {
      node: options.metadata?.node || process.version,
      platform: options.metadata?.platform || process.platform,
      arch: options.metadata?.arch || process.arch,
      iterations: settings.iterations,
      rounds: settings.rounds,
      warmupIterations: settings.warmupIterations,
      defaultConcurrency: settings.defaultConcurrency,
      lifecycleEvent: options.lifecycleEvent ?? process.env.npm_lifecycle_event,
    },
    scenarios: summaries.map(summary => ({
      ...summary,
      category: benchmarkCategory(summary),
    })),
  }
}

export function assignAverageOverhead(summary: MeasurementSummary, baseline: MeasurementSummary): void {
  const overheadAvgMs = summary.avgMs - baseline.avgMs
  summary.overheadAvgMs = overheadAvgMs
  if (baseline.avgMs !== 0) {
    summary.overheadAvgPercent = (overheadAvgMs / baseline.avgMs) * 100
  }
}
