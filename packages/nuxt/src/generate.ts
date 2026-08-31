import type { EntityMapping, ODataProxyConfig, ODataServiceConfig } from '@me-tools/odx-core'
import type { Nuxt } from '@nuxt/schema'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { createRequire } from 'node:module'
import process from 'node:process'
import { StringDecoder } from 'node:string_decoder'
import { extractEntitiesFromCsdlDocument } from '@me-tools/odx-core/server'
import { parseCsdl } from '@me-tools/odx-metadata'
import { consola } from 'consola'
import { dirname, join, resolve } from 'pathe'

const logger = consola.withTag('@me-tools/odx-nuxt')
const METADATA_DOWNLOAD_TIMEOUT_MS = 30_000
const RE_IDENTIFIER_CHARS = /\W/g
const RE_IDENTIFIER_START = /^[a-z_]/i
const RE_PATH_SEPARATOR = /[/\\]/
const RE_UNSAFE_MODEL_FILE = /[/\\:]/
const SDK_CACHE_VERSION = 1

function resolveOData2TsCliPath(): string {
  const projectRequire = createRequire(resolve(process.cwd(), 'package.json'))
  return projectRequire.resolve('@odata2ts/odata2ts/lib/run-cli.js')
}

/**
 * Core function to generate TypeScript types from an EDMX metadata file using odata2ts.
 */
export async function generateODataTypes(xmlFilePath: string, outputDir: string, serviceName: string): Promise<void> {
  const cliPath = resolveOData2TsCliPath()
  const args = [
    cliPath,
    '--source',
    xmlFilePath,
    '--output',
    outputDir,
    '--mode',
    'models',
    '--emit-mode',
    'ts',
    '--prettier',
  ]

  try {
    execFileSync(process.execPath, args, { stdio: 'pipe' })
    logger.success(`Generated SDK for ${serviceName}`)
  }
  catch (err: any) {
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message
    logger.error(`Failed to generate SDK for ${serviceName}: ${output}`)
    throw err
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function ensureGeneratedODataTypes(inputPath: string, outDir: string, tempDir: string, serviceName: string): Promise<string> {
  const generatorPackage = JSON.parse(fs.readFileSync(resolve(dirname(resolveOData2TsCliPath()), '../package.json'), 'utf8'))
  if (typeof generatorPackage.version !== 'string')
    throw new Error('Could not resolve the odata2ts generator version')
  const inputHash = sha256(JSON.stringify([SDK_CACHE_VERSION, generatorPackage.version, fs.readFileSync(inputPath, 'utf8')]))
  const cachePath = join(outDir, '.odx-generation.json')
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    if (cache?.version === SDK_CACHE_VERSION
      && cache.inputHash === inputHash
      && typeof cache.modelFile === 'string'
      && !RE_UNSAFE_MODEL_FILE.test(cache.modelFile)
      && cache.modelFile.endsWith('Model.ts')
      && cache.modelHash === sha256(fs.readFileSync(join(outDir, cache.modelFile), 'utf8'))) {
      return cache.modelFile
    }
  }
  catch {
    // A missing, invalid or incomplete cache is regenerated, never trusted.
  }

  const stagingDir = fs.mkdtempSync(join(tempDir, `${serviceName}-sdk-`))
  try {
    await generateODataTypes(inputPath, stagingDir, serviceName)
    const outputs = fs.readdirSync(stagingDir, { withFileTypes: true })
    const modelFile = outputs.find(file => file.isFile() && file.name.endsWith('Model.ts'))?.name
    if (!modelFile || outputs.some(file => !file.isFile()))
      throw new Error(`SDK generation for ${serviceName} did not produce a flat model output`)
    fs.mkdirSync(outDir, { recursive: true })
    for (const file of outputs)
      fs.copyFileSync(join(stagingDir, file.name), join(outDir, file.name))
    fs.writeFileSync(cachePath, JSON.stringify({
      version: SDK_CACHE_VERSION,
      inputHash,
      modelFile,
      modelHash: sha256(fs.readFileSync(join(outDir, modelFile), 'utf8')),
    }))
    return modelFile
  }
  finally {
    // Only this invocation's newly created staging directory is removed.
    fs.rmSync(stagingDir, { recursive: true, force: true })
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
    const isHttps = metadataUrl.startsWith('https://')
    const client = isHttps ? https : http
    const requestOptions = isHttps
      ? { headers, rejectUnauthorized: config.rejectUnauthorized }
      : { headers }

    const req = client.get(metadataUrl, requestOptions, (res) => {
      res.on('error', reject)
      res.once('aborted', () => reject(new Error('Metadata response ended before completion')))
      res.once('close', () => {
        if (!res.complete)
          reject(new Error('Metadata response ended before completion'))
      })
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        res.resume()
        return reject(new Error(`Status: ${res.statusCode}`))
      }
      const decoder = new StringDecoder('utf8')
      let data = ''
      res.on('data', chunk => data += decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      res.on('end', () => resolve(data + decoder.end()))
    }).on('error', reject)

    req.setTimeout(METADATA_DOWNLOAD_TIMEOUT_MS, () => {
      req.destroy(new Error(`Metadata request timed out after ${METADATA_DOWNLOAD_TIMEOUT_MS}ms`))
    })
  })
}

