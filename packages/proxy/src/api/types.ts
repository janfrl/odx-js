import type { ODataProxyConfig } from '@bc8-odx/core'
import fs from 'node:fs'
import { createError, defineEventHandler, getQuery } from 'h3'
import { join, resolve } from 'pathe'

export default defineEventHandler((event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

  if (!serviceName) {
    throw createError({ statusCode: 400, message: 'Missing service name' })
  }

  const svc = config.services?.find(service => service.name === serviceName)
  if (!svc) {
    throw createError({ statusCode: 404, message: `Service ${serviceName} not found` })
  }

  const outRoot = resolve(config.buildDir ?? '', 'odx-types')
  const serviceDir = resolve(outRoot, svc.name)
  const serviceDirPrefix = `${outRoot}/`

  if (!serviceDir.startsWith(serviceDirPrefix) || !fs.existsSync(serviceDir)) {
    throw createError({
      statusCode: 404,
      message: `Generated types for ${serviceName} not found. Run Nuxt prepare first.`,
    })
  }

  const files = fs.readdirSync(serviceDir)
    .filter(file => file.endsWith('.ts'))
    .sort()
    .map(file => ({
      name: file,
      content: fs.readFileSync(join(serviceDir, file), 'utf-8'),
    }))

  return {
    service: svc.name,
    files,
  }
})
