import { describe, expect, it, vi } from 'vitest'
import {
  $odataFetchMedia,
  $odataUpdateMedia,
  validateODataMediaBody,
  validateODataMediaSlug,
  validateODataMediaType,
} from '../src/odata-media'

describe('framework-agnostic OData media transport', () => {
  it('reads binary data and preserves safe response metadata', async () => {
    const data = Uint8Array.from([37, 80, 68, 70]).buffer
    const raw = vi.fn().mockResolvedValue({
      _data: data,
      headers: new Headers({
        'content-disposition': 'attachment; filename="manual.pdf"',
        'content-type': 'application/pdf',
        'etag': 'W/"media-1"',
      }),
    })

    await expect($odataFetchMedia({ raw } as any, 'Documents(1)/$value', {
      headers: { 'X-Correlation-ID': 'media-read-1' },
    })).resolves.toEqual({
      data,
      contentDisposition: 'attachment; filename="manual.pdf"',
      contentType: 'application/pdf',
      etag: 'W/"media-1"',
    })
    expect(raw).toHaveBeenCalledWith('Documents(1)/$value', {
      headers: {
        'accept': 'application/octet-stream',
        'x-correlation-id': 'media-read-1',
      },
      method: 'GET',
      responseType: 'arrayBuffer',
    })
  })

  it('rejects a non-binary media response', async () => {
    const raw = vi.fn().mockResolvedValue({
      _data: 'not binary',
      headers: new Headers(),
    })

    await expect($odataFetchMedia({ raw } as any, 'Documents(1)/$value'))
      .rejects
      .toThrow('invalid media response body')
  })

  it('replaces binary data with authoritative content type and response metadata', async () => {
    const body = Uint8Array.from([1, 2, 3])
    const raw = vi.fn().mockResolvedValue({
      headers: new Headers({
        'etag': 'W/"media-2"',
        'sap-message': ' {"message":"Replaced"} ',
      }),
    })

    await expect($odataUpdateMedia({ raw } as any, 'Documents(1)/$value', body, {
      contentType: ' application/pdf ',
      headers: {
        'Content-Type': 'text/plain',
        'If-Match': 'W/"media-1"',
      },
    })).resolves.toEqual({
      etag: 'W/"media-2"',
      sapMessage: '{"message":"Replaced"}',
    })
    expect(raw).toHaveBeenCalledWith('Documents(1)/$value', {
      body,
      headers: {
        'content-type': 'application/pdf',
        'if-match': 'W/"media-1"',
      },
      method: 'PUT',
      responseType: 'arrayBuffer',
    })
  })

  it('validates media bodies, content types, and slug headers', () => {
    expect(validateODataMediaBody(new ArrayBuffer(0))).toBeInstanceOf(ArrayBuffer)
    expect(validateODataMediaType(' application/pdf ')).toBe('application/pdf')
    expect(validateODataMediaSlug(' manual.pdf ')).toBe('manual.pdf')
    expect(validateODataMediaSlug(undefined)).toBeUndefined()
    expect(() => validateODataMediaBody('invalid' as any)).toThrow('ArrayBuffer or Uint8Array')
    expect(() => validateODataMediaType('pdf')).toThrow('valid content type')
    expect(() => validateODataMediaType('application/pdf\r\nx: y')).toThrow('valid content type')
    expect(() => validateODataMediaSlug('manual.pdf\r\nx: y')).toThrow('valid slug')
  })
})
