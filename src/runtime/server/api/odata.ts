import { defineEventHandler, getQuery, useRuntimeConfig } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string

  const url = event.node.req.url || ''
  const [path] = url.split('?')
  const serviceParam = path.startsWith(basePath + '/')
    ? path.slice((basePath + '/').length).split('/')[0]
    : ''

  const services = (config.odata?.services || []) as Array<{ name: string; route?: string }>
  const matched = services.find(
    (svc) => (svc.route || svc.name.toLowerCase()) === serviceParam
  )

  const query = getQuery(event)

  if (!matched) {
    return {
      error: `Unknown service "${serviceParam}"`,
      knownServices: services.map((s) => s.name),
    }
  }

  const generatedDir = join(
    buildDir,
    'sap-odata',
    'generated',
    matched.name,
    serviceParam
  )
  const indexFile = join(generatedDir, 'index.js')

  if (!fs.existsSync(indexFile)) {
    return {
      service: matched.name,
      query,
      warning: 'Generated module not found at runtime',
      tried: indexFile,
    }
  }

  const mod = await import(pathToFileURL(indexFile).href)

  return {
    service: matched.name,
    query,
    exports: Object.keys(mod),
  }
})
