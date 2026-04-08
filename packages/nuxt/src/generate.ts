import type { EntityMapping, ODataProxyConfig, ODataServiceConfig } from '@bc8-odx/core'
import type { Nuxt } from '@nuxt/schema'
import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import https from 'node:https'
import { extractEntitiesFromEdmx } from '@bc8-odx/core/server'
import { consola } from 'consola'
import { join, resolve } from 'pathe'

const logger = consola.withTag('@bc8-odx/nuxt')

/**
 * Core function to generate TypeScript types from an EDMX metadata file using odata2ts via execSync.
 */
export async function generateODataTypes(xmlFilePath: string, outputDir: string, serviceName: string): Promise<void> {
  // Use pnpm odata2ts to use the locally installed version in the workspace
  const command = `pnpm odata2ts --source ${xmlFilePath} --output ${outputDir} --mode models --emit-mode ts --prettier`

  try {
    execSync(command, { stdio: 'pipe' })
    logger.success(`Generated SDK for ${serviceName}`)
  }
  catch (err: any) {
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message
    logger.error(`Failed to generate SDK for ${serviceName}: ${output}`)
    throw err
  }
}

/**
 * Downloads metadata from a remote OData service.
 */
export async function downloadMetadata(svc: ODataServiceConfig, config: ODataProxyConfig): Promise<string> {
  const metadataUrl = svc.url!.endsWith('/') ? `${svc.url}$metadata` : `${svc.url}/$metadata`
  const auth = svc.auth || config.auth || {}
  const headers: Record<string, string> = {}

  if (auth.bearerToken) {
    headers.Authorization = `Bearer ${auth.bearerToken}`
  }
  else if (auth.username && auth.password) {
    headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
  }

  return new Promise<string>((resolve, reject) => {
    https.get(metadataUrl, { headers, rejectUnauthorized: config.rejectUnauthorized }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300))
        return reject(new Error(`Status: ${res.statusCode}`))
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

/**
 * Generates the virtual d.ts content for the OData service registry.
 */
export function generateRegistryDts(
  serviceEntities: Record<string, EntityMapping[]>,
  serviceModelFiles: Record<string, string>,
): string {
  const indexDtsLines = ['import type { ODataServiceRegistry, ODataService } from "@bc8-odx/core"']

  for (const [svcName, modelFile] of Object.entries(serviceModelFiles)) {
    indexDtsLines.push(`import * as ${svcName}Models from "./${svcName}/${modelFile}"`)
  }

  indexDtsLines.push('\ndeclare module "@bc8-odx/core" {')
  indexDtsLines.push('  interface ODataServiceRegistry {')
  for (const [svcName, entities] of Object.entries(serviceEntities)) {
    const entityNames = entities.map(e => e.name)
    const entityUnion = entityNames.length > 0 ? entityNames.map(e => `"${e}"`).join(' | ') : 'string'
    const modelMapping = serviceModelFiles[svcName]
      ? `{ ${entities.map(e => `"${e.name}": ${svcName}Models.${e.type}`).join(', ')} }`
      : 'Record<string, any>'
    indexDtsLines.push(`    ${svcName}: ODataService<${entityUnion}, ${modelMapping}>`)
  }
  indexDtsLines.push('  }')
  indexDtsLines.push('}')

  return indexDtsLines.join('\n')
}

/**
 * Sets up the 'prepare:types' hook for automated type generation and augmentation of the service registry.
 */
export function setupTypeGeneration(nuxt: Nuxt, config: ODataProxyConfig): void {
  nuxt.hook('prepare:types', async ({ references }) => {
    if (!config.services?.length)
      return

    const tempDir = join(nuxt.options.buildDir, 'odx', 'temp')
    const outRoot = join(nuxt.options.buildDir, 'odx-types')

    if (!fs.existsSync(tempDir))
      fs.mkdirSync(tempDir, { recursive: true })
    if (!fs.existsSync(outRoot))
      fs.mkdirSync(outRoot, { recursive: true })

    const serviceEntities: Record<string, EntityMapping[]> = {}
    const serviceModelFiles: Record<string, string> = {}

    for (const svc of config.services) {
      if (!svc.url)
        continue

      let inputPath = svc.url

      // Handle remote metadata (HTTPS)
      if (svc.url.startsWith('http')) {
        const tempFile = join(tempDir, `${svc.name}.edmx`)

        try {
          const xml = await downloadMetadata(svc, config)
          fs.writeFileSync(tempFile, xml)
          inputPath = tempFile
        }
        catch (err: any) {
          if (fs.existsSync(tempFile)) {
            logger.warn(`[@bc8-odx/nuxt] Could not download metadata for ${svc.name}, using cache: ${err.message}`)
            inputPath = tempFile
          }
          else {
            logger.error(`[@bc8-odx/nuxt] Could not download metadata for ${svc.name}:`, err.message)
            continue
          }
        }
      }
      else {
        inputPath = resolve(nuxt.options.rootDir, svc.url)
      }

      // Extract entities for the virtual registry
      serviceEntities[svc.name] = extractEntitiesFromEdmx(inputPath)

      // Run generation
      const outDir = join(outRoot, svc.name)
      if (!fs.existsSync(outDir) || fs.readdirSync(outDir).length === 0) {
        await generateODataTypes(inputPath, outDir, svc.name)
      }

      if (fs.existsSync(outDir)) {
        const modelFile = fs.readdirSync(outDir).find(f => f.endsWith('Model.ts'))
        if (modelFile)
          serviceModelFiles[svc.name] = modelFile.replace('.ts', '')
      }
    }

    const indexDtsPath = join(outRoot, 'index.d.ts')
    const indexDtsContent = generateRegistryDts(serviceEntities, serviceModelFiles)

    fs.writeFileSync(indexDtsPath, indexDtsContent)
    references.push({ path: indexDtsPath })
  })
}
