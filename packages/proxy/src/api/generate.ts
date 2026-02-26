import type { NitroRuntimeConfig } from './config'
import fs from 'node:fs'
import { generateODataClient } from '@bc8-odx/nuxt/generate'
import { createError, defineEventHandler, getQuery } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { join, resolve } from 'pathe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as unknown as NitroRuntimeConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

  if (!serviceName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing service name' })
  }

  const services = config.odata?.services ?? []
  const matched = services.find(s => s.name === serviceName)

  if (!matched) {
    throw createError({ statusCode: 404, statusMessage: `Service ${serviceName} not found` })
  }

  const buildDir = config.odata?.buildDir ?? ''
  const rootDir = config.odata?.rootDir ?? ''
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

    await generateODataClient({
      input: inputPath,
      outputDir: outDir,
    })

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