/**
 * Generates the virtual d.ts content for the OData service registry.
 */
export function generateRegistryDts(
  serviceEntities: Record<string, EntityMapping[]>,
  serviceModelFiles: Record<string, string>,
): string {
  const indexDtsLines = ['import type { ODataRuntimeService, ODataServiceRegistry } from "@me-tools/odx-core"']
  const serviceModelAliases: Record<string, string> = {}

  for (const [svcName, modelFile] of Object.entries(serviceModelFiles)) {
    const modelAlias = `${toTypeScriptIdentifier(svcName)}Models`
    serviceModelAliases[svcName] = modelAlias
    indexDtsLines.push(`import * as ${modelAlias} from "./${svcName}/${modelFile}"`)
  }

  indexDtsLines.push('\ndeclare module "@me-tools/odx-core" {')
  indexDtsLines.push('  interface ODataServiceRegistry {')
  for (const [svcName, entities] of Object.entries(serviceEntities)) {
    const entityNames = entities.map(e => e.name)
    const entityUnion = entityNames.length > 0 ? entityNames.map(e => `"${e}"`).join(' | ') : 'string'
    const modelMapping = serviceModelFiles[svcName]
      ? `{ ${entities.map(e => `"${e.name}": ${serviceModelAliases[svcName]}.${e.type}`).join(', ')} }`
      : 'Record<string, any>'
    indexDtsLines.push(`    ${formatTypeKey(svcName)}: ODataRuntimeService<${entityUnion}, ${modelMapping}>`)
  }
  indexDtsLines.push('  }')
  indexDtsLines.push('}')

  return indexDtsLines.join('\n')
}

function toTypeScriptIdentifier(value: string): string {
  const identifier = value.replace(RE_IDENTIFIER_CHARS, '_')
  return RE_IDENTIFIER_START.test(identifier) ? identifier : `_${identifier}`
}

function formatTypeKey(value: string): string {
  return toTypeScriptIdentifier(value) === value ? value : JSON.stringify(value)
}

