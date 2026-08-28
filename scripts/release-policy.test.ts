import { describe, expect, it } from 'vitest'
import {
  assertReleaseTagAllowed,
  coordinatedReleaseVersion,
  releasePublishes,
  releaseTag,
} from './release-policy'

describe('odx release policy', () => {
  it('defaults to a dry-run-friendly prerelease tag', () => {
    expect(releaseTag(undefined)).toBe('next')
    expect(releasePublishes([])).toBe(false)
    expect(releasePublishes(['--publish'])).toBe(true)
    expect(releasePublishes(['--', '--publish'])).toBe(true)
  })

  it('rejects shell-shaped tags and unknown release switches', () => {
    expect(() => releaseTag('next; npm whoami')).toThrow('Invalid npm dist-tag')
    expect(() => releaseTag('-next')).toThrow('Invalid npm dist-tag')
    expect(() => releasePublishes(['--force'])).toThrow('Unknown release argument')
  })

  it('requires an explicit stable-channel promotion', () => {
    expect(() => assertReleaseTagAllowed('latest', undefined))
      .toThrow('ALLOW_LATEST=true')
    expect(() => assertReleaseTagAllowed('latest', 'false'))
      .toThrow('ALLOW_LATEST=true')
    expect(() => assertReleaseTagAllowed('latest', 'true')).not.toThrow()
    expect(() => assertReleaseTagAllowed('next', undefined)).not.toThrow()
  })

  it('derives the release identity from one coordinated public package version', () => {
    expect(coordinatedReleaseVersion([
      { name: '@me-tools/odx-core', version: '0.0.1-next.0' },
      { name: '@me-tools/odx-nuxt', version: '0.0.1-next.0' },
    ])).toBe('0.0.1-next.0')
  })

  it('rejects missing, invalid, or divergent public package versions', () => {
    expect(() => coordinatedReleaseVersion([])).toThrow('at least one public package')
    expect(() => coordinatedReleaseVersion([
      { name: '@me-tools/odx-core', version: 'next' },
    ])).toThrow('invalid version')
    expect(() => coordinatedReleaseVersion([
      { name: '@me-tools/odx-core', version: '0.0.1-next.0' },
      { name: '@me-tools/odx-nuxt', version: '0.0.2-next.0' },
    ])).toThrow('must share one coordinated release version')
  })
})
