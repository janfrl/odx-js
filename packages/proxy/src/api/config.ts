import fs from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createJiti } from 'jiti'
import { join, resolve } from 'pathe'
import type { SapODataService } from '@bc8-odx/core'
import { extractEntitiesFromEdmx, detectODataVersion } from '@bc8-odx/core/server'

/**
 * Interface for the Nitro runtime configuration.
 */
export interface NitroRuntimeConfig {
  odata?: {
    services?: SapODataService[]
    buildDir?: string
    rootDir?: string
    destination?: string
    headers?: Record<string, string>
    forwardAuthHeader?: boolean
    rejectUnauthorized?: boolean
    auth?: {
      username?: string
      password?: string
      bearerToken?: string
    }
  }
  public: {
    odata?: {
      basePath?: string
      mode?: string
    }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as unknown as NitroRuntimeConfig
  const buildDir = config.odata?.buildDir ?? ''
  const rootDir = config.odata?.rootDir ?? ''
  const services = config.odata?.services ?? []

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

    let entities: string[] = []
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
          )
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
    basePath: config.public.odata?.basePath || '/api/sap-odata',
    mode: config.public.odata?.mode || 'sdk',
    services: enhancedServices,
    forwardAuthHeader: config.odata?.forwardAuthHeader,
    versions: {
      node: process.version,
      module: '1.0.0',
    },
  }
})
