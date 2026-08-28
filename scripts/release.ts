import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { consola } from 'consola'
import { loadWorkspace } from './_utils'
import {
  assertReleaseTagAllowed,
  assertReleaseVersionAllowed,
  coordinatedReleaseVersion,
  releasePublishes,
  releaseTag,
} from './release-policy'

function execPnpm(args: readonly string[], cwd?: string) {
  const pnpmCli = process.env.npm_execpath
  if (pnpmCli === undefined)
    throw new Error('Run the release entrypoint through a pnpm package script.')
  consola.info(`Executing: pnpm ${args.join(' ')}`)
  execFileSync(process.execPath, [pnpmCli, ...args], { stdio: 'inherit', cwd })
}

async function main() {
  const repoRoot = process.cwd()
  const workspace = await loadWorkspace(repoRoot)
  const publish = releasePublishes(process.argv.slice(2))
  const tag = releaseTag(process.env.TAG)
  assertReleaseTagAllowed(tag, process.env.ALLOW_LATEST)

  const publishOrder = [
    '@me-tools/odx-metadata',
    '@me-tools/odx-core',
    '@me-tools/odx-proxy',
    '@me-tools/odx-explorer',
    '@me-tools/odx-nuxt',
  ]
  const releasePackages = publishOrder.map((packageName) => {
    const pkg = workspace.packages.find(candidate => candidate.data.name === packageName)
    if (!pkg)
      throw new Error(`Release package is missing from the workspace: ${packageName}`)
    if (pkg.data.private)
      throw new Error(`Release package is unexpectedly private: ${packageName}`)
    return pkg
  })
  const version = coordinatedReleaseVersion(
    releasePackages.map(pkg => ({ name: pkg.data.name, version: pkg.data.version })),
  )
  assertReleaseVersionAllowed(version, tag, publish)

  consola.start(
    `${publish ? 'Starting release' : 'Checking release'} for version v${version} with tag ${tag}`,
  )

  execPnpm(['verify'])

  for (const pkg of releasePackages) {
    const publishArgs = [
      'publish',
      '--access',
      'public',
      '--no-git-checks',
      '--tag',
      tag,
      ...(publish ? ['--provenance'] : ['--dry-run']),
    ]
    consola.info(`${publish ? 'Publishing' : 'Packing'} ${pkg.data.name}...`)
    execPnpm(publishArgs, pkg.dir)
    consola.success(`${publish ? 'Published' : 'Verified'} ${pkg.data.name}`)
  }

  consola.success(
    publish
      ? 'Release completed successfully!'
      : 'Release dry run completed; no package was published.',
  )
}

main().catch((err) => {
  consola.error('Release failed:', err)
  process.exit(1)
})