function extractEntitiesFromMetadata(xml: string, sourcePath: string): EntityMapping[] {
  const result = parseCsdl(xml, {
    format: 'xml',
    source: { id: sourcePath },
  })
  if (result.document !== null)
    return extractEntitiesFromCsdlDocument(result.document)

  const reason = result.diagnostics
    .map(diagnostic => diagnostic.message)
    .join('; ')
  throw new Error(`Could not parse OData metadata at ${sourcePath}: ${reason || 'no CSDL document produced'}`)
}
function assertValidServiceNameForTypeGeneration(serviceName: string): void {
  if (RE_PATH_SEPARATOR.test(serviceName)) {
    throw new Error(
      `Invalid OData service name "${serviceName}": path separators are not allowed in service names used for Nuxt type generation.`,
    )
  }
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

    // odata2ts uses ts-morph which resolves the project tsconfig. During
    // prepare:types, Nuxt hasn't written .nuxt/tsconfig.json yet, so
    // tsconfig-loader fails following the extends chain. Ensure a stub exists.
    const nuxtTsconfig = join(nuxt.options.buildDir, 'tsconfig.json')
    if (!fs.existsSync(nuxtTsconfig))
      fs.writeFileSync(nuxtTsconfig, JSON.stringify({ compilerOptions: {} }))

    const serviceEntities: Record<string, EntityMapping[]> = {}
    const serviceModelFiles: Record<string, string> = {}

    for (const svc of config.services) {
      if (!svc.url)
        continue

      assertValidServiceNameForTypeGeneration(svc.name)

      let inputPath = svc.url
      let parsedEntities: EntityMapping[] | undefined

      // Handle remote metadata (HTTPS)
      if (svc.url.startsWith('http')) {
        const tempFile = join(tempDir, `${svc.name}.edmx`)
        // Persistent cache outside .nuxt — survives server restarts and .nuxt cleanups
        const persistentCacheDir = join(nuxt.options.rootDir, '.odx', 'cache')
        const persistentCacheFile = join(persistentCacheDir, `${svc.name}.edmx`)

        let downloadedXml: string | undefined
        try {
          downloadedXml = await downloadMetadata(svc, config)
        }
        catch (err: any) {
          const fallback = fs.existsSync(tempFile)
            ? tempFile
            : fs.existsSync(persistentCacheFile)
              ? persistentCacheFile
              : null

          if (fallback) {
            // Copy persistent cache back into .nuxt so the runtime schema endpoint finds it
            if (fallback === persistentCacheFile && !fs.existsSync(tempFile)) {
              if (!fs.existsSync(tempDir))
                fs.mkdirSync(tempDir, { recursive: true })
              fs.copyFileSync(persistentCacheFile, tempFile)
            }
            logger.warn(`[@me-tools/odx-nuxt] Could not download metadata for ${svc.name}, using cache: ${err.message}`)
            inputPath = tempFile
          }
          else {
            throw new Error(
              `Could not download metadata for ${svc.name} and no cached metadata is available.`,
              { cause: err },
            )
          }
        }

        if (downloadedXml !== undefined) {
          // Reject malformed responses before replacing the last usable cache.
          // Only transport failures may fall back; invalid metadata still fails preparation.
          parsedEntities = extractEntitiesFromMetadata(downloadedXml, tempFile)
          fs.writeFileSync(tempFile, downloadedXml)
          if (!fs.existsSync(persistentCacheDir))
            fs.mkdirSync(persistentCacheDir, { recursive: true })
          fs.writeFileSync(persistentCacheFile, downloadedXml)
          inputPath = tempFile
        }
      }
      else {
        inputPath = resolve(nuxt.options.rootDir, svc.url)
      }

      // Extract entities for the virtual registry
      serviceEntities[svc.name] = parsedEntities ?? extractEntitiesFromMetadata(
        fs.readFileSync(inputPath, 'utf8'),
        inputPath,
      )

      // Run generation
      const outDir = join(outRoot, svc.name)
      const modelFile = await ensureGeneratedODataTypes(inputPath, outDir, tempDir, svc.name)
      serviceModelFiles[svc.name] = modelFile.slice(0, -3)
    }

    const indexDtsPath = join(outRoot, 'index.d.ts')
    const indexDtsContent = generateRegistryDts(serviceEntities, serviceModelFiles)

    fs.writeFileSync(indexDtsPath, indexDtsContent)
    references.push({ path: indexDtsPath })
  })
}
