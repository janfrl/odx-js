import type { ODataProxyConfig, ODataServiceConfig } from '@bc8-odx/core'
import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import process from 'node:process'
import { getHeaders, getRequestURL } from 'h3'
import { dirname, join, resolve } from 'pathe'
import { prepareProxyHeaders } from './headers'
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

const METADATA_ACCEPT_HEADER = 'application/xml, text/xml, */*'
const REQUEST_TIMEOUT_MS = 15_000
const RE_TRAILING_SLASHES = /\/+$/

function getCachePaths(config: ODataProxyConfig, serviceName: string): { tempFile: string, persistentCacheFile: string } {
  const buildDir = config.buildDir ?? ''
  const rootDir = config.rootDir ?? ''

  return {
    tempFile: join(buildDir, 'odx', 'temp', `${serviceName}.edmx`),
    persistentCacheFile: join(rootDir, '.odx', 'cache', `${serviceName}.edmx`),
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

function restorePersistentCache(tempFile: string, persistentCacheFile: string): void {
  ensureParentDir(tempFile)
  fs.copyFileSync(persistentCacheFile, tempFile)
}

function metadataDigest(xml: string): { hash: string, bytes: number } {
  return {
    hash: createHash('sha256').update(xml).digest('hex'),
    bytes: Buffer.byteLength(xml),
  }
}

function assertValidMetadata(xml: string, metadataUrl: string): void {
  if (!xml.trim() || !xml.includes('Edmx')) {
    throw new Error(`Received invalid or empty metadata from ${metadataUrl}`)
  }
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
  const normalized = baseUrl.replace(RE_TRAILING_SLASHES, '')
  return `${normalized}${serviceName ? `/${serviceName}` : ''}/$metadata`
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

async function fetchMetadata(url: string, headers: Record<string, string>, rejectUnauthorized: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const options = parsed.protocol === 'https:'
      ? { headers, rejectUnauthorized }
      : { headers }

    const request = client.get(url, options, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim()))
        res.resume()
        return
      }

      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })

    request.on('error', reject)
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy()
      reject(new Error('Request timed out'))
    })
  })
}

function shouldFetchRemoteMetadata(service: ODataServiceConfig): boolean {
  return service.url?.startsWith('http') || !!service.destination || (!!process.env.VCAP_SERVICES && service.strategy !== 'direct')
}

async function resolveMetadataRequest(event: H3Event, config: ODataProxyConfig, service: ODataServiceConfig): Promise<{ url: string, headers: Record<string, string> }> {
  const route = service.route || service.name
  const target = await resolveProxyTarget(event, config, route)
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
  const headers = prepareProxyHeaders(getHeaders(event), configuredHeaders, authHeader)
  headers.accept = METADATA_ACCEPT_HEADER

  return { url: metadataUrl, headers }
}

export async function refreshRuntimeMetadata(event: H3Event, config: ODataProxyConfig, service: ODataServiceConfig): Promise<RuntimeMetadataRefreshResult> {
  if (!shouldFetchRemoteMetadata(service)) {
    const inputPath = resolve(config.rootDir ?? '', service.url)
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input EDMX file not found at ${inputPath}`)
    }

    const xml = fs.readFileSync(inputPath, 'utf-8')
    return createMetadataResult(service, inputPath, xml, 'local', false, null)
  }

  const { tempFile, persistentCacheFile } = getCachePaths(config, service.name)

  try {
    const request = await resolveMetadataRequest(event, config, service)
    const xml = await fetchMetadata(request.url, request.headers, config.rejectUnauthorized !== false)
    assertValidMetadata(xml, request.url)
    writeMetadataCache(tempFile, persistentCacheFile, xml)
    return createMetadataResult(service, tempFile, xml, 'remote', false, null)
  }
  catch (err: any) {
    const fallback = fs.existsSync(tempFile)
      ? tempFile
      : fs.existsSync(persistentCacheFile)
        ? persistentCacheFile
        : null

    if (!fallback) {
      throw err
    }

    if (fallback === persistentCacheFile) {
      restorePersistentCache(tempFile, persistentCacheFile)
    }

    const xml = fs.readFileSync(tempFile, 'utf-8')
    return createMetadataResult(service, tempFile, xml, 'cache', true, err.message || String(err))
  }
}
