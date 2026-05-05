import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { $odata, flattenOData, stringifyQuery } from '@bc8-odx/core'
import { detectODataVersion, extractEntitiesFromEdmx } from '@bc8-odx/core/server'

const here = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(here, '..')
const edmxPath = resolve(rootDir, 'test/fixtures/basic/edmx/test-v2.edmx')
const mockDataPath = resolve(rootDir, 'test/fixtures/basic/server/mockdata/TestService/TestItems.json')

const version = detectODataVersion(edmxPath)
const entities = extractEntitiesFromEdmx(edmxPath)
const query = stringifyQuery({
  $select: ['ID', 'Title'],
  $top: 2,
  $filter: 'Value gt 100',
})

const mockItems = JSON.parse(readFileSync(mockDataPath, 'utf-8'))
const v2Response = {
  d: {
    __count: String(mockItems.length),
    results: mockItems,
  },
}
const flattenedItems = flattenOData(v2Response)

async function client<T>(path: string, options?: { query?: Record<string, string> }): Promise<T> {
  return {
    path,
    query: options?.query,
    data: v2Response,
  } as T
}

async function main(): Promise<void> {
  const lowLevelResponse = await $odata<{
    path: string
    query?: Record<string, string>
    data: typeof v2Response
  }>(client, 'TestService', 'GET', {
    entitySet: 'TestItems',
    query,
  })

  console.warn(JSON.stringify({
    package: '@bc8-odx/core',
    version,
    entitySets: entities.map(entity => ({
      name: entity.name,
      type: entity.type,
      keys: entity.properties.filter(property => property.isKey).map(property => property.name),
    })),
    query,
    flattenedCount: Array.isArray(flattenedItems) ? flattenedItems.length : 0,
    firstItem: Array.isArray(flattenedItems) ? flattenedItems[0] : null,
    odataPath: lowLevelResponse.path,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
