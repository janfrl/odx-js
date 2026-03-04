import { Buffer } from 'node:buffer'
import type { XsuaaPayload } from '@bc8-odx/core'
import { parseXsuaaPolicies } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeader } from 'h3'

/**
 * Returns the current user's identity and calculated policies.
 * Supports both real XSUAA JWT tokens and synthetic identities from config.
 */
export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'authorization')
  const config = event.context.odataConfig

  // 1. Try to decode real JWT from header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
      if (payloadPart) {
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8')) as XsuaaPayload
        return parseXsuaaPolicies(payload)
      }
    }
    catch (e) {
      console.error('[@bc8-odx/proxy] Failed to parse JWT in /me:', e)
    }
  }

  // 2. Fallback to synthetic identity from config/env
  if (config?.auth?.username) {
    const payload: XsuaaPayload = {
      userId: config.auth.username,
      userCompanies: [
        { company: '1000', source: 'ERP' },
        { company: 'DE01', source: 'CRM' },
      ],
    }
    return parseXsuaaPolicies(payload)
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized: No user identity found in header or config',
  })
})
