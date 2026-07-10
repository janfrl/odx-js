import { describe, expect, it } from 'vitest'
import { prepareProxyHeaders } from '../src/utils/headers'

describe('proxy header preparation', () => {
  it('drops ambient browser and reverse-proxy credentials', () => {
    const result = prepareProxyHeaders({
      'authorization': 'Bearer incoming',
      'cookie': 'app-session=secret',
      'forwarded': 'for=192.0.2.1',
      'x-forwarded-prefix': '/tenant',
      'x-real-ip': '192.0.2.1',
      'via': '1.1 reverse-proxy',
      'connection': 'x-remove-me',
      'x-forwarded-for': '192.0.2.1',
      'x-remove-me': 'hop-by-hop-value',
      'x-forwarded-host': 'app.example.test',
      'x-forwarded-proto': 'https',
      'x-request-id': 'request-1',
    })

    expect(result).toEqual({
      'authorization': 'Bearer incoming',
      'x-request-id': 'request-1',
    })
  })

  it('preserves explicit backend headers and managed authorization', () => {
    const result = prepareProxyHeaders(
      {
        'cookie': 'app-session=secret',
        'x-client': 'browser',
      },
      {
        'cookie': 'backend-session=explicit',
        'x-client': 'configured',
      },
      'Bearer destination',
    )

    expect(result).toEqual({
      'authorization': 'Bearer destination',
      'cookie': 'backend-session=explicit',
      'x-client': 'browser',
    })
  })

  it('honors the authorization forwarding switch', () => {
    expect(prepareProxyHeaders(
      {
        'authorization': 'Bearer browser',
        'x-request-id': 'request-2',
      },
      {},
      undefined,
      { forwardAuthorization: false },
    )).toEqual({
      'x-request-id': 'request-2',
    })
  })
})
