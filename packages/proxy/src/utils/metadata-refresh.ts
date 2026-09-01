import type { ODataProxyConfig, ODataServiceConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import process from 'node:process'
import { StringDecoder } from 'node:string_decoder'
import { parseCsdl } from '@me-tools/odx-metadata'
import { getHeaders, getRequestURL } from 'h3'
import { dirname, join, resolve } from 'pathe'
import { looksLikeHttpBackendUrl } from './backend-url'
import { resolveConnectivityRequest } from './connectivity-proxy'
import { prepareProxyHeaders } from './headers'
import { normalizeODataServiceRoute } from './service-route'
import { resolveProxyTarget } from './target'

export interface RuntimeMetadataRefreshResult {
  service: string
  inputPath: string
  stale: boolean
  staleReason: string | null
  source: 'remote' | 'cache' | 'local'
  timestamp: number
  refreshedAt: string
  hash: string
  bytes: number
}

export interface RuntimeMetadataSnapshot {
  service: string
  inputPath: string | null
  exists: boolean
  stale: boolean
  staleReason: string | null
  source: RuntimeMetadataRefreshResult['source'] | null
  timestamp: number | null
  refreshedAt: string | null
  hash: string | null
  bytes: number | null
  xml: string | null
  missingReason: string | null
}

const METADATA_ACCEPT_HEADER = 'application/xml, text/xml, */*'
const EDMX_NAMESPACES = new Set([
  'http://docs.oasis-open.org/odata/ns/edmx',
  'http://schemas.microsoft.com/ado/2007/06/edmx',
])
const REQUEST_TIMEOUT_MS = 15_000
const RE_TRAILING_SLASHES = /\/+$/
const RE_HTTP_URL = /https?:\/\/[^\s)"']+/gi
const RE_WINDOWS_PATH = /\b[A-Z]:[\\/][^\s)"']+/gi
const RE_UNC_PATH = /\\\\[^\s)"']+/g
const RE_ABSOLUTE_PATH = /(^|\s)\/[^\s)"']+/g
const RE_URL_HOST = /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?\b/gi
const RE_INVALID_METADATA_REASON = /^Received invalid or empty metadata/
const RE_WHITESPACE = /\s+/g
const runtimeMetadataRefreshes = new Map<string, Promise<RuntimeMetadataRefreshResult>>()

export function getRuntimeMetadataCachePaths(config: ODataProxyConfig, serviceName: string): { tempFile: string, persistentCacheFile: string, stateFile: string } {
  const buildDir = config.buildDir ?? ''
  const rootDir = config.rootDir ?? ''

  return {
    tempFile: join(buildDir, 'odx', 'temp', `${serviceName}.edmx`),
    persistentCacheFile: join(rootDir, '.odx', 'cache', `${serviceName}.edmx`),
    stateFile: join(rootDir, '.odx', 'cache', `${serviceName}.metadata.json`),
  }
}

function ensureParentDir(filePath: string): void {
  const parent = dirname(filePath)
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true })
  }
}

function writeMetadataCache(tempFile: string, persistentCacheFile: string, xml: string): void {
  ensureParentDir(tempFile)
  fs.writeFileSync(tempFile, xml)
  ensureParentDir(persistentCacheFile)
  fs.writeFileSync(persistentCacheFile, xml)
}

function writeMetadataState(stateFile: string, result: RuntimeMetadataRefreshResult): void {
  ensureParentDir(stateFile)
  fs.writeFileSync(stateFile, `${JSON.stringify({
    service: result.service,
    inputPath: result.inputPath,
    stale: result.stale,
    staleReason: result.staleReason,
    source: result.source,
    timestamp: result.timestamp,
    refreshedAt: result.refreshedAt,
    hash: result.hash,
    bytes: result.bytes,
  }, null, 2)}\n`)
}

