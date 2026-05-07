import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export interface BenchmarkScenario {
  label: string
  avgMs: number
  medianRoundAvgMs?: number
  roundStdDevMs?: number
  path?: string
}

export interface BenchmarkMetadata {
  node?: string
  platform?: string
  arch?: string
  iterations?: number
  rounds?: number
  warmupIterations?: number
  defaultConcurrency?: number
  lifecycleEvent?: string
}

export interface BenchmarkReport {
  name?: string
  createdAt?: string
  metadata?: BenchmarkMetadata
  scenarios?: BenchmarkScenario[]
}

export function usage(): string {
  return 'Usage: pnpm run bench:proxy:compare -- <baseline.json> <candidate.json>'
}

export function parseBenchmarkReport(raw: string, role: string): BenchmarkReport {
  const report = JSON.parse(raw) as BenchmarkReport
  if (!Array.isArray(report.scenarios)) {
    throw new TypeError(`${role} report is missing scenarios array`)
  }
  return report
}

export async function readReport(path: string, role: string): Promise<BenchmarkReport> {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  }
  catch (error: any) {
    throw new Error(`Could not read ${role} report at ${path}: ${error.message}`)
  }

  try {
    return parseBenchmarkReport(raw, role)
  }
  catch (error: any) {
    throw new Error(`Invalid ${role} report at ${path}: ${error.message}`)
  }
}

function scenarioMap(report: BenchmarkReport, role: string): Map<string, BenchmarkScenario> {
  const scenarios = new Map<string, BenchmarkScenario>()
  for (const scenario of report.scenarios || []) {
    if (!scenario.label) {
      throw new TypeError(`${role} report contains a scenario without a label`)
    }
    if (scenarios.has(scenario.label)) {
      throw new TypeError(`${role} report contains duplicate scenario label "${scenario.label}"`)
    }
    if (!Number.isFinite(scenario.avgMs)) {
      throw new TypeError(`${role} scenario "${scenario.label}" is missing a finite avgMs value`)
    }
    if (scenario.medianRoundAvgMs !== undefined && !Number.isFinite(scenario.medianRoundAvgMs)) {
      throw new TypeError(`${role} scenario "${scenario.label}" has a non-finite medianRoundAvgMs value`)
    }
    scenarios.set(scenario.label, scenario)
  }
  return scenarios
}

function formatMs(value: number): string {
  return `${value.toFixed(2)}ms`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function comparisonMs(scenario: BenchmarkScenario): number {
  return Number.isFinite(scenario.medianRoundAvgMs) ? scenario.medianRoundAvgMs! : scenario.avgMs
}

function metadataLine(role: string, report: BenchmarkReport): string | undefined {
  if (!report.metadata && !report.createdAt)
    return undefined

  const fields = [
    report.createdAt ? `created=${report.createdAt}` : undefined,
    report.metadata?.node ? `node=${report.metadata.node}` : undefined,
    report.metadata?.iterations ? `iterations=${report.metadata.iterations}` : undefined,
    report.metadata?.rounds ? `rounds=${report.metadata.rounds}` : undefined,
    report.metadata?.defaultConcurrency ? `concurrency=${report.metadata.defaultConcurrency}` : undefined,
  ].filter(Boolean)

  return `${role}: ${fields.join(', ')}`
}

function metadataMismatchWarnings(baseline: BenchmarkReport, candidate: BenchmarkReport): string[] {
  const fields: Array<keyof BenchmarkMetadata> = [
    'node',
    'platform',
    'arch',
    'iterations',
    'rounds',
    'warmupIterations',
    'defaultConcurrency',
  ]

  return fields.flatMap((field) => {
    const baselineValue = baseline.metadata?.[field]
    const candidateValue = candidate.metadata?.[field]
    if (baselineValue === undefined || candidateValue === undefined || baselineValue === candidateValue)
      return []

    return [`warning: metadata mismatch: ${field} baseline=${baselineValue} candidate=${candidateValue}`]
  })
}

export function formatComparison(baseline: BenchmarkReport, candidate: BenchmarkReport): string {
  const baselineScenarios = scenarioMap(baseline, 'baseline')
  const candidateScenarios = scenarioMap(candidate, 'candidate')

  const missingFromCandidate = [...baselineScenarios.keys()].filter(label => !candidateScenarios.has(label))
  const missingFromBaseline = [...candidateScenarios.keys()].filter(label => !baselineScenarios.has(label))

  const rows = Array.from(baselineScenarios.entries()).flatMap(([label, base]) => {
    const next = candidateScenarios.get(label)
    if (!next)
      return []

    const baseMs = comparisonMs(base)
    const nextMs = comparisonMs(next)
    const delta = nextMs - baseMs
    const percent = baseMs === 0 ? Number.NaN : (delta / baseMs) * 100
    return [[
      label.padEnd(28),
      (base.path || '').padEnd(43),
      formatMs(baseMs).padStart(10),
      formatMs(nextMs).padStart(10),
      `${delta >= 0 ? '+' : ''}${formatMs(delta)}`.padStart(10),
      (Number.isFinite(percent) ? formatPercent(percent) : 'n/a').padStart(9),
    ].join('  ')]
  })

  const metadata = [
    metadataLine('baseline', baseline),
    metadataLine('candidate', candidate),
  ].filter(Boolean)
  const metadataWarnings = metadataMismatchWarnings(baseline, candidate)

  return [
    '',
    'ODX proxy benchmark comparison',
    ...metadata,
    ...metadataWarnings,
    metadata.length > 0 ? 'timing basis: median round average when available, otherwise average' : undefined,
    [
      'scenario'.padEnd(28),
      'path'.padEnd(43),
      'baseline'.padStart(10),
      'candidate'.padStart(10),
      'delta'.padStart(10),
      'delta %'.padStart(9),
    ].join('  '),
    ...rows,
    ...missingFromCandidate.map(label => `missing from candidate: ${label}`),
    ...missingFromBaseline.map(label => `missing from baseline: ${label}`),
    '',
  ].filter(line => line !== undefined).join('\n')
}

export async function runCli(args: string[] = process.argv.slice(2)): Promise<number> {
  const [baselinePath, candidatePath] = args.filter(arg => arg !== '--')
  if (!baselinePath || !candidatePath) {
    console.error(usage())
    return 1
  }

  try {
    const baseline = await readReport(baselinePath, 'baseline')
    const candidate = await readReport(candidatePath, 'candidate')
    process.stdout.write(formatComparison(baseline, candidate))
    return 0
  }
  catch (error: any) {
    console.error(error.message)
    return 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  process.exitCode = await runCli()
}
