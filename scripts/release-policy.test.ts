import { describe, expect, it } from 'vitest'
import {
  assertReleaseTagAllowed,
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
})
