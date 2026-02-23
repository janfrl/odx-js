import fs from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { defineEventHandler, useRuntimeConfig } from '#imports'
import { createJiti } from 'jiti'
import { join, resolve } from 'pathe'

function extractEntitiesFromEdmx(edmxPath: string): string[] {
  if (!fs.existsSync(edmxPath))
    return []
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8')
    const entitySets: string[] = []
    // Match <EntitySet Name="EntitySetName" ... />
    const regex = /<EntitySet\s+Name="([^"]+)"/g
    let match = regex.exec(content)
    while (match !== null) {
      if (match[1])
        entitySets.push(match[1])
      match = regex.exec(content)
    }
    return entitySets
  }
  catch (e) {
    console.error(`[nuxt-sap-odata] Failed to parse EDMX at ${edmxPath}`, e)
    return []
  }
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const buildDir = config.odata?.buildDir as string
  const rootDir = config.odata?.rootDir as string
  const services = (config.odata?.services || []) as Array<{ name: string, route?: string, url: string }>

  const jiti = createJiti(import.meta.url)

  const enhancedServices = await Promise.all(services.map(async (svc) => {
    const outDir = join(buildDir, 'sap-odata', 'generated', svc.name)
    const subDirName = svc.route || svc.name.toLowerCase()

    const possiblePaths = [
      join(outDir, 'index.ts'),
      join(outDir, 'index.js'),
      join(outDir, subDirName, 'index.ts'),
      join(outDir, subDirName, 'index.js')
    ]

    let entities: string[] = []
    let isGenerated = false
    let targetFile: string | null = null

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) { targetFile = p; break; }
    }

    if (targetFile) {
      isGenerated = true
      try {
        const sdk = targetFile.endsWith('.ts')
          ? await jiti.import(targetFile)
          : await import(pathToFileURL(targetFile).href)

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
        // Fallback to EDMX if SDK import fails
      }
    }

    // Fallback to EDMX parsing if no entities found yet
    if (entities.length === 0) {
      let edmxAbs = ''
      if (svc.url.startsWith('http')) {
        edmxAbs = join(buildDir, 'sap-odata', 'temp', `${svc.name}.edmx`)
      }
      else {
        edmxAbs = resolve(rootDir, svc.url)
      }
      entities = extractEntitiesFromEdmx(edmxAbs)
    }

    return {
      ...svc,
      entities,
      isGenerated,
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
