import { createError, defineEventHandler, getQuery, useRuntimeConfig } from '#imports'
import { join, resolve } from 'pathe'
import fs from 'node:fs'
import { generateODataClient } from '../../../generate'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const serviceName = query.service as string

  if (!serviceName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing service name' })
  }

  const services = (config.odata?.services || []) as Array<{ name: string, url: string }>
  const matched = services.find(s => s.name === serviceName)

  if (!matched) {
    throw createError({ statusCode: 404, statusMessage: `Service ${serviceName} not found` })
  }

  const buildDir = config.odata?.buildDir as string
  const rootDir = config.odata?.rootDir as string
  const outRoot = join(buildDir, 'sap-odata', 'generated')
  const outDir = join(outRoot, matched.name)

  let inputPath = matched.url

  try {
    // If URL is remote, we need to download the metadata first (Sync with module.ts)
    if (matched.url.startsWith('http')) {
      const metadataUrl = matched.url.endsWith('/') ? `${matched.url}$metadata` : `${matched.url}/$metadata`
      const tempDir = join(buildDir, 'sap-odata', 'temp')
      if (!fs.existsSync(tempDir))
        fs.mkdirSync(tempDir, { recursive: true })

      const tempFile = join(tempDir, `${matched.name}.edmx`)
      // eslint-disable-next-line no-console
      console.log(`[nuxt-sap-odata] Manual regen: downloading metadata for ${matched.name} from ${metadataUrl}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

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
      // Local path
      inputPath = resolve(rootDir, matched.url)
    }

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input EDMX file not found at ${inputPath}`)
    }

    // eslint-disable-next-line no-console
    console.log(`[nuxt-sap-odata] Manual generation triggered for ${matched.name}. Input: ${inputPath}, Output: ${outDir}`)
    
    await generateODataClient({
      input: inputPath,
      outputDir: outDir,
    })

    return { 
      success: true, 
      message: `Generated ${matched.name} successfully`,
      service: matched.name,
      timestamp: Date.now()
    }
  }
  catch (err: any) {
    console.error(`[nuxt-sap-odata] Manual generation failed for ${matched.name}:`, err.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Generation failed: ${err.message}`,
      data: { error: err.message }
    })
  }
})
