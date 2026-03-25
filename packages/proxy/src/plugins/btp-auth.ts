import process from 'node:process'
import { defineNitroPlugin } from 'nitropack/runtime'
import { resolveBtpDestination } from '../utils/btp-destination'

/**
 * Nitro plugin to handle SAP BTP destination resolution and principal propagation.
 * Detects BTP environments and automatically manages user token exchange
 * and connectivity service headers for OnPremise targets.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', async ({ event, serviceName, fetchOptions }) => {
    const authHeader = event.headers.get('authorization')
    const config = event.context.odataConfig
    const addTrace = event.context.proxyTrace
    const isRealCloud = !!process.env.VCAP_SERVICES

    const matched = config?.services?.find(s => s.name === serviceName)
    const btpTargetName = matched?.destination

    if (btpTargetName || isRealCloud) {
      const target = btpTargetName || serviceName
      addTrace?.('BTP', `Resolving BTP Destination: "${target}"`)

      try {
        // Resolve destination, passing the user's JWT for principal propagation
        const destination = await resolveBtpDestination(target, authHeader || undefined)
        addTrace?.('BTP', `Destination resolved: ${destination.url} (${destination.proxyType || 'Internet'})`)

        fetchOptions.baseURL = destination.url

        const headers = { ...(fetchOptions.headers as Record<string, string>) }

        // 1. Handle Authentication (SAML Bearer or Basic)
        if (destination.authTokens?.[0]) {
          addTrace?.('BTP', 'Injecting SAML Bearer token (Principal Propagation)')
          headers.Authorization = `Bearer ${destination.authTokens[0].value}`
        }
        else if (destination.user && destination.password) {
          addTrace?.('BTP', 'Injecting Technical User credentials (Basic Auth)')
          headers.Authorization = `Basic ${btoa(`${destination.user}:${destination.password}`)}`
        }

        // 2. Handle Connectivity Service (OnPremise)
        if (destination.proxyType === 'OnPremise' && destination.connectivity) {
          addTrace?.('BTP', 'Attaching SAP Connectivity Service headers')

          // These headers are required by the BTP Connectivity Proxy
          headers['SAP-Connectivity-Authentication'] = `Bearer ${destination.connectivity.token}`

          if (destination.connectivity.userToken) {
            headers['Proxy-Authorization'] = `Bearer ${destination.connectivity.userToken}`
          }

          // Note: In a production Cloud Foundry environment, the connectivity proxy
          // usually requires an HTTP proxy agent. Since ofetch is environment-agnostic,
          // we assume the environment (Nitro/Node) handles the actual SOCKS5/Proxy tunnel
          // via process.env.http_proxy or a custom agent if configured.
        }

        fetchOptions.headers = headers
      }
      catch (err) {
        addTrace?.('BTP', 'Destination resolution failed', { error: (err as Error).message }, 'error')
        if (process.env.NODE_ENV === 'production') {
          console.error(`[@bc8-odx/proxy] BTP Destination Error [${serviceName}]:`, err)
        }
      }
    }
  })
})
