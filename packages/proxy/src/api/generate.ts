import type { ODataProxyConfig } from '@bc8-odx/core'
import fs from 'node:fs'
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
  const outRoot = join(buildDir, 'sap-odata', 'generated')
  const outDir = join(outRoot, matched.name)

  let inputPath = matched.url

  try {
    if (matched.url.startsWith('http')) {
      const metadataUrl = matched.url.endsWith('/') ? `${matched.url}$metadata` : `${matched.url}/$metadata`
      const tempDir = join(buildDir, 'sap-odata', 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      const tempFile = join(tempDir, `${matched.name}.edmx`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(metadataUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata from ${metadataUrl}: ${response.statusText}`)
      }

      const xml = await response.text()
      if (!xml || xml.length < 100) {
        throw new Error(`Received invalid or empty metadata from ${metadataUrl}`)
      }

      fs.writeFileSync(tempFile, xml)
      inputPath = tempFile
    }
    else {
      inputPath = resolve(rootDir, matched.url)
    }

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input EDMX file not found at ${inputPath}`)
    }

    // Logic for triggering generation should be injected or passed via context
    // For now, we assume the host provides the generator if it wants to support this endpoint
    const generate = event.context.odataGenerator
    if (typeof generate !== 'function') {
      throw createError({ statusCode: 501, statusMessage: 'SDK Generation not supported by host' })
    }

    await generate(inputPath, outDir, matched.name)

    return {
      success: true,
      message: `Generated ${matched.name} successfully`,
      service: matched.name,
      timestamp: Date.now(),
    }
  }
  catch (err: unknown) {
    const error = err as Error
    throw createError({
      statusCode: 500,
      statusMessage: `Generation failed: ${error.message}`,
      data: { error: error.message },
    })
  }
})
