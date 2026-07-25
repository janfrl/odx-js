import { describe, expect, it } from 'vitest'
import {
  ODataChangeSetError,
  parseODataChangeSetResponse,
  serializeODataChangeSet,
} from '../src/index.js'

const boundaries = {
  batchBoundary: 'batch_test',
  changeSetBoundary: 'changeset_test',
}

describe('oData changesets', () => {
  it('serializes multiple writes as one atomic multipart changeset', () => {
    const payload = serializeODataChangeSet([
      {
        method: 'PATCH',
        path: 'Products(1)',
        headers: { 'If-Match': 'W/"product-1"' },
        body: { Name: 'Standing Desk' },
      },
      {
        method: 'PATCH',
        path: 'Products(1)/Items(11)',
        body: { Amount: '125.00' },
      },
    ], boundaries)

    expect(payload.contentType)
      .toBe('multipart/mixed; boundary=batch_test')
    expect(payload.body).toContain(
      'Content-Type: multipart/mixed; boundary=changeset_test',
    )
    expect(payload.body).toContain(
      'Content-ID: 1\r\n\r\nPATCH Products(1) HTTP/1.1',
    )
    expect(payload.body).toContain('If-Match: W/"product-1"')
    expect(payload.body).toContain('{"Name":"Standing Desk"}')
    expect(payload.body).toContain(
      'Content-ID: 2\r\n\r\nPATCH Products(1)/Items(11) HTTP/1.1',
    )
    expect(payload.body).toMatch(/--changeset_test--\r\n--batch_test--\r\n$/u)
  })

  it('rejects unsafe relative paths, headers, and boundaries', () => {
    expect(() => serializeODataChangeSet([{
      method: 'PATCH',
      path: 'https://attacker.example/Products(1)',
      body: {},
    }], boundaries)).toThrow(ODataChangeSetError)
    expect(() => serializeODataChangeSet([{
      method: 'PATCH',
      path: 'Products(1)',
      headers: { 'If-Match': 'ok\r\nInjected: true' },
      body: {},
    }], boundaries)).toThrow(ODataChangeSetError)
    expect(() => serializeODataChangeSet([{
      method: 'PATCH',
      path: 'Products(1)',
      body: {},
    }], {
      ...boundaries,
      batchBoundary: 'bad boundary',
    })).toThrow(ODataChangeSetError)
  })

  it('parses all successful changeset responses', () => {
    const body = [
      '--batch_response',
      'Content-Type: multipart/mixed; boundary=changeset_response',
      '',
      '--changeset_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      'Content-ID: 1',
      '',
      'HTTP/1.1 204 No Content',
      'ETag: W/"product-2"',
      '',
      '--changeset_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      'Content-ID: 2',
      '',
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      '',
      '{"ID":11,"Amount":"125.00"}',
      '--changeset_response--',
      '--batch_response--',
      '',
    ].join('\r\n')

    expect(parseODataChangeSetResponse(
      body,
      'multipart/mixed; boundary=batch_response',
    )).toEqual([
      { status: 204, headers: { etag: 'W/"product-2"' } },
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { ID: 11, Amount: '125.00' },
      },
    ])
  })

  it('exposes an atomic changeset failure including the server error', () => {
    const body = [
      '--batch_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      '',
      'HTTP/1.1 412 Precondition Failed',
      'Content-Type: application/json',
      '',
      '{"error":{"code":"ETAG_MISMATCH","message":"Changed"}}',
      '--batch_response--',
      '',
    ].join('\r\n')

    try {
      parseODataChangeSetResponse(
        body,
        'multipart/mixed; boundary="batch_response"',
      )
      throw new Error('Expected the changeset parser to fail.')
    }
    catch (error) {
      expect(error).toBeInstanceOf(ODataChangeSetError)
      expect(error).toMatchObject({
        code: 'core.changeset.failed',
        responses: [{
          status: 412,
          body: {
            error: { code: 'ETAG_MISMATCH', message: 'Changed' },
          },
        }],
      })
    }
  })
})
