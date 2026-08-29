import type { ODataChangeSetResponse } from '../src/index.js'
import { describe, expect, it } from 'vitest'
import {
  correlateODataBatchChangeSetResponses,
  correlateODataChangeSetResponses,
  parseODataChangeSetResponse,
  serializeODataBatchChangeSets,
  serializeODataChangeSet,
} from '../src/index.js'

const request = { method: 'PATCH' as const, path: 'Products(1)', body: { Active: true } }
function response(contentId?: string): ODataChangeSetResponse {
  return Object.freeze({
    status: 200,
    ...(contentId === undefined ? {} : { contentId }),
    headers: Object.freeze({ etag: `W/"${contentId ?? 'legacy'}"` }),
    body: { ID: contentId },
  })
}

describe('changeset response correlation', () => {
  it('publishes the exact request IDs serialized across sibling groups', () => {
    const single = serializeODataChangeSet([request, request])
    expect(single.contentIds).toEqual(['1', '2'])
    expect(Object.isFrozen(single.contentIds)).toBe(true)
    const batch = serializeODataBatchChangeSets([[request, request], [request], [request, request]])
    expect(batch.contentIds).toEqual([['1', '2'], ['3'], ['4', '5']])
    expect(Object.isFrozen(batch.contentIds)).toBe(true)
    for (const group of batch.contentIds) {
      expect(Object.isFrozen(group)).toBe(true)
      for (const id of group)
        expect(batch.body).toContain(`Content-ID: ${id}\r\n`)
    }
  })

  it('preserves MIME IDs in wire order and correlates data and ETags without mutating responses', () => {
    const body = [
      '--batch_response',
      'Content-Type: multipart/mixed; boundary=changeset_response',
      '',
      ...['2', '1'].flatMap(id => [
        '--changeset_response',
        'Content-Type: application/http',
        `Content-ID: ${id}`,
        '',
        'HTTP/1.1 200 OK',
        'Content-Type: application/json',
        `ETag: W/"${id}"`,
        '',
        JSON.stringify({ ID: id }),
      ]),
      '--changeset_response--',
      '--batch_response--',
    ].join('\r\n')
    const parsed = parseODataChangeSetResponse(body, 'multipart/mixed; boundary=batch_response')
    expect(parsed.map(item => item.contentId)).toEqual(['2', '1'])
    expect(parsed[0]?.headers).not.toHaveProperty('content-id')
    const ordered = correlateODataChangeSetResponses(parsed, ['1', '2'])
    expect(ordered.map(item => [item.contentId, item.body, item.headers.etag]))
      .toEqual([['1', { ID: '1' }, 'W/"1"'], ['2', { ID: '2' }, 'W/"2"']])
    expect(ordered[0]).toBe(parsed[1])
    expect(Object.isFrozen(ordered)).toBe(true)
    expect(parsed.map(item => item.contentId)).toEqual(['2', '1'])
  })

  it.each([
    [response('1'), response('1')],
    [response('1'), response()],
    [response('1'), response('foreign')],
    [response('1'), response('')],
  ])('rejects ambiguous response IDs %#', (...responses) => {
    expect(() => correlateODataChangeSetResponses(responses, ['1', '2']))
      .toThrow(/identifiers are missing, duplicate, or unexpected/u)
  })

  it('retains all-ID-less legacy order but rejects incomplete successful result counts', () => {
    const legacy = [response(), response()]
    expect(correlateODataChangeSetResponses(legacy, ['1', '2'])).toEqual(legacy)
    expect(() => correlateODataChangeSetResponses(legacy.slice(1), ['1', '2']))
      .toThrow(/response count/u)
  })

  it('rejects invalid request identity contracts, including duplicate IDs across groups', () => {
    expect(() => correlateODataChangeSetResponses([response()], ['']))
      .toThrow(/request identifiers/u)
    expect(() => correlateODataChangeSetResponses([response(), response()], ['1', '1']))
      .toThrow(/request identifiers/u)
    expect(() => correlateODataBatchChangeSetResponses([
      { succeeded: true, responses: [response()] },
      { succeeded: true, responses: [response()] },
    ], [['1'], ['1']])).toThrow(/requested changesets/u)
  })

  it('rejects duplicate MIME Content-ID headers instead of choosing one', () => {
    const body = [
      '--batch_response',
      'Content-Type: application/http',
      'Content-ID: 1',
      'content-id: 2',
      '',
      'HTTP/1.1 204 No Content',
      '',
      '--batch_response--',
    ].join('\r\n')
    expect(() => parseODataChangeSetResponse(body, 'multipart/mixed; boundary=batch_response'))
      .toThrow(/response part/u)
  })

  it('keeps a failed group intact while correlating successful groups using global IDs', () => {
    const failed = Object.freeze({
      succeeded: false,
      responses: Object.freeze([{ status: 412, headers: {}, body: { error: 'Conflict' } }]),
    })
    const results = correlateODataBatchChangeSetResponses([
      { succeeded: true, responses: [response('2'), response('1')] },
      failed,
      { succeeded: true, responses: [response('5'), response('4')] },
    ], [['1', '2'], ['3'], ['4', '5']])
    expect(results[0]?.responses.map(item => item.contentId)).toEqual(['1', '2'])
    expect(results[1]).toBe(failed)
    expect(results[2]?.responses.map(item => item.contentId)).toEqual(['4', '5'])
    expect(() => correlateODataBatchChangeSetResponses([
      { succeeded: true, responses: [response('1')] },
    ], [['1'], ['2']])).toThrow(/count does not match/u)
  })
})
