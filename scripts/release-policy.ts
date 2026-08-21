const releaseTagPattern = /^[a-z][a-z0-9._-]*$/u

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
