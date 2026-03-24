import type { XsuaaPayload } from '@bc8-odx/core'
import process from 'node:process'
import { parseXsuaaPolicies } from '@bc8-odx/core'
import { defineNitroPlugin } from 'nitropack/runtime'
import { resolveBtpDestination } from '../utils/btp-destination.ts'

/**
 * Nitro plugin to handle SAP BTP authentication and destination resolution.
 * Supports synthetic authentication for local development via config/env.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', async ({ event, serviceName, fetchOptions }) => {
    const authHeader = event.headers.get('authorization')
    const config = event.context.odataConfig
    const addTrace = event.context.proxyTrace

    // 1. Resolve User Identity (Real JWT or Synthetic from Context)
    let userPayload: XsuaaPayload | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      addTrace?.('Auth', 'Extracting User Identity from Bearer Token')
      try {
        const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
        if (payloadPart) {
          userPayload = JSON.parse(atob(payloadPart))
          addTrace?.('Auth', `Identity resolved for user: ${userPayload?.email || 'Unknown'}`)
        }
      }
      catch {
        addTrace?.('Auth', 'Failed to decode Bearer Token', { header: authHeader })
      }
    }

    // Fallback to user context already set in event (e.g. by /api/me synthetic user)
    if (userPayload) {
      event.context.userContext = parseXsuaaPolicies(userPayload)
    }

    // 2. Resolve Technical User credentials via BTP Destination
    const matched = config?.services?.find(s => s.name === serviceName)
    const btpTargetName = matched?.destination
    const isRealCloud = !!process.env.VCAP_SERVICES

    if (btpTargetName || isRealCloud) {
      const target = btpTargetName || serviceName
      addTrace?.('BTP', `Resolving BTP Destination: "${target}"`)
      try {
        const destination = await resolveBtpDestination(target)
        addTrace?.('BTP', `Destination resolved to: ${destination.url}`, { destination: destination.name })

        if (process.env.NODE_ENV === 'production') {
          console.warn(`[@bc8-odx/proxy] BTP Swap: Swapping user credentials for Destination "${destination.name}"`)
        }

        fetchOptions.baseURL = destination.url

        if (destination.user && destination.password) {
          addTrace?.('BTP', 'Injecting technical user credentials (Basic Auth)')
          const credentials = btoa(`${destination.user}:${destination.password}`)
          fetchOptions.headers = {
            ...fetchOptions.headers,
            Authorization: `Basic ${credentials}`,
          }
        }
      }
      catch (err) {
        addTrace?.('BTP', 'Destination resolution failed', { error: (err as Error).message })
        if (btpTargetName || isRealCloud) {
          console.error(`[@bc8-odx/proxy] Destination Error for ${serviceName}:`, err)
        }
      }
    }
  })
})
