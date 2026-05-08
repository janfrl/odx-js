import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

type YamlScalar = boolean | string

interface XsAppRoute {
  authenticationType?: unknown
  destination?: unknown
  source?: unknown
  target?: unknown
}

interface XsAppConfig {
  routes?: XsAppRoute[]
}

interface MtaNamedItem {
  group?: string
  name: string
  properties: Record<string, YamlScalar>
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(currentDir, '../../..')
const defaultUrlProperty = '$' + '{default-url}'

function stripYamlValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function parseYamlScalar(value: string): YamlScalar {
  const stripped = stripYamlValue(value)

  if (stripped === 'true') {
    return true
  }

  if (stripped === 'false') {
    return false
  }

  return stripped
}

function countLeadingSpaces(line: string): number {
  return line.length - line.trimStart().length
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

function getMtaModuleBlock(mtaYaml: string, moduleName: string): string[] {
  const lines = mtaYaml.split(/\r?\n/)
  const startIndex = lines.findIndex(line => isYamlKey(line, 2, '- name', moduleName))

  if (startIndex === -1) {
    throw new Error(`Unable to find ${moduleName} module in mta.yaml`)
  }

  const endIndex = lines.findIndex((line, index) => {
    return index > startIndex && (isYamlKey(line, 2, '- name') || isYamlKey(line, 0, 'resources'))
  })

  return lines.slice(startIndex, endIndex === -1 ? undefined : endIndex)
}

function getMtaResourceBlock(mtaYaml: string, resourceName: string): string[] {
  const lines = mtaYaml.split(/\r?\n/)
  const resourcesIndex = lines.findIndex(line => isYamlKey(line, 0, 'resources'))

  if (resourcesIndex === -1) {
    throw new Error('Unable to find resources section in mta.yaml')
  }

  const startIndex = lines.findIndex((line, index) => {
    return index > resourcesIndex && isYamlKey(line, 2, '- name', resourceName)
  })

  if (startIndex === -1) {
    throw new Error(`Unable to find ${resourceName} resource in mta.yaml`)
  }

  const endIndex = lines.findIndex((line, index) => {
    return index > startIndex && isYamlKey(line, 2, '- name')
  })

  return lines.slice(startIndex, endIndex === -1 ? undefined : endIndex)
}

function getMtaModuleSectionBlock(mtaYaml: string, moduleName: string, sectionName: string): string[] {
  const moduleLines = getMtaModuleBlock(mtaYaml, moduleName)
  const startIndex = moduleLines.findIndex(line => isYamlKey(line, 4, sectionName))

  if (startIndex === -1) {
    return []
  }

  const endIndex = moduleLines.findIndex((line, index) => {
    return index > startIndex && countLeadingSpaces(line) === 4 && line.trim() !== ''
  })

  return moduleLines.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex)
}

function getYamlListItems(sectionLines: string[], itemIndent: number): string[][] {
  const items: string[][] = []
  let currentItem: string[] | undefined

  for (const line of sectionLines) {
    if (isYamlKey(line, itemIndent, '- name')) {
      if (currentItem !== undefined) {
        items.push(currentItem)
      }
      currentItem = [line]
      continue
    }

    if (currentItem !== undefined) {
      currentItem.push(line)
    }
  }

  if (currentItem !== undefined) {
    items.push(currentItem)
  }

  return items
}

function readYamlProperties(itemLines: string[], propertiesIndent: number): Record<string, YamlScalar> {
  const propertiesIndex = itemLines.findIndex(line => isYamlKey(line, propertiesIndent, 'properties'))

  if (propertiesIndex === -1) {
    return {}
  }

  const properties: Record<string, YamlScalar> = {}

  for (const line of itemLines.slice(propertiesIndex + 1)) {
    if (line.trim() === '') {
      continue
    }

    if (countLeadingSpaces(line) <= propertiesIndent) {
      break
    }

    const propertyIndent = propertiesIndent + 2
    const match = line.match(new RegExp(`^ {${propertyIndent}}([^:]+):(.*)$`))
    if (match === null) {
      continue
    }

    const [, key, value = ''] = match
    properties[key.trim()] = parseYamlScalar(value)
  }

  return properties
}

function parseMtaNamedItems(sectionLines: string[], itemIndent: number): MtaNamedItem[] {
  return getYamlListItems(sectionLines, itemIndent).map((itemLines) => {
    const name = readYamlKeyValue(itemLines[0] ?? '', itemIndent, '- name')

    if (name === undefined) {
      throw new Error('Unable to parse MTA list item name')
    }

    const groupLine = itemLines.find(line => isYamlKey(line, itemIndent + 2, 'group'))

    return {
      group: groupLine === undefined ? undefined : readYamlKeyValue(groupLine, itemIndent + 2, 'group'),
      name,
      properties: readYamlProperties(itemLines, itemIndent + 2),
    }
  })
}

function getMtaModuleRequirements(mtaYaml: string, moduleName: string): MtaNamedItem[] {
  return parseMtaNamedItems(getMtaModuleSectionBlock(mtaYaml, moduleName, 'requires'), 6)
}

function getMtaModuleProvides(mtaYaml: string, moduleName: string): MtaNamedItem[] {
  return parseMtaNamedItems(getMtaModuleSectionBlock(mtaYaml, moduleName, 'provides'), 6)
}

function getDestinationRequirementsFromApprouterModule(mtaYaml: string): MtaNamedItem[] {
  return getMtaModuleRequirements(mtaYaml, 'odx-approuter').filter((requirement) => {
    return requirement.group === 'destinations'
  })
}

function getDestinationNamesFromApprouterModule(mtaYaml: string): Set<string> {
  const destinationNames = getDestinationRequirementsFromApprouterModule(mtaYaml)
    .map(requirement => requirement.properties.name)
    .filter((name): name is string => typeof name === 'string')

  return new Set(destinationNames)
}

function getRouteDestinations(xsApp: XsAppConfig): Array<{ destination: string, source: string }> {
  return (xsApp.routes ?? [])
    .filter((route): route is XsAppRoute & { destination: string } => typeof route.destination === 'string')
    .map(route => ({
      destination: route.destination,
      source: typeof route.source === 'string' ? route.source : '<unknown source>',
    }))
}

function getMatchingRoutes(xsApp: XsAppConfig, path: string): XsAppRoute[] {
  const [pathname = path] = path.split('?')
  return (xsApp.routes ?? []).filter((route) => {
    return typeof route.source === 'string' && new RegExp(route.source).test(pathname)
  })
}

function resolveRoute(xsApp: XsAppConfig, path: string): XsAppRoute | undefined {
  return getMatchingRoutes(xsApp, path)[0]
}

function expectManagedServiceResource(mtaYaml: string, resourceName: string, serviceName: string): void {
  const resourceLines = getMtaResourceBlock(mtaYaml, resourceName)
  const resourceType = resourceLines
    .map(line => readYamlKeyValue(line, 4, 'type'))
    .find((value): value is string => value !== undefined)
  const service = resourceLines
    .map(line => readYamlKeyValue(line, 6, 'service'))
    .find((value): value is string => value !== undefined)

  expect(resourceType, `${resourceName} should be a managed service`).toBe('org.cloudfoundry.managed-service')
  expect(service, `${resourceName} should use the expected service offering`).toBe(serviceName)
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

  it('wires AppRouter destination requirements to provider modules with forwarded auth tokens', async () => {
    const mtaYaml = await readFile(resolve(repoRoot, 'mta.yaml'), 'utf8')
    const destinationRequirements = getDestinationRequirementsFromApprouterModule(mtaYaml)
    const expectedDestinations = [
      {
        destinationName: 'odx-proxy-backend',
        providerModuleName: 'odx-proxy',
        providerName: 'odx-proxy-url',
      },
      {
        destinationName: 'odx-explorer-ui',
        providerModuleName: 'odx-explorer',
        providerName: 'odx-explorer-url',
      },
    ]

    for (const expectedDestination of expectedDestinations) {
      const destinationRequirement = destinationRequirements.find((requirement) => {
        return requirement.name === expectedDestination.providerName
      })
      const provider = getMtaModuleProvides(mtaYaml, expectedDestination.providerModuleName).find((providedItem) => {
        return providedItem.name === expectedDestination.providerName
      })

      expect(destinationRequirement, `${expectedDestination.providerName} should be consumed by odx-approuter`).toEqual(expect.objectContaining({
        group: 'destinations',
        properties: expect.objectContaining({
          forwardAuthToken: true,
          name: expectedDestination.destinationName,
          url: '~{url}',
        }),
      }))
      expect(provider, `${expectedDestination.providerName} should be provided by ${expectedDestination.providerModuleName}`).toEqual(expect.objectContaining({
        properties: expect.objectContaining({
          url: defaultUrlProperty,
        }),
      }))
    }
  })

  it('binds production runtime modules to required platform services', async () => {
    const mtaYaml = await readFile(resolve(repoRoot, 'mta.yaml'), 'utf8')

    expectManagedServiceResource(mtaYaml, 'odx-xsuaa', 'xsuaa')
    expectManagedServiceResource(mtaYaml, 'odx-destination', 'destination')
    expectManagedServiceResource(mtaYaml, 'odx-connectivity', 'connectivity')

    expect(getMtaModuleRequirements(mtaYaml, 'odx-proxy').map(requirement => requirement.name)).toEqual(expect.arrayContaining([
      'odx-connectivity',
      'odx-destination',
      'odx-xsuaa',
    ]))
    expect(getMtaModuleRequirements(mtaYaml, 'odx-explorer').map(requirement => requirement.name)).toEqual(expect.arrayContaining([
      'odx-xsuaa',
    ]))
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

  it('does not expose unsupported /__odx__ paths through a broad catch-all route', async () => {
    const xsAppText = await readFile(resolve(repoRoot, 'packages/approuter/xs-app.json'), 'utf8')
    const xsApp = JSON.parse(xsAppText) as XsAppConfig
    const deployedClientPaths = [
      '/__odx__/client/_nuxt/app.js',
      '/__odx__/client/assets/logo.svg',
      '/__odx__/client/schema/Northwind',
    ]
    const unsupportedRuntimePaths = [
      '/__odx__/client-assets/app.js',
      '/__odx__/health',
      '/__odx__/mockdata',
      '/__odx__/proxy/Northwind/Products',
      '/__odx__/runtime/config',
    ]

    for (const path of deployedClientPaths) {
      expect(
        getMatchingRoutes(xsApp, path).filter(route => route.destination === 'odx-proxy-backend'),
        `${path} should not match any proxy catch-all route`,
      ).toEqual([])
      expect(resolveRoute(xsApp, path), `${path} should resolve to Explorer UI`).toEqual(expect.objectContaining({
        destination: 'odx-explorer-ui',
      }))
    }

    for (const path of unsupportedRuntimePaths) {
      expect(resolveRoute(xsApp, path), `${path} should not resolve through AppRouter`).toBeUndefined()
    }
  })
})
