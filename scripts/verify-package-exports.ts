import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const packageDirectories = [
  'packages/metadata',
  'packages/core',
  'packages/proxy',
  'packages/nuxt',
  'packages/explorer',
]

interface PackageManifest {
  name?: string
  private?: boolean
  exports?: unknown
  files?: string[]
  publishConfig?: {
    access?: string
  }
}

function collectExportTargets(value: unknown): string[] {
  if (typeof value === 'string')
    return [value]

  if (!value || typeof value !== 'object')
    return []

  return Object.values(value).flatMap(collectExportTargets)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition)
    throw new Error(message)
}

const repoRoot = process.cwd()

for (const packageDirectory of packageDirectories) {
  const packageRoot = path.resolve(repoRoot, packageDirectory)
  const manifestPath = path.join(packageRoot, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PackageManifest
  const packageName = manifest.name || packageDirectory

  assert(manifest.private === false, `${packageName} must explicitly opt into publication`)
  assert(manifest.publishConfig?.access === 'public', `${packageName} must publish with public access`)
  assert(Array.isArray(manifest.files) && manifest.files.length > 0, `${packageName} must define an explicit files allowlist`)

  for (const target of collectExportTargets(manifest.exports)) {
    assert(target.startsWith('./'), `${packageName} export must be package-relative: ${target}`)

    const absoluteTarget = path.resolve(packageRoot, target)
    assert(
      absoluteTarget.startsWith(`${packageRoot}${path.sep}`),
      `${packageName} export escapes the package root: ${target}`,
    )
    assert(fs.existsSync(absoluteTarget), `${packageName} export target is missing: ${target}`)
  }

  for (const includedPath of manifest.files) {
    assert(
      fs.existsSync(path.resolve(packageRoot, includedPath)),
      `${packageName} files entry is missing: ${includedPath}`,
    )
  }

  console.log(`Verified publish metadata and export targets for ${packageName}`)
}
