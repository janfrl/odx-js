import { resolve } from 'node:path'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

// Since we are running in a project that might have ESM issues with direct script imports in tests,
// we'll re-implement or mock parts of the logic if needed, but here we'll try to use the actual functions.
// Note: In a real scenario, I'd move the extraction logic to a separate lib file.

// For now, I'll copy-paste the extraction functions into the test or import them.
// Importing from scripts/extract-api-docs.ts might be tricky due to main() execution.

import * as extractor from '../scripts/extract-api-docs.js'

describe('api extractor', () => {
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(resolve('test/fixtures/api-extraction/sample.ts'))

  it('should extract interfaces correctly', () => {
    const declaration = sourceFile.getInterface('SampleInterface')!
    // @ts-expect-error - extractor is treated as any to access internal functions for testing
    const result = (extractor as any).extractInterface(declaration)

    expect(result.title).toBe('SampleInterface')
    expect(result.description).toBe('A sample interface for testing.')
    expect(result.properties).toHaveLength(3)

    const nameProp = result.properties.find((p: any) => p.name === 'name')
    expect(nameProp.type).toBe('string')
    expect(nameProp.default).toBe('"default-name"')
    expect(nameProp.required).toBe(true)

    const countProp = result.properties.find((p: any) => p.name === 'count')
    expect(countProp.required).toBe(false)
  })

  it('should extract type aliases correctly', () => {
    const declaration = sourceFile.getTypeAlias('SampleType')!
    // @ts-expect-error - extractor is treated as any to access internal functions for testing
    const result = (extractor as any).extractTypeAlias(declaration)

    expect(result.title).toBe('SampleType')
    expect(result.properties).toHaveLength(1)
    expect(result.properties[0].name).toBe('id')
    expect(result.properties[0].type).toBe('string | number')
  })

  it('should extract functions correctly', () => {
    const declaration = sourceFile.getFunction('sampleFunction')!
    // @ts-expect-error - extractor is treated as any to access internal functions for testing
    const result = (extractor as any).extractFunction(declaration)

    expect(result.title).toBe('sampleFunction')
    expect(result.properties).toHaveLength(2)

    const p1 = result.properties.find((p: any) => p.name === 'param1')
    expect(p1.description).toBe('The first parameter.')
    expect(p1.required).toBe(true)

    const p2 = result.properties.find((p: any) => p.name === 'param2')
    expect(p2.description).toBe('An optional second parameter.')
    expect(p2.default).toBe('42')
    expect(p2.required).toBe(false)
  })
})
