import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { $odata, flattenOData, stringifyQuery } from '@bc8-odx/core'
import { detectODataVersion, extractEntitiesFromEdmx } from '@bc8-odx/core/server'

interface TestItem {
  ID: string
  Title: string
  Value: number
}

type FlattenedItems = TestItem[] & { totalCount?: number }

interface LowLevelResponse {
  path: string
  method?: string
  query?: Record<string, string>
  data: FlattenedItems
}

const expectedQuery = {
  $select: 'ID,Title',
  $top: '2',
  $filter: 'Value gt 100',
}

const expectedFirstItem: TestItem = {
  ID: '1',
  Title: 'Test Item 1',
  Value: 100,
}

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
const flattenedItems = flattenOData(v2Response) as FlattenedItems

function assertStandaloneCoreBehavior(lowLevelResponse: LowLevelResponse): void {
  assert.equal(version, 'v2', 'Expected basic EDMX fixture to be detected as OData V2')
  assert.deepEqual(
    entities.map(entity => ({
      name: entity.name,
      type: entity.type,
      keys: entity.properties.filter(property => property.isKey).map(property => property.name),
      properties: entity.properties.map(property => ({
        name: property.name,
        type: property.type,
        isKey: property.isKey,
      })),
    })),
    [
      {
        name: 'TestItems',
        type: 'TestItem',
        keys: ['ID'],
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Title', type: 'Edm.String', isKey: false },
          { name: 'Value', type: 'Edm.Int32', isKey: false },
        ],
      },
    ],
    'Expected entity extraction to return the TestItems set with ID as key',
  )
  assert.deepEqual(query, expectedQuery, 'Expected OData query options to stringify to URL query strings')

  assert.equal(Array.isArray(flattenedItems), true, 'Expected V2 response envelope to flatten to an array')
  assert.equal(flattenedItems.length, 3, 'Expected flattened V2 response to contain all fixture items')
  assert.equal(flattenedItems.totalCount, 3, 'Expected flattened V2 response to preserve __count as totalCount')
  assert.deepEqual(flattenedItems[0], expectedFirstItem, 'Expected flattened first item to match the fixture')

  assert.equal(lowLevelResponse.path, 'TestService/TestItems', 'Expected $odata to build a service/entitySet path')
  assert.equal(lowLevelResponse.method, 'GET', 'Expected $odata to forward the requested HTTP method')
  assert.deepEqual(lowLevelResponse.query, expectedQuery, 'Expected $odata to forward stringified query options')
  assert.equal(Array.isArray(lowLevelResponse.data), true, 'Expected $odata to flatten the client response data')
  assert.equal(lowLevelResponse.data.totalCount, 3, 'Expected $odata response data to preserve the flattened count')
  assert.deepEqual(lowLevelResponse.data[0], expectedFirstItem, 'Expected $odata response data to contain fixture items')
}

async function client<T>(path: string, options?: { method?: string, query?: Record<string, string> }): Promise<T> {
  return {
    path,
    method: options?.method,
    query: options?.query,
    data: v2Response,
  } as T
}

async function main(): Promise<void> {
  const lowLevelResponse = await $odata<LowLevelResponse>(client, 'TestService', 'GET', {
    entitySet: 'TestItems',
    query,
  })

  assertStandaloneCoreBehavior(lowLevelResponse)

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
