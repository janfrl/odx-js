import { promises as fsp } from 'node:fs'
import { resolve } from 'pathe'
import { glob } from 'tinyglobby'

export interface Package {
  dir: string
  data: any
  save: () => Promise<void>
}

/**
 * Loads a package.json and provides a save method.
 */
export async function loadPackage(dir: string): Promise<Package> {
  const pkgPath = resolve(dir, 'package.json')
  const data = JSON.parse(await fsp.readFile(pkgPath, 'utf-8').catch(() => '{}'))
  const save = () => fsp.writeFile(pkgPath, `${JSON.stringify(data, null, 2)}\n`)

  return { dir, data, save }
}

/**
 * Loads the workspace and its packages.
 */
export async function loadWorkspace(dir: string) {
  const rootPkg = await loadPackage(dir)
  const pkgDirs = (await glob(['packages/*'], { onlyDirectories: true })).sort()

  const packages: Package[] = []
  for (const pkgDir of pkgDirs) {
    const pkg = await loadPackage(pkgDir)
    if (pkg.data.name) {
      packages.push(pkg)
    }
  }

  return {
    rootPkg,
    packages,
    save: () => Promise.all([rootPkg.save(), ...packages.map(pkg => pkg.save())]),
  }
}
