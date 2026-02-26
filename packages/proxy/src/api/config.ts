import type { SapODataService } from '@bc8-odx/core'
import fs from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { defineEventHandler } from 'h3'
import { createJiti } from 'jiti'
import { useRuntimeConfig } from 'nitropack/runtime'
import { join, resolve } from 'pathe'

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

/**
 * Extracts entity set names from an EDMX file.
 * @param edmxPath - Path to the EDMX file.
 * @returns An array of entity set names.
 */
function extractEntitiesFromEdmx(edmxPath: string): string[] {
  if (!fs.existsSync(edmxPath)) {
    return []
  }
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8')
    const entitySets: string[] = []
    const regex = /<EntitySet\s+Name="([^"]+)"/g
    let match = regex.exec(content)
    while (match !== null) {
      if (match[1]) {
        entitySets.push(match[1])
      }
      match = regex.exec(content)
    }
    return entitySets
  }
  catch (e) {
    console.error(`[nuxt-sap-odata] Failed to parse EDMX at ${edmxPath}`, e)
    return []
  }
}

/**
 * Detects the OData version from an EDMX file.
 * @param edmxPath - Path to the EDMX file.
 * @returns 'v2', 'v4', or null if not detected.
 */
function detectODataVersion(edmxPath: string): 'v2' | 'v4' | null {
  if (!fs.existsSync(edmxPath)) {
    return null
  }
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8').slice(0, 3000)

    if (content.includes('Version="4.0"')) {
      return 'v4'
    }
    if (content.includes('DataServiceVersion="2.0"') || content.includes('DataServiceVersion="1.0"')) {
      return 'v2'
    }

    if (content.includes('http://schemas.microsoft.com/ado/2007/06/edmx')) {
      return 'v2'
    }
    if (content.includes('http://docs.oasis-open.org/odata/ns/edmx')) {
      return 'v4'
    }

    return null
  }
  catch {
    return null
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
