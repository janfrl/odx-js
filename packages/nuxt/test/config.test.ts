import type { ODataProxyConfig } from '@me-tools/odx-core'
import { describe, expect, it } from 'vitest'
import { createPublicODataConfig } from '../src/config'

describe('public OData runtime configuration', () => {
  it('keeps proxied backend URLs private while preserving direct service URLs', () => {
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      mode: 'sdk',
      rootDir: '.',
      services: [
        {
          name: 'PrivateSap',
          route: 'sap',
          strategy: 'proxied',
          url: 'https://internal.example.test/sap',
        },
        {
          name: 'PublicNorthwind',
          strategy: 'direct',
          url: 'https://services.example.test/odata',
        },
      ],
    }

    expect(createPublicODataConfig(config)).toEqual({
      basePath: '/api/odx',
      mode: 'sdk',
      services: [
        {
          name: 'PrivateSap',
          route: 'sap',
          strategy: 'proxied',
        },
        {
          name: 'PublicNorthwind',
          strategy: 'direct',
          url: 'https://services.example.test/odata',
        },
      ],
    })
  })
})
