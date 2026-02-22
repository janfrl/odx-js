import { createError, defineEventHandler, getQuery, useRuntimeConfig } from '#imports'
import { join, resolve } from 'pathe'
import { generateODataClient } from '../../../generate'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const serviceName = query.service as string

  const services = (config.odata?.services || []) as Array<{ name: string, edmx: string }>
  const matched = services.find(s => s.name === serviceName)

  if (!matched) {
    throw createError({ statusCode: 404, statusMessage: `Service ${serviceName} not found` })
  }

  const buildDir = config.odata?.buildDir as string
  const rootDir = config.odata?.rootDir as string

  const edmxAbs = resolve(rootDir, matched.edmx)
  const outDir = join(buildDir, 'sap-odata', 'generated', matched.name)

  try {
    // eslint-disable-next-line no-console
    console.log(`[nuxt-sap-odata] Manual generation triggered for ${matched.name}`)
    await generateODataClient({
      input: edmxAbs,
      outputDir: outDir,
    })
    return { success: true, message: `Generated ${matched.name} successfully` }
  }
  catch (err: unknown) {
    const error = err as Error
    console.error(`[nuxt-sap-odata] Generation failed for ${matched.name}:`, error.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Generation failed: ${error.message}`,
    })
  }
})
