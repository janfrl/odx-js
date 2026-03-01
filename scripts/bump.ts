import process from 'node:process'
import { consola } from 'consola'
import { loadWorkspace } from './_utils'

async function main() {
  const workspace = await loadWorkspace(process.cwd())
  const newVersion = process.argv[2] || workspace.rootPkg.data.version

  if (!newVersion) {
    throw new Error('No version found to bump!')
  }

  const pkgNames = workspace.packages.map(pkg => pkg.data.name)

  for (const pkg of workspace.packages) {
    pkg.data.version = newVersion

    for (const type of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      if (!pkg.data[type])
        continue
      for (const [name, range] of Object.entries(pkg.data[type])) {
        if (pkgNames.includes(name)) {
          pkg.data[type][name] = (range as string).startsWith('workspace:') ? 'workspace:*' : newVersion
        }
      }
    }
  }

  await workspace.save()
  consola.success(`Bumped workspace to ${newVersion}`)
}

main().catch((err) => {
  consola.error(err)
  process.exit(1)
})