function readMetadataState(stateFile: string): Partial<Omit<RuntimeMetadataRefreshResult, 'inputPath'>> | null {
  if (!fs.existsSync(stateFile))
    return null

  try {
    const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
    return {
      service: String(data.service || ''),
      stale: data.stale === true,
      staleReason: typeof data.staleReason === 'string' ? data.staleReason : null,
      source: data.source === 'remote' || data.source === 'cache' || data.source === 'local' ? data.source : 'cache',
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : null,
      refreshedAt: typeof data.refreshedAt === 'string' ? data.refreshedAt : null,
      hash: typeof data.hash === 'string' ? data.hash : '',
      bytes: typeof data.bytes === 'number' ? data.bytes : 0,
    }
  }
  catch {
    return null
  }
}

function metadataDigest(xml: string): { hash: string, bytes: number } {
  return {
    hash: createHash('sha256').update(xml).digest('hex'),
    bytes: Buffer.byteLength(xml),
  }
}

function assertValidMetadata(xml: string, metadataUrl: string): void {
  const root = parseCsdl(xml, { format: 'xml' }).document?.root
  if (root?.kind !== 'element' || root.name.local !== 'Edmx' || !EDMX_NAMESPACES.has(root.name.namespace ?? '')) {
    throw new Error(`Received invalid or empty metadata from ${metadataUrl}`)
  }
}

function readValidMetadataCache(paths: string[]): { path: string, xml: string } | null {
  let failure: unknown
  for (const path of paths) {
    if (!fs.existsSync(path))
      continue
    try {
      const xml = fs.readFileSync(path, 'utf-8')
      assertValidMetadata(xml, path)
      return { path, xml }
    }
    catch (error) {
      failure = error
    }
  }
  if (failure)
    throw failure
  return null
}

export function sanitizeMetadataFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.trim().replace(RE_WHITESPACE, ' ')

  if (!normalized) {
    return 'Metadata refresh failed'
  }

  if (RE_INVALID_METADATA_REASON.test(normalized)) {
    return 'Received invalid or empty metadata'
  }

  return normalized
    .replace(RE_HTTP_URL, '[metadata-url]')
    .replace(RE_WINDOWS_PATH, '[metadata-path]')
    .replace(RE_UNC_PATH, '[metadata-path]')
    .replace(RE_ABSOLUTE_PATH, '$1[metadata-path]')
    .replace(RE_URL_HOST, '[metadata-host]')
}

function createMetadataResult(
  service: ODataServiceConfig,
  inputPath: string,
  xml: string,
  source: RuntimeMetadataRefreshResult['source'],
  stale: boolean,
  staleReason: string | null,
): RuntimeMetadataRefreshResult {
  const timestamp = Date.now()
  const { hash, bytes } = metadataDigest(xml)

  return {
    service: service.name,
    inputPath,
    stale,
    staleReason,
    source,
    timestamp,
    refreshedAt: new Date(timestamp).toISOString(),
    hash,
    bytes,
  }
}

function resolveRelativeUrl(event: H3Event, value: string): string {
  if (!value.startsWith('/')) {
    return value
  }

  const requestUrl = getRequestURL(event)
  return `${requestUrl.protocol}//${requestUrl.host}${value}`
}

function appendMetadataPath(baseUrl: string, serviceName?: string): string {
  const url = new URL(baseUrl)
  const normalizedPath = url.pathname.replace(RE_TRAILING_SLASHES, '')
  const normalizedServiceName = serviceName === undefined
    ? undefined
    : normalizeODataServiceRoute(serviceName)
  url.pathname = `${normalizedPath}${normalizedServiceName ? `/${normalizedServiceName}` : ''}/$metadata`
  url.hash = ''
  return url.toString()
}

function resolveConfiguredAuthHeader(service: ODataServiceConfig, config: ODataProxyConfig): string | undefined {
  const auth = service.auth || config.auth || {}
  if (auth.bearerToken) {
    return `Bearer ${auth.bearerToken}`
  }
  if (auth.username && auth.password) {
    return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
  }
}

