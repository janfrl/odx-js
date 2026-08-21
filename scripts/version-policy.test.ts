import { describe, expect, it } from 'vitest'
import { assertSemanticVersion } from './version-policy'

describe('workspace version policy', () => {
  it.each([
    '0.0.1',
    '1.2.3',
    '1.2.3-next.1',
    '1.2.3-rc.0+build.5',
  ])('accepts SemVer %s', (version) => {
    expect(() => assertSemanticVersion(version)).not.toThrow()
  })

  it.each([
    '',
    'v1.2.3',
    '1.2',
    '01.2.3',
    '1.2.3-01',
    '1.2.3; npm publish',
  ])('rejects invalid version %s', (version) => {
    expect(() => assertSemanticVersion(version)).toThrow('Invalid semantic version')
  })
})
