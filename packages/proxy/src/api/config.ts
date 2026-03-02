import type { ODataProxyConfig } from '@bc8-odx/core'
import type { EntityMapping } from '@bc8-odx/core/server'
import fs from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { detectODataVersion, extractEntitiesFromEdmx } from '@bc8-odx/core/server'
import { defineEventHandler } from 'h3'
import { createJiti } from 'jiti'
import { join, resolve } from 'pathe'

export default defineEventHandler(async (event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const buildDir = config.buildDir ?? ''
  const rootDir = config.rootDir ?? ''
  const services = config.services ?? []

  const jiti = createJiti(import.meta.url)

  const enhancedServices = await Promise.all(services.map(async (svc) => {
    const outDir = join(buildDir, 'sap-odata', 'generated', svc.name)
    const subDirName = svc.route || svc.name.toLowerCase()

    const possiblePaths = [
      join(outDir, 'index.ts'),
      join(outDir, 'index.js'),
      join(outDir, subDirName, 'index.ts'),
      join(outDir, subDirName, 'index.js'),
    ]

    let entities: EntityMapping[] = []
    let isGenerated = false
    let targetFile: string | null = null

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetFile = p
        break
      }
    }

    let edmxAbs = ''
    if (svc.url.startsWith('http')) {
      edmxAbs = join(buildDir, 'sap-odata', 'temp', `${svc.name}.edmx`)
    }
    else {
      edmxAbs = resolve(rootDir, svc.url)
    }

    const version = detectODataVersion(edmxAbs)

    if (targetFile) {
      isGenerated = true
      try {
        const sdk = (targetFile.endsWith('.ts')
          ? await jiti.import(targetFile)
          : await import(pathToFileURL(targetFile).href)) as Record<string, any>

        const apiFactoryName = `${svc.name}Api`
        const apiFactory = sdk[apiFactoryName]

        if (apiFactory) {
          const api = apiFactory()
          const sdkEntities = Object.keys(api).filter(k =>
            typeof api[k] === 'object' && k !== 'requestBuilder' && !k.startsWith('_'),
          ).map(name => ({ name, type: name }))
          if (sdkEntities.length > 0) {
            entities = sdkEntities
          }
        }
      }
      catch {
      }
    }

    if (entities.length === 0) {
      entities = extractEntitiesFromEdmx(edmxAbs)
    }

    return {
      ...svc,
      entities,
      isGenerated,
      version,
    }
  }))

  return {
    basePath: config.basePath || '/api/sap-odata',
    mode: config.mode || 'sdk',
    services: enhancedServices,
    forwardAuthHeader: config.forwardAuthHeader,
    versions: {
      node: process.version,
      module: '1.0.0',
    },
  }
})
