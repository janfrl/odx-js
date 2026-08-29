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

  it('rejects a complete-looking HTTP result without a closing MIME delimiter', () => {
    const body = [boundary, operation, ''].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/closing MIME boundary/u)
  })

  it('does not mistake inline closing text for a completed envelope', () => {
    const body = [boundary, operation, `Not a delimiter: ${boundary}--`].join('\r\n')
    expect(() => parse(body, contentType)).toThrow(/closing MIME boundary/u)
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
