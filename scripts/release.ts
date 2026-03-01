import { execSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  // Build the workspace
  execCommand('pnpm build')

  for (const pkg of workspace.packages) {
    if (pkg.data.private)
      continue

    consola.info(`Publishing ${pkg.data.name}...`)
    const pkgDir = resolve(repoRoot, pkg.dir)

    // Sync metadata
    for (const file of ['README.md', 'LICENSE']) {
      try {
        copyFileSync(resolve(repoRoot, file), resolve(pkgDir, file))
      }
      catch {}
    }

    execCommand(`pnpm publish --access public --no-git-checks --tag ${tag}`, pkgDir)
    consola.success(`Published ${pkg.data.name}`)
  }

  consola.success('Release completed successfully!')
}

main().catch((err) => {
  consola.error('Release failed:', err)
  process.exit(1)
})