async function fetchMetadata(
  url: string,
  headers: Record<string, string>,
  rejectUnauthorized: boolean,
  connectivityRequest: Awaited<ReturnType<typeof resolveConnectivityRequest>>,
): Promise<string> {
  if (connectivityRequest.fetch) {
    const response = await connectivityRequest.fetch(url, {
      dispatcher: connectivityRequest.dispatcher,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    } as RequestInit)
    if (!response.ok)
      throw new Error(`Status: ${response.status} ${response.statusText}`.trim())
    return response.text()
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const options = parsed.protocol === 'https:'
      ? { headers, rejectUnauthorized }
      : { headers }

    const request = client.get(url, options, (res) => {
      res.on('error', reject)
      res.once('aborted', () => reject(new Error('Metadata response ended before completion')))
      res.once('close', () => {
        if (!res.complete)
          reject(new Error('Metadata response ended before completion'))
      })
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim()))
        res.resume()
        return
      }

      const decoder = new StringDecoder('utf8')
      let data = ''
      res.on('data', chunk => data += decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      res.on('end', () => resolve(data + decoder.end()))
    })

    request.on('error', reject)
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy()
      reject(new Error('Request timed out'))
    })
  })
}

function shouldFetchRemoteMetadata(service: ODataServiceConfig): boolean {
  return (typeof service.url === 'string' && looksLikeHttpBackendUrl(service.url))
    || !!service.destination
    || (!!process.env.VCAP_SERVICES && service.strategy !== 'direct')
}

export function shouldUseRemoteRuntimeMetadata(service: ODataServiceConfig): boolean {
  return shouldFetchRemoteMetadata(service)
}

function resolveLocalMetadataInputPath(config: ODataProxyConfig, service: ODataServiceConfig): string {
  if (!service.url) {
    throw new Error(
      `Local OData service "${service.name}" requires a metadata file URL.`,
    )
  }
  return resolve(config.rootDir ?? '', service.url)
}

export function readRuntimeMetadataSnapshot(config: ODataProxyConfig, service: ODataServiceConfig, options: { sanitizeFailureReasons?: boolean } = {}): RuntimeMetadataSnapshot {
  const sanitizeReason = (reason: string | null): string | null => {
    if (!reason || !options.sanitizeFailureReasons) {
      return reason
    }

    return sanitizeMetadataFailureReason(reason)
  }

  if (!shouldFetchRemoteMetadata(service)) {
    const inputPath = resolveLocalMetadataInputPath(config, service)
    if (!fs.existsSync(inputPath)) {
      return {
        service: service.name,
        inputPath,
        exists: false,
        stale: false,
        staleReason: null,
        source: 'local',
        timestamp: null,
        refreshedAt: null,
        hash: null,
        bytes: null,
        xml: null,
        missingReason: sanitizeReason(`Input EDMX file not found at ${inputPath}`),
      }
    }

    const xml = fs.readFileSync(inputPath, 'utf-8')
    const { hash, bytes } = metadataDigest(xml)
    const stats = fs.statSync(inputPath)
    return {
      service: service.name,
      inputPath,
      exists: true,
      stale: false,
      staleReason: null,
      source: 'local',
      timestamp: stats.mtimeMs,
      refreshedAt: stats.mtime.toISOString(),
      hash,
      bytes,
      xml,
      missingReason: null,
    }
  }

  const { persistentCacheFile, stateFile, tempFile } = getRuntimeMetadataCachePaths(config, service.name)
  const inputPath = fs.existsSync(persistentCacheFile)
    ? persistentCacheFile
    : fs.existsSync(tempFile)
      ? tempFile
      : null

  if (!inputPath) {
    return {
      service: service.name,
      inputPath: null,
      exists: false,
      stale: false,
      staleReason: null,
      source: null,
      timestamp: null,
      refreshedAt: null,
      hash: null,
      bytes: null,
      xml: null,
      missingReason: `Runtime metadata cache for ${service.name} not found. Refresh metadata first.`,
    }
  }

  const xml = fs.readFileSync(inputPath, 'utf-8')
  const digest = metadataDigest(xml)
  const stats = fs.statSync(inputPath)
  const state = readMetadataState(stateFile)
  const stale = state?.stale === true

  return {
    service: service.name,
    inputPath,
    exists: true,
    stale,
    staleReason: sanitizeReason(state?.staleReason ?? null),
    source: state?.source ?? 'cache',
    timestamp: state?.timestamp ?? stats.mtimeMs,
    refreshedAt: state?.refreshedAt ?? stats.mtime.toISOString(),
    hash: state?.hash || digest.hash,
    bytes: state?.bytes || digest.bytes,
    xml,
    missingReason: null,
  }
}

