import { describe, expect, it } from 'vitest'
import {
  parseODataBatchChangeSetsResponse,
  parseODataBatchReadsResponse,
  parseODataChangeSetResponse,
} from '../src/odata-changeset'

const contentType = 'multipart/mixed; boundary="batch.response+1"'
const boundary = '--batch.response+1'
const entity = { ID: 1, Name: `Keep ${boundary} inside the value` }
const operation = [
  'Content-Type: application/http',
  '',
  'HTTP/1.1 200 OK',
  'Content-Type: application/json',
  'ETag: W/"one"',
  '',
  JSON.stringify(entity),
].join('\r\n')

const parsers = [
  { name: 'read batch', parse: parseODataBatchReadsResponse },
  { name: 'atomic changeset', parse: parseODataChangeSetResponse },
  {
    name: 'independent changesets',
    parse: (body: string, type: string) =>
      parseODataBatchChangeSetsResponse(body, type).flatMap(group => group.responses),
  },
]

it.each([false, true])('does not treat a pending batch mutation response as completed (nested=%s)', (nested) => {
  const pending = operation.replace('200 OK', '202 Accepted')
  const body = [
    boundary,
    ...(nested ? ['Content-Type: multipart/mixed; boundary=pending_group', '', '--pending_group'] : []),
    pending,
    ...(nested ? ['--pending_group--'] : []),
    `${boundary}--`,
  ].join('\r\n')
  for (const parse of [parseODataChangeSetResponse, parseODataBatchChangeSetsResponse]) {
    expect(() => parse(body, contentType)).toThrow(/pending asynchronous/u)
  }
  if (!nested)
    expect(parseODataBatchReadsResponse(body, contentType)[0]?.status).toBe(202)
})

it.each([200, 412])('does not flatten independent changeset groups into one atomic outcome (%s)', (status) => {
  const body = [
    ...[0, 1].flatMap(index => [
      boundary,
      `Content-Type: multipart/mixed; boundary=changeset_${index}`,
      '',
      `--changeset_${index}`,
      index === 0 ? operation : operation.replace('200 OK', `${status} Result`),
      `--changeset_${index}--`,
    ]),
    `${boundary}--`,
  ].join('\r\n')
  expect(parseODataBatchChangeSetsResponse(body, contentType).map(group => group.succeeded))
    .toEqual([true, status === 200])
  expect(() => parseODataChangeSetResponse(body, contentType))
    .toThrow(/exactly one changeset/u)
})

describe.each(parsers)('$name MIME framing', ({ parse }) => {
  it('preserves inline boundary text and ignores preamble and epilogue', () => {
    const body = [
      `Preamble with inline ${boundary}`,
      `${boundary} \t`,
      operation,
      `${boundary}--\t`,
      'Epilogue is not an operation:',
      boundary,
      operation,
    ].join('\r\n')
    expect(parse(body, contentType)).toEqual([{
      status: 200,
      headers: { 'content-type': 'application/json', 'etag': 'W/"one"' },
      body: entity,
    }])
  })

  it.each(['\r\n', '\n'])('accepts a closing delimiter at EOF with %j line endings', (newline) => {
    const body = [boundary, operation, `${boundary}--`].join('\r\n').replaceAll('\r\n', newline)
    expect(parse(body, contentType)[0]?.body).toEqual(entity)
  })

  it('accepts MIME type casing and application/http parameters', () => {
    const parameterized = operation.replace('application/http', 'Application/HTTP; msgtype=response')
    const body = [boundary, parameterized, `${boundary}--`].join('\r\n')
    expect(parse(body, contentType.replace('multipart/mixed', 'Multipart/Mixed'))[0]?.body).toEqual(entity)
  })

  it('rejects a complete-looking HTTP result without a closing MIME delimiter', () => {
    const body = [boundary, operation, ''].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/closing MIME boundary/u)
  })

  it('does not mistake inline closing text for a completed envelope', () => {
    const body = [boundary, operation, `Not a delimiter: ${boundary}--`].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/closing MIME boundary/u)
  })

  it.each([
    'Content-Type: text/plain\r\n\r\nUnrecognized result',
    'Content-Type: application/http-extra\r\n\r\nHTTP/1.1 200 OK\r\n',
    'Content-Type: application/http',
    '',
  ])('rejects an invalid sibling part instead of silently reporting success: %j', (invalid) => {
    const body = [boundary, operation, boundary, invalid, `${boundary}--`].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/response part/u)
  })

  it('rejects an HTTP status line hidden after unrelated content', () => {
    const invalid = operation.replace('HTTP/1.1 200 OK', 'Unexpected prefix\r\nHTTP/1.1 200 OK')
    const body = [boundary, invalid, `${boundary}--`].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/HTTP status line/u)
  })

  it('rejects a non-multipart outer content type even with a boundary parameter', () => {
    const body = [boundary, operation, `${boundary}--`].join('\r\n')
    expect(() => parse(body, 'text/plain; boundary="batch.response+1"')).toThrow(/multipart\/mixed/u)
  })
})

it('rejects an unclosed nested changeset even when the outer batch is complete', () => {
  const body = [
    boundary,
    'Content-Type: multipart/mixed; boundary=changeset_response',
    '',
    '--changeset_response',
    operation,
    `${boundary}--`,
  ].join('\r\n')
  expect(() => parseODataBatchChangeSetsResponse(body, contentType))
    .toThrow(/closing MIME boundary/u)
})

it('rejects an empty changeset instead of losing its position between sibling results', () => {
  const body = [
    boundary,
    operation,
    boundary,
    'Content-Type: multipart/mixed; boundary=changeset_empty',
    '',
    '--changeset_empty--',
    `${boundary}--`,
  ].join('\r\n')
  expect(() => parseODataBatchChangeSetsResponse(body, contentType))
    .toThrow(/response part/u)
})

it('validates the MIME type of nested changeset operations', () => {
  const body = [
    boundary,
    'Content-Type: multipart/mixed; boundary=changeset_wrong_type',
    '',
    '--changeset_wrong_type',
    operation.replace('Content-Type: application/http', 'Content-Type: text/plain'),
    '--changeset_wrong_type--',
    `${boundary}--`,
  ].join('\r\n')
  expect(() => parseODataBatchChangeSetsResponse(body, contentType))
    .toThrow(/response part/u)
})
