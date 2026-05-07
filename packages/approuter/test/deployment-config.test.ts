import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

interface XsAppRoute {
  authenticationType?: unknown
  destination?: unknown
  source?: unknown
  target?: unknown
}

interface XsAppConfig {
  routes?: XsAppRoute[]
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(currentDir, '../../..')

function stripYamlValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function isYamlKey(line: string, indent: number, key: string, value?: string): boolean {
  const expected = `${' '.repeat(indent)}${key}:`
  if (!line.startsWith(expected)) {
    return false
  }

  return value === undefined || stripYamlValue(line.slice(expected.length)) === value
}

function readYamlKeyValue(line: string, indent: number, key: string): string | undefined {
  const expected = `${' '.repeat(indent)}${key}:`
  return line.startsWith(expected) ? stripYamlValue(line.slice(expected.length)) : undefined
}

function getApprouterModuleBlock(mtaYaml: string): string[] {
  const lines = mtaYaml.split(/\r?\n/)
  const startIndex = lines.findIndex(line => isYamlKey(line, 2, '- name', 'odx-approuter'))

  if (startIndex === -1) {
    throw new Error('Unable to find odx-approuter module in mta.yaml')
  }

  const endIndex = lines.findIndex((line, index) => {
    return index > startIndex && (isYamlKey(line, 2, '- name') || isYamlKey(line, 0, 'resources'))
  })

  return lines.slice(startIndex, endIndex === -1 ? undefined : endIndex)
}

function getDestinationNamesFromApprouterModule(mtaYaml: string): Set<string> {
  const moduleLines = getApprouterModuleBlock(mtaYaml)
  const destinationNames = new Set<string>()

  for (let index = 0; index < moduleLines.length; index += 1) {
    if (!isYamlKey(moduleLines[index], 6, '- name')) {
      continue
    }

    const nextItemIndex = moduleLines.findIndex((line, candidateIndex) => {
      return candidateIndex > index && isYamlKey(line, 6, '- name')
    })
    const itemLines = moduleLines.slice(index, nextItemIndex === -1 ? undefined : nextItemIndex)

    if (!itemLines.some(line => isYamlKey(line, 8, 'group', 'destinations'))) {
      continue
    }

    const propertiesIndex = itemLines.findIndex(line => isYamlKey(line, 8, 'properties'))
    const nameLine = propertiesIndex === -1
      ? undefined
      : itemLines.slice(propertiesIndex + 1).find(line => isYamlKey(line, 10, 'name'))

    const destinationName = nameLine === undefined ? undefined : readYamlKeyValue(nameLine, 10, 'name')
    if (destinationName !== undefined) {
      destinationNames.add(destinationName)
    }
  }

  return destinationNames
}

function getRouteDestinations(xsApp: XsAppConfig): Array<{ destination: string, source: string }> {
  return (xsApp.routes ?? [])
    .filter((route): route is XsAppRoute & { destination: string } => typeof route.destination === 'string')
    .map(route => ({
      destination: route.destination,
      source: typeof route.source === 'string' ? route.source : '<unknown source>',
    }))
}

function resolveRoute(xsApp: XsAppConfig, path: string): XsAppRoute | undefined {
  const [pathname = path] = path.split('?')
  return (xsApp.routes ?? []).find((route) => {
    return typeof route.source === 'string' && new RegExp(route.source).test(pathname)
  })
}

describe('deployment config', () => {
  it('provides every AppRouter route destination from the odx-approuter MTA module', async () => {
    const [xsAppText, mtaYaml] = await Promise.all([
      readFile(resolve(repoRoot, 'packages/approuter/xs-app.json'), 'utf8'),
      readFile(resolve(repoRoot, 'mta.yaml'), 'utf8'),
    ])
    const xsApp = JSON.parse(xsAppText) as XsAppConfig
    const routeDestinations = getRouteDestinations(xsApp)
    const mtaDestinationNames = getDestinationNamesFromApprouterModule(mtaYaml)

    expect(routeDestinations, 'xs-app.json should declare route destinations to verify').not.toHaveLength(0)
    expect(
      routeDestinations.filter(route => !mtaDestinationNames.has(route.destination)),
      'missing MTA destination entries for AppRouter routes',
    ).toEqual([])
  })

  it('routes deployed Explorer client paths to the Explorer UI behind XSUAA', async () => {
    const xsAppText = await readFile(resolve(repoRoot, 'packages/approuter/xs-app.json'), 'utf8')
    const xsApp = JSON.parse(xsAppText) as XsAppConfig

    expect(xsApp.routes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: '^/__odx__/client$',
        target: '/',
        destination: 'odx-explorer-ui',
        authenticationType: 'xsuaa',
      }),
      expect.objectContaining({
        source: '^/__odx__/client/(.*)$',
        target: '/$1',
        destination: 'odx-explorer-ui',
        authenticationType: 'xsuaa',
      }),
    ]))

    for (const path of [
      '/__odx__/client',
      '/__odx__/client/',
      '/__odx__/client/_nuxt/app.js',
      '/__odx__/client/schema/Northwind',
    ]) {
      expect(resolveRoute(xsApp, path), `${path} should resolve to Explorer UI`).toEqual(expect.objectContaining({
        destination: 'odx-explorer-ui',
        authenticationType: 'xsuaa',
      }))
    }

    expect(resolveRoute(xsApp, '/__odx__/client-assets/app.js')).toBeUndefined()
  })

  it('routes internal Explorer APIs to the proxy behind XSUAA', async () => {
    const xsAppText = await readFile(resolve(repoRoot, 'packages/approuter/xs-app.json'), 'utf8')
    const xsApp = JSON.parse(xsAppText) as XsAppConfig

    expect(xsApp.routes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: '^/__odx__/(config|logs|schema|generate|types|me)(/.*|)$',
        target: '/__odx__/$1$2',
        destination: 'odx-proxy-backend',
        authenticationType: 'xsuaa',
      }),
    ]))

    for (const path of [
      '/__odx__/config',
      '/__odx__/logs',
      '/__odx__/schema?service=Northwind',
      '/__odx__/generate?service=Northwind',
      '/__odx__/types?service=Northwind',
      '/__odx__/me',
    ]) {
      expect(resolveRoute(xsApp, path), `${path} should resolve to proxy`).toEqual(expect.objectContaining({
        destination: 'odx-proxy-backend',
        authenticationType: 'xsuaa',
      }))
    }

    expect(resolveRoute(xsApp, '/__odx__/config-client.js')).toBeUndefined()
  })
})
