const releaseTagPattern = /^[a-z][a-z0-9._-]*$/u
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u

export interface ReleasePackage {
  readonly name?: string
  readonly version?: string
}

export function coordinatedReleaseVersion(packages: readonly ReleasePackage[]): string {
  if (packages.length === 0)
    throw new Error('A coordinated ODX release requires at least one public package.')

  const versions = new Map<string, string[]>()
  for (const pkg of packages) {
    if (typeof pkg.name !== 'string' || pkg.name.length === 0)
      throw new TypeError('Every coordinated ODX release package requires a name.')
    if (typeof pkg.version !== 'string' || !semanticVersionPattern.test(pkg.version)) {
      throw new TypeError(
        `Release package ${pkg.name} has invalid version ${JSON.stringify(pkg.version)}.`,
      )
    }
    const names = versions.get(pkg.version) ?? []
    names.push(pkg.name)
    versions.set(pkg.version, names)
  }

  if (versions.size !== 1) {
    const detail = Array.from(
      versions,
      ([version, names]) => `${version}: ${names.join(', ')}`,
    )
      .join('; ')
    throw new Error(`ODX public packages must share one coordinated release version (${detail}).`)
  }

  return versions.keys().next().value as string
}

export function releaseTag(value: string | undefined): string {
  const tag = value ?? 'next'
  if (!releaseTagPattern.test(tag))
    throw new TypeError(`Invalid npm dist-tag: ${JSON.stringify(tag)}`)
  return tag
}

export function releasePublishes(args: readonly string[]): boolean {
  const normalized = args.filter(argument => argument !== '--')
  const known = new Set(['--publish'])
  const unknown = normalized.filter(argument => !known.has(argument))
  if (unknown.length > 0)
    throw new TypeError(`Unknown release argument: ${unknown.join(', ')}`)
  return normalized.includes('--publish')
}

export function assertReleaseTagAllowed(
  tag: string,
  allowLatest: string | undefined,
): void {
  if (tag === 'latest' && allowLatest !== 'true') {
    throw new Error(
      'Publishing with the latest dist-tag requires ALLOW_LATEST=true after prerelease acceptance.',
    )
  }
}