async function resolveMetadataRequest(event: H3Event, config: ODataProxyConfig, service: ODataServiceConfig): Promise<{
  url: string
  headers: Record<string, string>
  connectivityRequest: Awaited<ReturnType<typeof resolveConnectivityRequest>>
}> {
  const route = normalizeODataServiceRoute(service.route || service.name)
  const target = await resolveProxyTarget(event, config, route, { allowBtpDestinationFallback: false })
  if (!target) {
    throw new Error(`Could not resolve target for ${service.name}`)
  }

  const targetBaseUrl = resolveRelativeUrl(event, target.url)
  const metadataUrl = appendMetadataPath(targetBaseUrl, target.isRelative ? service.name : undefined)
  const configuredHeaders = {
    ...config.headers,
    ...service.headers,
    Accept: METADATA_ACCEPT_HEADER,
  }
  const authHeader = target.authHeader || (target.strategy === 'direct' ? undefined : resolveConfiguredAuthHeader(service, config))
  const headers = prepareProxyHeaders(
    getHeaders(event),
    configuredHeaders,
    authHeader,
    { forwardAuthorization: config.forwardAuthHeader !== false },
  )
  const connectivityRequest = await resolveConnectivityRequest(target.connectivity)
  Object.assign(headers, connectivityRequest.headers)
  headers.accept = METADATA_ACCEPT_HEADER

  return { url: metadataUrl, headers, connectivityRequest }
}

async function refreshRemoteRuntimeMetadata(event: H3Event, config: ODataProxyConfig, service: ODataServiceConfig): Promise<RuntimeMetadataRefreshResult> {
  const { tempFile, persistentCacheFile, stateFile } = getRuntimeMetadataCachePaths(config, service.name)

  try {
    const request = await resolveMetadataRequest(event, config, service)
    const xml = await fetchMetadata(request.url, request.headers, config.rejectUnauthorized !== false, request.connectivityRequest)
    assertValidMetadata(xml, request.url)
    writeMetadataCache(tempFile, persistentCacheFile, xml)
    const result = createMetadataResult(service, tempFile, xml, 'remote', false, null)
    writeMetadataState(stateFile, result)
    return result
  }
  catch (err: any) {
    const fallback = readValidMetadataCache([tempFile, persistentCacheFile])

    if (!fallback) {
      throw err
    }

    if (fallback.path === persistentCacheFile) {
      ensureParentDir(tempFile)
      fs.writeFileSync(tempFile, fallback.xml)
    }

    const result = createMetadataResult(service, tempFile, fallback.xml, 'cache', true, sanitizeMetadataFailureReason(err))
    writeMetadataState(stateFile, result)
    return result
  }
}

export async function refreshRuntimeMetadata(event: H3Event, config: ODataProxyConfig, service: ODataServiceConfig): Promise<RuntimeMetadataRefreshResult> {
  if (!shouldFetchRemoteMetadata(service)) {
    const inputPath = resolveLocalMetadataInputPath(config, service)
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input EDMX file not found at ${inputPath}`)
    }

    const xml = fs.readFileSync(inputPath, 'utf-8')
    return createMetadataResult(service, inputPath, xml, 'local', false, null)
  }

  const { stateFile } = getRuntimeMetadataCachePaths(config, service.name)
  const refreshKey = resolve(stateFile)
  const activeRefresh = runtimeMetadataRefreshes.get(refreshKey)
  if (activeRefresh) {
    return activeRefresh
  }

  const refresh = refreshRemoteRuntimeMetadata(event, config, service)
  runtimeMetadataRefreshes.set(refreshKey, refresh)
  try {
    return await refresh
  }
  finally {
    if (runtimeMetadataRefreshes.get(refreshKey) === refresh) {
      runtimeMetadataRefreshes.delete(refreshKey)
    }
  }
}
