import type { ODataProxyConfig } from '@bc8-odx/core'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import https from 'node:https'
import { createError, defineEventHandler, getQuery } from 'h3'
import { join, resolve } from 'pathe'

export default defineEventHandler(async (event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

  if (!serviceName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing service name' })
  }

  const services = config.services ?? []
  const matched = services.find(s => s.name === serviceName)

  if (!matched) {
    throw createError({ statusCode: 404, statusMessage: `Service ${serviceName} not found` })
  }

  const buildDir = config.buildDir ?? ''
  const rootDir = config.rootDir ?? ''
  const outRoot = join(buildDir, 'odx', 'generated')
  const outDir = join(outRoot, matched.name)

  let inputPath = matched.url

  let stale = false
  let staleReason: string | null = null

  try {
    if (matched.url.startsWith('http')) {
      const metadataUrl = matched.url.endsWith('/') ? `${matched.url}$metadata` : `${matched.url}/$metadata`
      const tempDir = join(buildDir, 'odx', 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      const tempFile = join(tempDir, `${matched.name}.edmx`)

      const headers: Record<string, string> = {
        Accept: 'application/xml, text/xml, */*',
        ...matched.headers,
      }

      const auth = matched.auth || config.auth || {}
      if (auth.bearerToken) {
        headers.Authorization = `Bearer ${auth.bearerToken}`
      }
      else if (auth.username && auth.password) {
        headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
      }

      console.warn(`[ODX] Downloading metadata for ${matched.name} from ${metadataUrl}...`)

      try {
        // Use native https module as it's proven to work with rejectUnauthorized in this environment
        const xml = await new Promise<string>((resolve, reject) => {
          const req = https.get(metadataUrl, {
            headers,
            rejectUnauthorized: config.rejectUnauthorized !== false,
          }, (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              return reject(new Error(`Status: ${res.statusCode} ${res.statusMessage}`))
            }
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => resolve(data))
          })
          req.on('error', reject)
          req.setTimeout(15000, () => {
            req.destroy()
            reject(new Error('Request timed out'))
          })
        })

        if (!xml || xml.length < 100 || !xml.includes('Edmx')) {
          throw new Error(`Received invalid or empty metadata from ${metadataUrl}`)
        }

        fs.writeFileSync(tempFile, xml)
        // Mirror to persistent cache so it survives .nuxt cleanups
        const persistentCacheDir = join(rootDir, '.odx', 'cache')
        if (!fs.existsSync(persistentCacheDir))
          fs.mkdirSync(persistentCacheDir, { recursive: true })
        fs.writeFileSync(join(persistentCacheDir, `${matched.name}.edmx`), xml)
        inputPath = tempFile
        console.warn(`[ODX]   - Successfully downloaded to ${tempFile} (${xml.length} bytes)`)
      }
      catch (downloadErr: any) {
        const persistentCacheFile = join(rootDir, '.odx', 'cache', `${matched.name}.edmx`)
        const fallback = fs.existsSync(tempFile)
          ? tempFile
          : fs.existsSync(persistentCacheFile)
            ? persistentCacheFile
            : null

        if (fallback) {
          // Restore persistent cache into .nuxt if needed
          if (fallback === persistentCacheFile) {
            if (!fs.existsSync(tempDir))
              fs.mkdirSync(tempDir, { recursive: true })
            fs.copyFileSync(persistentCacheFile, tempFile)
          }
          stale = true
          staleReason = downloadErr.message || String(downloadErr)
          inputPath = tempFile
          console.warn(`[ODX] Could not refresh metadata for ${matched.name}, using cached EDMX: ${staleReason}`)
        }
        else {
          throw downloadErr
        }
      }
    }
    else {
      inputPath = resolve(rootDir, matched.url)
    }

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input EDMX file not found at ${inputPath}`)
    }

    const generate = event.context.odataGenerator
    if (typeof generate !== 'function') {
      throw createError({ statusCode: 501, statusMessage: 'SDK Generation not supported by host' })
    }

    await generate(inputPath, outDir, matched.name)

    return {
      success: true,
      stale,
      staleReason,
      message: stale
        ? `Generated ${matched.name} from cached metadata (SAP unreachable: ${staleReason})`
        : `Generated ${matched.name} successfully`,
      service: matched.name,
      timestamp: Date.now(),
    }
  }
  catch (err: unknown) {
    const error = err as any
    const message = error.message || String(error)
    console.error(`[ODX] Generation failed for ${serviceName}:`, message)

    throw createError({
      statusCode: 500,
      statusMessage: `Generation failed: ${message}`,
      data: { error: message },
    })
  }
})
