import { execSync } from 'node:child_process'
import process from 'node:process'
import { consola } from 'consola'
import { loadWorkspace } from './_utils'

function execCommand(command: string, cwd?: string) {
  consola.info(`Executing: ${command}`)
  execSync(command, { stdio: 'inherit', cwd })
}

async function main() {
  const repoRoot = process.cwd()
  const workspace = await loadWorkspace(repoRoot)
  const tag = process.env.TAG || 'latest'

  consola.start(`Starting release for version v${workspace.rootPkg.data.version} with tag ${tag}`)

  execCommand('pnpm verify')

  const publishOrder = [
    '@bc8-odx/metadata',
    '@bc8-odx/core',
    '@bc8-odx/proxy',
    '@bc8-odx/explorer',
    '@bc8-odx/nuxt',
  ]

  for (const packageName of publishOrder) {
    const pkg = workspace.packages.find(candidate => candidate.data.name === packageName)
    if (!pkg) {
      throw new Error(`Release package is missing from the workspace: ${packageName}`)
    }

    if (pkg.data.private) {
      throw new Error(`Release package is unexpectedly private: ${packageName}`)
    }

    consola.info(`Publishing ${packageName}...`)
    execCommand(`pnpm publish --access public --no-git-checks --provenance --tag ${tag}`, pkg.dir)
    consola.success(`Published ${pkg.data.name}`)
  }

  consola.success('Release completed successfully!')
}

main().catch((err) => {
  consola.error('Release failed:', err)
  process.exit(1)
})
