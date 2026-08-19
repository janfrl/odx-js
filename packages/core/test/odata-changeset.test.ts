import { describe, expect, it } from 'vitest'
import {
  ODataChangeSetError,
  parseODataBatchChangeSetsResponse,
  parseODataChangeSetResponse,
  serializeODataBatchChangeSets,
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

  it('serializes independent changesets with unique content identities', () => {
    const payload = serializeODataBatchChangeSets([[{
      method: 'POST',
      path: 'Products(1)/Demo.ArchiveProduct',
      body: { Reason: 'Obsolete' },
    }], [{
      method: 'POST',
      path: 'Products(3)/Demo.ArchiveProduct',
      body: { Reason: 'Obsolete' },
    }]], {
      batchBoundary: 'batch_isolated',
      changeSetBoundaries: ['changeset_first', 'changeset_second'],
    })

    expect(payload.changeSetBoundaries)
      .toEqual(['changeset_first', 'changeset_second'])
    expect(payload.body).toContain(
      'boundary=changeset_first\r\n\r\n--changeset_first',
    )
    expect(payload.body).toContain(
      'Content-ID: 1\r\n\r\nPOST Products(1)/Demo.ArchiveProduct HTTP/1.1',
    )
    expect(payload.body).toContain(
      'boundary=changeset_second\r\n\r\n--changeset_second',
    )
    expect(payload.body).toContain(
      'Content-ID: 2\r\n\r\nPOST Products(3)/Demo.ArchiveProduct HTTP/1.1',
    )
    expect(payload.body).toMatch(/--changeset_second--\r\n--batch_isolated--\r\n$/u)
    expect(Object.isFrozen(payload.changeSetBoundaries)).toBe(true)
  })

  it('rejects empty groups and ambiguous independent boundaries', () => {
    expect(() => serializeODataBatchChangeSets([])).toThrow(ODataChangeSetError)
    expect(() => serializeODataBatchChangeSets([[]])).toThrow(ODataChangeSetError)
    expect(() => serializeODataBatchChangeSets([[{
      method: 'POST',
      path: 'Products(1)/Demo.ArchiveProduct',
    }]], {
      changeSetBoundaries: [],
    })).toThrow(ODataChangeSetError)
    expect(() => serializeODataBatchChangeSets([[{
      method: 'POST',
      path: 'Products(1)/Demo.ArchiveProduct',
    }]], {
      batchBoundary: 'same',
      changeSetBoundaries: ['same'],
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

  it('preserves independent successes and failures by changeset', () => {
    const body = [
      '--batch_response',
      'Content-Type: multipart/mixed; boundary=changeset_success',
      '',
      '--changeset_success',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 204 No Content',
      '',
      '--changeset_success--',
      '--batch_response',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 412 Precondition Failed',
      'Content-Type: application/json',
      '',
      '{"error":{"code":"ETAG_MISMATCH"}}',
      '--batch_response--',
      '',
    ].join('\r\n')

    const results = parseODataBatchChangeSetsResponse(
      body,
      'multipart/mixed; boundary=batch_response',
    )

    expect(results).toEqual([{
      succeeded: true,
      responses: [{ status: 204, headers: {} }],
    }, {
      succeeded: false,
      responses: [{
        status: 412,
        headers: { 'content-type': 'application/json' },
        body: { error: { code: 'ETAG_MISMATCH' } },
      }],
    }])
    expect(Object.isFrozen(results)).toBe(true)
    expect(Object.isFrozen(results[0]?.responses)).toBe(true)
  })
})
