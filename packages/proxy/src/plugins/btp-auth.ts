import type { XsuaaPayload } from '@bc8-odx/core'
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

    // 1. Resolve User Identity (Real JWT or Synthetic from Config)
    let userPayload: XsuaaPayload | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
        if (payloadPart) {
          const json = atob(payloadPart)
          userPayload = JSON.parse(json)
        }
      }
      catch (e) {
        console.error('[@bc8-odx/proxy] Failed to decode real JWT:', e)
      }
    }
    else if (config?.auth?.username || config?.services?.find(s => s.name === serviceName)?.auth?.username) {
      // Create a synthetic payload for local testing if credentials exist in .env
      const matched = config.services?.find(s => s.name === serviceName)
      const username = matched?.auth?.username || config.auth?.username || 'DEVELOPER'
      const mockCompanies = matched?.auth?.mockUserCompanies || config.auth?.mockUserCompanies || [
        { company: '1000', source: 'ERP' },
        { company: 'DE01', source: 'CRM' },
      ]

      userPayload = {
        userId: username,
        userCompanies: mockCompanies,
      }
      console.warn(`[@bc8-odx/proxy] Synthetic Auth: Acting as user "${username}"`)
    }

    if (userPayload) {
      event.context.userContext = parseXsuaaPolicies(userPayload)
    }

    // 2. Resolve Technical User credentials via BTP Destination
    try {
      const matched = config?.services?.find(s => s.name === serviceName)
      const btpTargetName = matched?.destination || serviceName

      const destination = await resolveBtpDestination(btpTargetName)
      console.warn(`[@bc8-odx/proxy] BTP Swap: Swapping user credentials for Destination "${destination.name}"`)

      // 3. Mutate Request: Update target URL
      fetchOptions.baseURL = destination.url

      // 4. Mutate Request: Set Technical Authorization (Drops original user token)
      if (destination.user && destination.password) {
        const credentials = btoa(`${destination.user}:${destination.password}`)
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Basic ${credentials}`,
        }
      }
    }
    catch (err) {
      console.error(`[@bc8-odx/proxy] Destination Error for ${serviceName}:`, err)
    }
  })
})
