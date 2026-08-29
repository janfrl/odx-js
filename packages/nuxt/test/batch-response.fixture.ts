/** Deliberately ordered MIME results for both Nuxt transport implementations. */
export function batchResponse(groups: readonly (readonly (string | undefined)[])[], status = 200): string {
  return [
    ...groups.flatMap((ids, index) => [
      '--batch_response',
      `Content-Type: multipart/mixed; boundary=changeset_${index}`,
      '',
      ...ids.flatMap(id => [
        `--changeset_${index}`,
        'Content-Type: application/http',
        ...(id === undefined ? [] : [`Content-ID: ${id}`]),
        '',
        `HTTP/1.1 ${status} Result`,
        'Content-Type: application/json',
        `ETag: W/"${id ?? 'legacy'}"`,
        '',
        JSON.stringify({ ID: id ?? 'legacy' }),
      ]),
      `--changeset_${index}--`,
    ]),
    '--batch_response--',
  ].join('\r\n')
}
