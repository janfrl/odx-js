import * as core from '@me-tools/odx-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

const runtimeConfig = vi.hoisted(() => ({
  public: {
    odata: {
      basePath: '/api/odx',
      services: [
        { name: 'RoutedService', url: 'https://example.com/routed', route: 'routed-api', strategy: 'proxied' },
        { name: 'DirectService', url: 'https://external.com/odata', strategy: 'direct' },
      ],
    },
  },
}))

// Mock Nuxt-specific imports
vi.mock('#imports', () => ({
  useFetch: vi.fn((url, options) => ({ url, options })),
  useRequestEvent: vi.fn(() => undefined),
  useRequestFetch: vi.fn(() => globalThis.$fetch),
  useRuntimeConfig: vi.fn(() => runtimeConfig),
}))

// Mock core library
vi.mock('@me-tools/odx-core', async () => {
  const actual = await vi.importActual('@me-tools/odx-core')
  const { createODataContinuationPath, flattenOData, toODataCollectionPage } = await import('../../core/src/odata-utils')
  const {
    parseODataBatchChangeSetsResponse,
    serializeODataBatchChangeSets,
  } = await import('../../core/src/odata-changeset')
  const {
    createODataEntityReference,
    createODataMediaPath,
    createODataNavigationRootReference,
  } = await import('../../core/src/odata-path')
  return {
    ...actual as any,
    $odata: vi.fn(() => Promise.resolve({ success: true })),
    $odataCreateWithResponse: vi.fn(() => Promise.resolve({ entityId: 'Products(1)', etag: 'W/"entity-1"' })),
    $odataMutationWithResponse: vi.fn(() => Promise.resolve({ data: { success: true }, etag: 'W/"entity-2"' })),
    $odataPage: vi.fn(() => Promise.resolve({ items: [{ ID: 1 }], totalCount: 49 })),
    $odataWithResponse: vi.fn(() => Promise.resolve({ data: { success: true }, etag: 'W/"entity-1"' })),
    createODataContinuationPath,
    createODataEntityReference,
    createODataMediaPath,
    createODataNavigationRootReference,
    flattenOData,
    parseODataBatchChangeSetsResponse,
    serializeODataBatchChangeSets,
    stringifyQuery: vi.fn(q => q),
    toODataCollectionPage,
  }
})

const { useOData } = await import('../src/runtime/composables/useOData')

describe('useOData Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const fetchMock = vi.fn() as any
    fetchMock.raw = vi.fn()
    globalThis.$fetch = fetchMock
    runtimeConfig.public.odata.basePath = '/api/odx'
    runtimeConfig.public.odata.services = [
      { name: 'RoutedService', url: 'https://example.com/routed', route: 'routed-api', strategy: 'proxied' },
      { name: 'DirectService', url: 'https://external.com/odata', strategy: 'direct' },
    ]
  })

  it('advertises optional runtime capabilities explicitly', () => {
    const entitySet = useOData('MyService').entitySet('Products')

    expect(entitySet.supportsContainedNavigationSources).toBe(true)
    expect(entitySet.supportsNavigationRootReferences).toBe(true)
    expect(entitySet.createNavigationRootReference?.(
      { ID: 'A/B', IsActiveEntity: false },
      ['Items'],
    )).toBe(
      '$root/Products(ID=\'A%2FB\',IsActiveEntity=false)/Items',
    )
    expect(entitySet.supportsNavigationReferences).toBe(true)
    expect(entitySet.supportsNavigationReferenceResponses).toBe(true)
    expect(entitySet.supportsCollectionPages).toBe(true)
    expect(entitySet.supportsEntityResponses).toBe(true)
    expect(entitySet.supportsNavigationEntityResponses).toBe(true)
    expect(entitySet.supportsOptimisticConcurrency).toBe(true)
    expect(entitySet.supportsCreateResponses).toBe(true)
    expect(entitySet.supportsActionResponses).toBe(true)
    expect(entitySet.supportsDeleteResponses).toBe(true)
    expect(entitySet.supportsMerge).toBe(true)
    expect(entitySet.supportsMediaStreams).toBe(true)
    expect(entitySet.supportsContinuations).toBe(true)
  })

  describe('key Formatting', () => {
    it('formats single keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('abc') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'abc\')')
    })

    it('uri-encodes string key literal content', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('A/B?x=1&R') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'A%2FB%3Fx%3D1%26R\')')
    })

    it('escapes single quotes in string keys', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('O\'Brien') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'O\'\'Brien\')')
    })

    it('formats numeric keys without quotes', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get(123) as any
      expect(result.url).toBe('/api/odx/MyService/Products(123)')
    })

    it('formats composite keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'A' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'A\')')
    })

    it('uri-encodes composite string key literal content', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'A/B?x=1&R' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'A%2FB%3Fx%3D1%26R\')')
    })

    it('escapes single quotes in composite string keys', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'Bob\'s' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'Bob\'\'s\')')
    })

    it('rejects unsafe entity-set and composite-key identifiers', () => {
      const api = useOData('MyService')

      expect(() => api.entitySet('../Products').get(1)).toThrow('valid identifier')
      expect(() => api.entitySet('Products').get({ '../ID': 1 })).toThrow('valid identifier')
    })
  })

  describe('uRL Construction', () => {
    it('constructs list URLs correctly for proxied services', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/MyService/Products')
      expect(result.options.headers).toEqual({ accept: 'application/json' })
    })

    it('projects counted collection reads into an SSR-safe page', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').listPage({ $count: true }) as any

      expect(result.url).toBe('/api/odx/MyService/Products')
      expect(result.options.key).toContain('odx-page:/api/odx/MyService/Products:')
      expect(result.options.query).toEqual({ $count: true })
      expect(result.options.transform({
        '@odata.count': 2,
        'value': [{ ID: 1 }, { ID: 2 }],
      })).toEqual({
        items: [{ ID: 1 }, { ID: 2 }],
        totalCount: 2,
      })
    })

    it('keeps list and page AsyncData entries distinct for the same query', () => {
      const api = useOData('MyService').entitySet('Products')
      const query = { $top: 1 }
      const list = api.list(query) as any
      const page = api.listPage(query) as any

      expect(list.options.key).toBeUndefined()
      expect(page.options.key).toContain('odx-page:/api/odx/MyService/Products:')
    })

    it('preserves an explicit page AsyncData key', () => {
      const page = useOData('MyService').entitySet('Products').listPage(undefined, {
        key: 'products-page',
      }) as any

      expect(page.options.key).toBe('products-page')
    })

    it('anchors reactive continuation reads to the current proxied entity set', () => {
      const page = useOData('MyService').entitySet('Products').listNextPage({
        token: '%24skiptoken=opaque%2Btoken&%24top=1',
      }) as any

      expect(page.url).toBe('/api/odx/MyService/Products?%24skiptoken=opaque%2Btoken&%24top=1')
      expect(page.options.query).toBeUndefined()
      expect(page.options.key).toBe('odx-page:/api/odx/MyService/Products?%24skiptoken=opaque%2Btoken&%24top=1')
      expect(page.options.transform({
        d: {
          results: [{ ID: 2 }],
          __next: 'https://private.example/Products?%24skiptoken=next%2B2',
        },
      })).toEqual({
        items: [{ ID: 2 }],
        continuation: { token: '%24skiptoken=next%2B2' },
      })
    })

    it('anchors direct continuation reads to the configured service entity set', () => {
      const page = useOData('DirectService' as any).entitySet('Products').listNextPage({
        token: '%24skiptoken=next-1',
      }) as any

      expect(page.url).toBe('https://external.com/odata/Products?%24skiptoken=next-1')
      expect(page.url).not.toContain('private.sap.example')
    })

    it('preserves read headers while allowing an explicit accept override', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get(1, undefined, {
        headers: {
          'Accept': 'application/json;odata.metadata=minimal',
          'X-Correlation-ID': 'request-1',
        },
      }) as any

      expect(result.options.headers).toEqual({
        'accept': 'application/json;odata.metadata=minimal',
        'x-correlation-id': 'request-1',
      })
    })

    it('preserves reactive read headers and explicit accept overrides', () => {
      const accept = ref('application/json;odata.metadata=minimal')
      const headers = computed(() => ({
        'Accept': accept.value,
        'X-Correlation-ID': 'request-1',
      }))
      const api = useOData('MyService')
      const result = api.entitySet('Products').list(undefined, { headers }) as any

      expect(result.options.headers.value).toEqual({
        'accept': 'application/json;odata.metadata=minimal',
        'x-correlation-id': 'request-1',
      })

      accept.value = 'application/json;odata.metadata=full'
      expect(result.options.headers.value.accept).toBe('application/json;odata.metadata=full')
    })

    it('constructs proxied list URLs with the configured service route', () => {
      const api = useOData('RoutedService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/routed-api/Products')
    })

    it('constructs URLs correctly for direct (HTTP) services', () => {
      // DirectService is configured with a full URL in the mock
      const api = useOData('DirectService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('https://external.com/odata/Products')
    })

    it('normalizes direct service URLs with trailing slashes', () => {
      runtimeConfig.public.odata.services.push({
        name: 'DirectSlashService',
        url: 'https://external.com/odata/',
        strategy: 'direct',
      })

      const api = useOData('DirectSlashService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('https://external.com/odata/Products')
    })

    it('normalizes proxied base paths and routes with boundary slashes', () => {
      runtimeConfig.public.odata.basePath = '/api/odx/'
      runtimeConfig.public.odata.services.push({
        name: 'RoutedSlashService',
        url: 'https://example.com/routed',
        route: '/routed-api/',
        strategy: 'proxied',
      })

      const api = useOData('RoutedSlashService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/routed-api/Products')
    })

    it('handles service calls without entity sets (service root)', () => {
      const api = useOData('MyService')
      const result = (api as any).list()
      expect(result.url).toBe('/api/odx/MyService')
    })
  })

  describe('imperative reads', () => {
    it('reads default and named media streams with response metadata', async () => {
      const bytes = Uint8Array.from([37, 80, 68, 70]).buffer
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        _data: bytes,
        headers: new Headers({
          'content-disposition': 'attachment; filename="manual.pdf"',
          'content-type': 'application/pdf',
          'etag': 'W/"media-1"',
        }),
      })

      const response = await useOData('MyService').entitySet('Documents').fetchMedia(
        { ID: 'A/B' },
        {
          headers: { 'X-Correlation-ID': 'media-read-1' },
          streamProperty: 'Preview',
        },
      )

      expect(response).toEqual({
        data: bytes,
        contentDisposition: 'attachment; filename="manual.pdf"',
        contentType: 'application/pdf',
        etag: 'W/"media-1"',
      })
      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Documents(ID=\'A%2FB\')/Preview/$value',
        {
          headers: {
            'accept': 'application/octet-stream',
            'x-correlation-id': 'media-read-1',
          },
          method: 'GET',
          responseType: 'arrayBuffer',
        },
      )
    })

    it('reads a contained named media stream from a structured source', async () => {
      const bytes = Uint8Array.from([1, 2]).buffer
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        _data: bytes,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
      })

      await useOData('MyService').entitySet('Products').fetchMedia({
        kind: 'contained-entity',
        rootKey: { ID: 1, IsActiveEntity: false },
        path: [{ navigationPath: ['Attachments'], key: { AttachmentID: 'A/B' } }],
      }, { streamProperty: 'Content' })

      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Products(ID=1,IsActiveEntity=false)/Attachments(AttachmentID=\'A%2FB\')/Content/$value',
        expect.objectContaining({ method: 'GET', responseType: 'arrayBuffer' }),
      )
    })

    it('creates a media entity with binary content, slug, representation, and ETag', async () => {
      const bytes = Uint8Array.from([37, 80, 68, 70])
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        _data: { ID: 42, Name: 'manual.pdf' },
        headers: new Headers({
          'etag': 'W/"media-created"',
          'location': 'Documents(42)',
          'odata-entityid': 'Documents(42)',
          'sap-message': '{"message":"Document created.","severity":"success"}',
        }),
      })

      const response = await useOData('MyService').entitySet('Documents').createMedia(
        bytes,
        {
          contentType: 'application/pdf',
          headers: {
            'content-type': 'text/plain',
            'prefer': 'return=minimal',
            'slug': 'ignored.txt',
            'x-correlation-id': 'media-create-1',
          },
          slug: ' manual.pdf ',
        },
      )

      expect(response).toEqual({
        data: { ID: 42, Name: 'manual.pdf' },
        entityId: 'Documents(42)',
        etag: 'W/"media-created"',
        location: 'Documents(42)',
        sapMessage: '{"message":"Document created.","severity":"success"}',
      })
      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Documents',
        {
          body: bytes,
          headers: {
            'content-type': 'application/pdf',
            'prefer': 'return=representation',
            'slug': 'manual.pdf',
            'x-correlation-id': 'media-create-1',
          },
          method: 'POST',
          responseType: 'json',
        },
      )
    })

    it('accepts a media create without a response representation', async () => {
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        _data: undefined,
        headers: new Headers({
          'location': 'Documents(43)',
          'odata-entityid': 'Documents(43)',
        }),
      })

      await expect(useOData('MyService').entitySet('Documents').createMedia(
        new ArrayBuffer(0),
        { contentType: 'application/octet-stream' },
      )).resolves.toEqual({
        entityId: 'Documents(43)',
        location: 'Documents(43)',
      })
    })

    it('creates a contained media entity through a structured parent source', async () => {
      const bytes = Uint8Array.from([37, 80, 68, 70])
      const signal = new AbortController().signal
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        _data: { AttachmentID: 8, FileName: 'manual.pdf' },
        headers: new Headers({
          'etag': 'W/"attachment-8"',
          'location': 'Products(1)/Attachments(8)',
          'odata-entityid': 'Products(1)/Attachments(8)',
          'sap-message': '{"message":"Attachment created.","severity":"success"}',
        }),
      })

      const response = await useOData('MyService').entitySet('Products').createNavigationMedia<{
        AttachmentID: number
        FileName: string
      }>(
        {
          kind: 'contained-entity',
          rootKey: { ID: 1, IsActiveEntity: false },
          path: [{ navigationPath: ['Items'], key: 4 }],
        },
        ['Attachments'],
        bytes,
        {
          contentType: 'application/pdf',
          headers: {
            'content-type': 'text/plain',
            'prefer': 'return=minimal',
            'slug': 'ignored.txt',
            'x-correlation-id': 'contained-media-8',
          },
          signal,
          slug: ' manual.pdf ',
        },
      )

      expect(response).toEqual({
        data: { AttachmentID: 8, FileName: 'manual.pdf' },
        entityId: 'Products(1)/Attachments(8)',
        etag: 'W/"attachment-8"',
        location: 'Products(1)/Attachments(8)',
        sapMessage: '{"message":"Attachment created.","severity":"success"}',
      })
      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Products(ID=1,IsActiveEntity=false)/Items(4)/Attachments',
        {
          body: bytes,
          headers: {
            'content-type': 'application/pdf',
            'prefer': 'return=representation',
            'slug': 'manual.pdf',
            'x-correlation-id': 'contained-media-8',
          },
          method: 'POST',
          responseType: 'json',
          signal,
        },
      )
    })

    it('replaces media streams with an exact content type and conditional ETag', async () => {
      const bytes = Uint8Array.from([1, 2, 3])
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({
        headers: new Headers({
          'etag': 'W/"media-2"',
          'sap-message': '{"message":"Document replaced.","severity":"warning"}',
        }),
      })

      const response = await useOData('MyService').entitySet('Documents').updateMedia(
        1,
        bytes,
        {
          contentType: 'application/octet-stream',
          headers: {
            'Content-Type': 'text/plain',
            'If-Match': 'W/"media-1"',
          },
        },
      )

      expect(response).toEqual({
        etag: 'W/"media-2"',
        sapMessage: '{"message":"Document replaced.","severity":"warning"}',
      })
      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Documents(1)/$value',
        {
          body: bytes,
          headers: {
            'content-type': 'application/octet-stream',
            'if-match': 'W/"media-1"',
          },
          method: 'PUT',
          responseType: 'arrayBuffer',
        },
      )
    })

    it('replaces a contained named media stream from a structured source', async () => {
      const fetchMock = globalThis.$fetch as any
      fetchMock.raw.mockResolvedValue({ headers: new Headers() })

      await useOData('MyService').entitySet('Products').updateMedia({
        kind: 'contained-entity',
        rootKey: 1,
        path: [{ navigationPath: ['Attachments'], key: 2 }],
      }, Uint8Array.from([1, 2]), {
        contentType: 'application/octet-stream',
        streamProperty: 'Content',
      })

      expect(fetchMock.raw).toHaveBeenCalledWith(
        '/api/odx/MyService/Products(1)/Attachments(2)/Content/$value',
        expect.objectContaining({ method: 'PUT', responseType: 'arrayBuffer' }),
      )
    })

    it('rejects unsafe media properties, invalid bodies, and header injection', async () => {
      const entitySet = useOData('MyService').entitySet('Documents')

      await expect(entitySet.fetchMedia(1, { streamProperty: '../Preview' }))
        .rejects
        .toThrow('valid identifier')
      await expect(entitySet.updateMedia(1, 'not-bytes' as any, {
        contentType: 'application/pdf',
      }))
        .rejects
        .toThrow('ArrayBuffer or Uint8Array')
      await expect(entitySet.createMedia('not-bytes' as any, {
        contentType: 'application/pdf',
      }))
        .rejects
        .toThrow('ArrayBuffer or Uint8Array')
      await expect(entitySet.createMedia(new ArrayBuffer(0), {
        contentType: 'application/pdf',
        slug: 'manual.pdf\r\nx-injected: true',
      }))
        .rejects
        .toThrow('valid slug')
      await expect(entitySet.createNavigationMedia(
        1,
        [],
        new ArrayBuffer(0),
        { contentType: 'application/pdf' },
      ))
        .rejects
        .toThrow('requires one or more valid identifier segments')
      await expect(entitySet.updateMedia(1, new ArrayBuffer(0), {
        contentType: 'application/pdf\r\nx-injected: true',
      }))
        .rejects
        .toThrow('valid content type')
      await expect(entitySet.updateMedia(1, new ArrayBuffer(0), {
        contentType: 'pdf',
      }))
        .rejects
        .toThrow('valid content type')
    })

    it('preserves an entity ETag through an explicit response read', async () => {
      const signal = new AbortController().signal

      const response = await useOData('MyService').entitySet('Products').fetchOneWithResponse(
        1,
        { $select: ['ID', 'Name'] },
        { signal },
      )

      expect(response).toEqual({ data: { success: true }, etag: 'W/"entity-1"' })
      expect(core.$odataWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Products(1)',
        'GET',
        {
          query: { $select: ['ID', 'Name'] },
          signal,
        },
      )
    })

    it('preserves the next ETag from a conditional entity update', async () => {
      const headers = { 'If-Match': 'W/"entity-1"' }

      const response = await useOData('MyService').entitySet('Products').updateWithResponse(
        1,
        { Name: 'Updated' },
        { headers },
      )

      expect(response).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odataMutationWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' }, headers },
      )
    })

    it('supports explicit SAP Gateway MERGE updates with and without response metadata', async () => {
      const entitySet = useOData('MyService').entitySet('Products')
      const headers = { 'If-Match': 'W/"entity-1"' }

      await entitySet.merge(1, { Name: 'Merged' }, { headers })
      const response = await entitySet.mergeWithResponse(1, { Name: 'Merged again' }, { headers })

      expect(response).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'MERGE',
        { body: { Name: 'Merged' }, headers },
      )
      expect(core.$odataMutationWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Products(1)',
        'MERGE',
        { body: { Name: 'Merged again' }, headers },
      )
    })

    it('uses the promise transport and forwards cancellation', async () => {
      const signal = new AbortController().signal
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').fetchList(
        { $select: ['ID', 'Name'], $top: 2 },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products',
        'GET',
        {
          query: { $select: ['ID', 'Name'], $top: 2 },
          signal,
        },
      )
    })

    it('preserves count information through fetchPage', async () => {
      const signal = new AbortController().signal

      const page = await useOData('MyService').entitySet('Products').fetchPage({
        $inlinecount: 'allpages',
      }, {
        headers: { 'X-Correlation-ID': 'page-1' },
        signal,
      })

      expect(page).toEqual({ items: [{ ID: 1 }], totalCount: 49 })
      expect(core.$odataPage).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products',
        {
          headers: { 'X-Correlation-ID': 'page-1' },
          query: { $inlinecount: 'allpages' },
          signal,
        },
      )
    })

    it('imperatively follows an opaque continuation on the current entity set', async () => {
      vi.mocked(core.$odataPage).mockResolvedValueOnce({
        items: [{ ID: 2 }],
        continuation: { token: '%24skiptoken=next-2' },
      })
      const signal = new AbortController().signal

      const page = await useOData('MyService').entitySet('Products').fetchNextPage(
        { token: '%24skiptoken=next-1' },
        { signal },
      )

      expect(page).toEqual({
        items: [{ ID: 2 }],
        continuation: { token: '%24skiptoken=next-2' },
      })
      expect(core.$odataPage).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products?%24skiptoken=next-1',
        { signal },
      )
    })

    it('reads and continues a related collection page on its navigation path', async () => {
      const entitySet = useOData('MyService').entitySet('Categories')
      const reactivePage = entitySet.listNavigationPage<{ ProductID: number }>(
        1,
        ['Products'],
        { $top: 1 },
      ) as any

      expect(reactivePage.url).toBe('/api/odx/MyService/Categories(1)/Products')
      expect(reactivePage.options.query).toEqual({ $top: 1 })
      expect(reactivePage.options.transform({
        d: {
          results: [{ ProductID: 1 }],
          __next: 'https://private.example/Categories(1)/Products?%24skiptoken=ProductID-1',
        },
      })).toEqual({
        items: [{ ProductID: 1 }],
        continuation: { token: '%24skiptoken=ProductID-1' },
      })

      const nextPage = entitySet.listNavigationNextPage<{ ProductID: number }>(
        1,
        ['Products'],
        { token: '%24skiptoken=ProductID-1' },
      ) as any
      expect(nextPage.url)
        .toBe('/api/odx/MyService/Categories(1)/Products?%24skiptoken=ProductID-1')
    })

    it('imperatively preserves navigation page typing and cancellation', async () => {
      const signal = new AbortController().signal
      const entitySet = useOData('MyService').entitySet('Categories')

      await entitySet.fetchNavigationPage<{ ProductID: number }>(
        1,
        'Products',
        { $top: 1 },
        { signal },
      )
      await entitySet.fetchNavigationNextPage<{ ProductID: number }>(
        1,
        'Products',
        { token: '%24skiptoken=ProductID-1' },
        { signal },
      )

      expect(core.$odataPage).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Categories(1)/Products',
        { query: { $top: 1 }, signal },
      )
      expect(core.$odataPage).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Categories(1)/Products?%24skiptoken=ProductID-1',
        { signal },
      )
    })

    it('reads a single entity and forwards query and cancellation', async () => {
      const signal = new AbortController().signal
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').fetchOne(
        { ID: 1, Locale: 'en' },
        { $select: ['ID', 'Name'] },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')',
        'GET',
        {
          query: { $select: ['ID', 'Name'] },
          signal,
        },
      )
    })

    it('reads a collection relative to an entity', async () => {
      const signal = new AbortController().signal
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').fetchNavigationList(
        { ID: 1, Locale: 'en' },
        'Category/RelatedProducts',
        { $select: ['ID', 'Name'], $top: 3 },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Category/RelatedProducts',
        'GET',
        {
          query: { $select: ['ID', 'Name'], $top: 3 },
          signal,
        },
      )
    })

    it('reads a typed navigation collection through AsyncData', () => {
      const result = useOData('RoutedService' as any)
        .entitySet('Categories')
        .listNavigation<{ ProductID: number, ProductName: string }>(
          1,
          ['Products'],
          { $select: ['ProductID', 'ProductName'], $top: 1 },
        ) as any

      expect(result.url).toBe('/api/odx/routed-api/Categories(1)/Products')
      expect(result.options.query).toEqual({
        $select: ['ProductID', 'ProductName'],
        $top: 1,
      })
      expect(result.options.headers).toEqual({ accept: 'application/json' })
      expect(result.options.transform({
        d: {
          results: [{ ProductID: 1, ProductName: 'Chai' }],
        },
      })).toEqual([{ ProductID: 1, ProductName: 'Chai' }])
    })

    it('accepts segmented navigation reads and rejects unsafe paths', async () => {
      const entitySet = useOData('MyService').entitySet('Products')

      await entitySet.fetchNavigationList(1, ['Category', 'RelatedProducts'])

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Category/RelatedProducts',
        'GET',
        { query: {} },
      )
      expect(() => entitySet.fetchNavigationList(1, '')).toThrow(TypeError)
      expect(() => entitySet.fetchNavigationList(1, '/Items')).toThrow(TypeError)
      expect(() => entitySet.fetchNavigationList(1, 'Items?$filter=ID')).toThrow(TypeError)
    })

    it('reads navigation collections relative to contained entities', async () => {
      const entitySet = useOData('RoutedService' as any).entitySet('Products')

      await entitySet.fetchNavigationList({
        kind: 'contained-entity',
        rootKey: { ID: 1, IsActiveEntity: false },
        path: [{ navigationPath: ['Items'], key: { ItemID: 'A/B' } }],
      }, ['Tags'], { $select: ['ID'] })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,IsActiveEntity=false)/Items(ItemID=\'A%2FB\')/Tags',
        'GET',
        { query: { $select: ['ID'] } },
      )
    })
  })
  describe('mutations ($odata)', () => {
    it('calls $odata for create (POST)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').create({ Name: 'New Product' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products',
        'POST',
        { body: { Name: 'New Product' } },
      )
    })

    it('calls $odata for routed service create using the configured route', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').create({ Name: 'New Product' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products',
        'POST',
        { body: { Name: 'New Product' } },
      )
    })

    it('creates a child through a validated navigation path', async () => {
      const api = useOData('RoutedService' as any)
      const signal = new AbortController().signal

      await api.entitySet('Products').createNavigation(
        { ID: 1, Locale: 'en' },
        ['Items'],
        { Product: 'Desk', Amount: '125.50' },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Items',
        'POST',
        {
          body: { Product: 'Desk', Amount: '125.50' },
          signal,
        },
      )
    })

    it('preserves a bodyless child create response on its navigation path', async () => {
      const api = useOData('RoutedService' as any)
      const headers = { Prefer: 'return=minimal' }

      const response = await api.entitySet('Products').createNavigationWithResponse(
        { ID: 1, Locale: 'en' },
        ['Items'],
        { Product: 'Desk', Amount: '125.50' },
        { headers },
      )

      expect(response).toEqual({ entityId: 'Products(1)', etag: 'W/"entity-1"' })
      expect(core.$odataCreateWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Items',
        {
          body: { Product: 'Desk', Amount: '125.50' },
          headers,
        },
      )
    })

    it('preserves ETags from single-valued and keyed collection navigation reads', async () => {
      const signal = new AbortController().signal
      const entitySet = useOData('RoutedService' as any).entitySet('Products')

      await entitySet.fetchNavigationOneWithResponse<{ ID: number, Name: string }>({
        source: 1,
        navigationPath: ['Supplier'],
        query: { $select: ['ID', 'Name'] },
      }, { signal })
      await entitySet.fetchNavigationOneWithResponse<{ Day: string }>({
        source: {
          kind: 'contained-entity',
          rootKey: { ID: 1, IsActiveEntity: false },
          path: [{ navigationPath: ['Items'], key: { ItemID: 'A/B' } }],
        },
        navigationPath: ['Schedules'],
        targetKey: { Day: 'Mon' },
      })

      expect(core.$odataWithResponse).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/routed-api/Products(1)/Supplier',
        'GET',
        { query: { $select: ['ID', 'Name'] }, signal },
      )
      expect(core.$odataWithResponse).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/routed-api/Products(ID=1,IsActiveEntity=false)/Items(ItemID=\'A%2FB\')/Schedules(Day=\'Mon\')',
        'GET',
        { query: {} },
      )
    })

    it('mutates navigation children below a contained entity', async () => {
      const entitySet = useOData('RoutedService' as any).entitySet('Products')
      const source = {
        kind: 'contained-entity' as const,
        rootKey: 1,
        path: [{ navigationPath: ['Items'], key: 2 }],
      }

      await entitySet.createNavigation(source, ['Tags'], { Name: 'Priority' })
      await entitySet.updateNavigation(source, ['Tags'], {
        targetKey: 3,
        body: { Name: 'Important' },
      })
      await entitySet.removeNavigation(source, ['Tags'], 3)

      const calls = (core.$odata as ReturnType<typeof vi.fn>).mock.calls
      expect(calls.at(-3)?.[1]).toBe(
        '/api/odx/routed-api/Products(1)/Items(2)/Tags',
      )
      expect(calls.at(-2)?.[1]).toBe(
        '/api/odx/routed-api/Products(1)/Items(2)/Tags(3)',
      )
      expect(calls.at(-1)?.[1]).toBe(
        '/api/odx/routed-api/Products(1)/Items(2)/Tags(3)',
      )
    })

    it('rejects empty or unsafe navigation paths', () => {
      const entitySet = useOData('MyService').entitySet('Products')

      expect(() => entitySet.createNavigation(1, [], {})).toThrow(TypeError)
      expect(() => entitySet.createNavigationWithResponse(1, [], {})).toThrow(TypeError)
      expect(() => entitySet.createNavigation(
        1,
        ['Items?$filter=ID'],
        {},
      )).toThrow(TypeError)
    })
    it('removes a keyed entity from a collection-valued navigation', async () => {
      const api = useOData('RoutedService' as any)
      const headers = { 'If-Match': 'W/"item-1"' }

      await api.entitySet('Products').removeNavigation(
        { ID: 1, Locale: 'en' },
        ['Items'],
        { ItemID: 'A/B', Locale: 'en' },
        { headers },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Items(ItemID=\'A%2FB\',Locale=\'en\')',
        'DELETE',
        { headers },
      )
    })

    it('omits request options when removing a navigation member without options', async () => {
      const entitySet = useOData('MyService').entitySet('Products')

      await entitySet.removeNavigation(1, ['Items'], 2)

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Items(2)',
        'DELETE',
      )
    })

    it('rejects unsafe remove navigation paths before transport', () => {
      const entitySet = useOData('MyService').entitySet('Products')

      expect(() => entitySet.removeNavigation(1, [], 2)).toThrow(TypeError)
      expect(() => entitySet.removeNavigation(1, ['Items(1)'], 2)).toThrow(TypeError)
    })

    it('updates a single-valued navigation target', async () => {
      const api = useOData('RoutedService' as any)
      const headers = { 'If-Match': 'W/"supplier-1"' }

      await api.entitySet('Products').updateNavigation(
        { ID: 1, Locale: 'en' },
        ['Supplier'],
        { body: { Name: 'Modern Office GmbH' } },
        { headers },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Supplier',
        'PATCH',
        { body: { Name: 'Modern Office GmbH' }, headers },
      )
    })

    it('updates a keyed entity in a collection-valued navigation', async () => {
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').updateNavigation(
        1,
        ['Items'],
        {
          targetKey: { ItemID: 'A/B', Locale: 'en' },
          body: { Quantity: 3 },
        },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(1)/Items(ItemID=\'A%2FB\',Locale=\'en\')',
        'PATCH',
        { body: { Quantity: 3 } },
      )
    })

    it('preserves the next ETag from a conditional navigation update', async () => {
      const api = useOData('RoutedService' as any)
      const headers = { 'If-Match': 'W/"item-1"' }

      const response = await api.entitySet('Products').updateNavigationWithResponse(
        1,
        ['Items'],
        { targetKey: 2, body: { Quantity: 3 } },
        { headers },
      )

      expect(response).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odataMutationWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/routed-api/Products(1)/Items(2)',
        'PATCH',
        { body: { Quantity: 3 }, headers },
      )
    })

    it('rejects unsafe update navigation paths before transport', () => {
      const entitySet = useOData('MyService').entitySet('Products')

      expect(() => entitySet.updateNavigation(
        1,
        [],
        { body: { Name: 'Updated' } },
      )).toThrow(TypeError)
      expect(() => entitySet.updateNavigationWithResponse(
        1,
        [],
        { body: { Name: 'Updated' } },
      )).toThrow(TypeError)
      expect(() => entitySet.updateNavigation(
        1,
        ['Items(1)'],
        { body: { Name: 'Updated' } },
      )).toThrow(TypeError)
    })

    it('calls $odata for update (PATCH)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').update(1, { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('calls $odata for routed service update using the configured route and string key', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').update('O\'Brien', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(\'O\'\'Brien\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('uri-encodes string key literal content for routed update URLs', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').update('A/B?x=1&R', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(\'A%2FB%3Fx%3D1%26R\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('escapes single quotes in update keys', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').update('O\'Brien', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(\'O\'\'Brien\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('calls $odata for remove (DELETE)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').remove('key1')

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(\'key1\')',
        'DELETE',
      )
    })

    it('calls $odata for routed service remove using the configured route', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').remove(1)

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(1)',
        'DELETE',
      )
    })

    it('escapes single quotes in remove keys', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').remove({ ID: 'Bob\'s', Locale: 'en' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(ID=\'Bob\'\'s\',Locale=\'en\')',
        'DELETE',
      )
    })

    it('forwards mutation cancellation and concurrency headers', async () => {
      const api = useOData('MyService')
      const signal = new AbortController().signal
      const headers = { 'If-Match': 'W/"product-1"' }

      await api.entitySet('Products').update(
        1,
        { Name: 'Updated' },
        { headers, signal },
      )
      await api.entitySet('Products').remove(1, { headers, signal })

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' }, headers, signal },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'DELETE',
        { headers, signal },
      )
    })

    it('invokes service, collection, entity-, and navigation-bound actions', async () => {
      const api = useOData('MyService')
      const signal = new AbortController().signal

      await api.invoke('Demo.ResetCatalog', {
        parameters: { KeepAudit: true },
      }, { signal })
      await api.entitySet('Products').invoke('Demo.ReleaseAll')
      await api.entitySet('Products').invoke('Demo.ArchiveProduct', {
        key: { ID: 1, Active: true },
        parameters: { Reason: 'obsolete' },
      })
      await api.entitySet('Products').invoke('Demo.RepriceItem', {
        key: {
          kind: 'contained-entity',
          rootKey: 1,
          path: [{ navigationPath: ['Items'], key: { ID: 42 } }],
        },
        parameters: { Percent: 5 },
      })

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Demo.ResetCatalog',
        'POST',
        { body: { KeepAudit: true }, signal },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Products/Demo.ReleaseAll',
        'POST',
        { body: {} },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        3,
        expect.any(Function),
        '/api/odx/MyService/Products(ID=1,Active=true)/Demo.ArchiveProduct',
        'POST',
        { body: { Reason: 'obsolete' } },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        4,
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Items(ID=42)/Demo.RepriceItem',
        'POST',
        { body: { Percent: 5 } },
      )
    })

    it('preserves response metadata from service- and entity-bound actions', async () => {
      const api = useOData('MyService')
      const headers = { Prefer: 'return=minimal' }

      await api.invokeWithResponse('Demo.ResetCatalog', {
        parameters: { KeepAudit: true },
      }, { headers })
      const response = await api.entitySet('Products').invokeWithResponse(
        'Demo.ArchiveProduct',
        {
          key: { ID: 1, Active: true },
          parameters: { Reason: 'obsolete' },
        },
      )

      expect(response).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Demo.ResetCatalog',
        'POST',
        { body: { KeepAudit: true }, headers },
      )
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Products(ID=1,Active=true)/Demo.ArchiveProduct',
        'POST',
        { body: { Reason: 'obsolete' } },
      )
    })

    it('preserves response metadata from root and navigation deletes', async () => {
      const entitySet = useOData('RoutedService' as any).entitySet('Products')
      const headers = { 'If-Match': 'W/"entity-1"' }

      const rootResponse = await entitySet.removeWithResponse(1, { headers })
      const navigationResponse = await entitySet.removeNavigationWithResponse(
        { ID: 1, Locale: 'en' },
        ['Items'],
        { ItemID: 'A/B', Locale: 'en' },
      )

      expect(rootResponse).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(navigationResponse).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/routed-api/Products(1)',
        'DELETE',
        { headers },
      )
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ raw: expect.any(Function) }),
        `/api/odx/routed-api/Products(ID=1,Locale='en')/Items(ItemID='A%2FB',Locale='en')`,
        'DELETE',
        undefined,
      )
    })

    it('preserves metadata from a bodyless minimal create', async () => {
      const headers = { Prefer: 'return=minimal' }

      const response = await useOData('MyService').entitySet('Products').createWithResponse(
        { Name: 'Created' },
        { headers },
      )

      expect(response).toEqual({ entityId: 'Products(1)', etag: 'W/"entity-1"' })
      expect(core.$odataCreateWithResponse).toHaveBeenCalledWith(
        expect.objectContaining({ raw: expect.any(Function) }),
        '/api/odx/MyService/Products',
        { body: { Name: 'Created' }, headers },
      )
    })

    it('links and unlinks existing entities through safe OData references', async () => {
      const entitySet = useOData('RoutedService' as any).entitySet('Products')
      const headers = { 'If-Match': 'W/"product-1"' }

      await entitySet.linkNavigation(
        { ID: 1, Locale: 'en' },
        ['Categories'],
        'Categories',
        { ID: 'A/B' },
        { headers },
      )
      await entitySet.unlinkNavigation(
        { ID: 1, Locale: 'en' },
        ['Categories'],
        { ID: 'A/B' },
      )

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Categories/$ref',
        'POST',
        {
          body: { '@odata.id': 'Categories(ID=\'A%2FB\')' },
          headers,
        },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Categories(ID=\'A%2FB\')/$ref',
        'DELETE',
      )
    })

    it('preserves response metadata from relationship writes', async () => {
      const entitySet = useOData('RoutedService' as any).entitySet('Products')
      const headers = { 'If-Match': 'W/"product-1"' }

      const linked = await entitySet.linkNavigationWithResponse(
        { ID: 1, Locale: 'en' },
        ['Categories'],
        'Categories',
        { ID: 'A/B' },
        { headers },
      )
      const unlinked = await entitySet.unlinkNavigationWithResponse(
        { ID: 1, Locale: 'en' },
        ['Categories'],
        { ID: 'A/B' },
      )

      expect(linked).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(unlinked).toEqual({ data: { success: true }, etag: 'W/"entity-2"' })
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Categories/$ref',
        'POST',
        {
          body: { '@odata.id': 'Categories(ID=\'A%2FB\')' },
          headers,
        },
      )
      expect(core.$odataMutationWithResponse).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Categories(ID=\'A%2FB\')/$ref',
        'DELETE',
        undefined,
      )
    })

    it('posts enumeration parameters as exact JSON member-name strings', async () => {
      const api = useOData('MyService')
      const parameters = Object.freeze({ Priority: 'Urgent' })

      await api.entitySet('Products').invoke('Demo.SetPriority', {
        key: 1,
        parameters,
      })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Demo.SetPriority',
        'POST',
        { body: parameters },
      )
      const options = vi.mocked(core.$odata).mock.calls[0]?.[3]
      expect(JSON.stringify(options?.body)).toBe('{"Priority":"Urgent"}')
    })

    it('posts flags enumeration parameters as canonical JSON strings', async () => {
      const api = useOData('MyService')
      const parameters = Object.freeze({ Access: 'Read,Write' })

      await api.entitySet('Products').invoke('Demo.SetAccess', {
        key: 1,
        parameters,
      })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Demo.SetAccess',
        'POST',
        { body: parameters },
      )
      const options = vi.mocked(core.$odata).mock.calls[0]?.[3]
      expect(JSON.stringify(options?.body)).toBe('{"Access":"Read,Write"}')
    })

    it('posts structured action parameters as exact nested JSON objects', async () => {
      const api = useOData('MyService')
      const contact = Object.freeze({
        Name: 'Ada',
        Note: null,
        Role: 'Owner',
      })
      const parameters = Object.freeze({ Contact: contact })

      await api.entitySet('Products').invoke('Demo.SetContact', {
        key: 1,
        parameters,
      })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Demo.SetContact',
        'POST',
        { body: parameters },
      )
      const options = vi.mocked(core.$odata).mock.calls[0]?.[3]
      expect(options?.body).toBe(parameters)
      expect(JSON.stringify(options?.body))
        .toBe('{"Contact":{"Name":"Ada","Note":null,"Role":"Owner"}}')
    })

    it('invokes service, collection, and navigation-bound functions with GET', async () => {
      const api = useOData('MyService')
      const signal = new AbortController().signal

      await api.invokeFunction('Demo.ServiceDefaults', {
        parameters: { Locale: { type: 'Edm.String', value: 'en-US' } },
      }, { signal })
      await api.entitySet('Products').invokeFunction('Demo.CollectionDefaults')
      await api.entitySet('Products').invokeFunction('Demo.ItemDefaults', {
        key: 1,
        navigationPath: ['Items'],
        parameters: {
          Name: { type: 'Edm.String', value: 'Desk' },
          Quantity: { type: 'Edm.Int32', value: 2 },
        },
      })

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Demo.ServiceDefaults(Locale=\'en-US\')',
        'GET',
        { signal },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Products/Demo.CollectionDefaults()',
        'GET',
        undefined,
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        3,
        expect.any(Function),
        '/api/odx/MyService/Products(1)/Items/Demo.ItemDefaults(Name=\'Desk\',Quantity=2)',
        'GET',
        undefined,
      )
    })

    it('rejects unsafe or incomplete function bindings before transport', () => {
      const products = useOData('MyService').entitySet('Products')

      expect(() => products.invokeFunction('../Demo.Defaults')).toThrow('qualified name')
      expect(() => products.invokeFunction('Demo.Defaults', {
        navigationPath: ['Items'],
      })).toThrow('requires an entity key')
      expect(core.$odata).not.toHaveBeenCalled()
    })
    it('rejects unsafe or incomplete action bindings before transport', () => {
      const api = useOData('MyService')
      const products = api.entitySet('Products')

      expect(() => api.invoke('../Demo.Reset')).toThrow('qualified name')
      expect(() => api.invoke('Demo.Archive', { key: 1 })).toThrow('requires an entity set')
      expect(() => products.invoke('Demo.Reprice', {
        navigationPath: ['Items'],
      })).toThrow('requires an entity key')
      expect(() => products.invoke('Demo.Reprice', {
        key: 1,
        navigationPath: ['Items', '../Secret'],
      })).toThrow('navigation path')
      expect(core.$odata).not.toHaveBeenCalled()
    })
  })

  describe('atomic changesets', () => {
    it('posts root and navigation updates as one service-level batch', async () => {
      const signal = new AbortController().signal
      const responseBody = [
        '--batch_response',
        'Content-Type: multipart/mixed; boundary=changeset_response',
        '',
        '--changeset_response',
        'Content-Type: application/http',
        'Content-Transfer-Encoding: binary',
        '',
        'HTTP/1.1 204 No Content',
        '',
        '',
        '--changeset_response',
        'Content-Type: application/http',
        'Content-Transfer-Encoding: binary',
        '',
        'HTTP/1.1 200 OK',
        'Content-Type: application/json',
        '',
        '{"ID":2,"Name":"Updated supplier"}',
        '--changeset_response--',
        '--batch_response--',
        '',
      ].join('\r\n')
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: responseBody,
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const api = useOData('RoutedService' as any)
      expect(api.supportsAtomicActionChangesets).toBe(true)
      expect(api.supportsAtomicMediaChangesets).toBe(true)

      const responses = await api.changeSet([
        {
          kind: 'update',
          entitySet: 'Products',
          key: 1,
          body: { Name: 'Updated product' },
          headers: { 'If-Match': 'W/"product-1"' },
        },
        {
          kind: 'update-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['Supplier'],
          targetKey: 2,
          body: { Name: 'Updated supplier' },
          headers: { 'If-Match': 'W/"supplier-2"' },
        },
      ], { signal, headers: { 'X-Correlation-ID': 'test-1' } })

      expect(responses).toEqual([
        { status: 204, headers: {} },
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { ID: 2, Name: 'Updated supplier' },
        },
      ])
      expect(raw).toHaveBeenCalledOnce()
      const [url, options] = raw.mock.calls[0] as [string, any]
      expect(url).toBe('/api/odx/routed-api/$batch')
      expect(options).toMatchObject({
        method: 'POST',
        responseType: 'text',
        signal,
        headers: {
          'accept': 'multipart/mixed',
          'odata-version': '4.0',
          'x-correlation-id': 'test-1',
        },
      })
      expect(options.headers['content-type']).toMatch(/^multipart\/mixed; boundary=batch_/u)
      expect(options.body).toContain('PATCH Products(1) HTTP/1.1')
      expect(options.body).toContain('PATCH Products(1)/Supplier(2) HTTP/1.1')
      expect(options.body).toContain('If-Match: W/"product-1"')
      expect(options.body).toContain('If-Match: W/"supplier-2"')
    })

    it('preserves a named stream and sibling metadata in one atomic changeset', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          'Content-Transfer-Encoding: binary',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const media = Uint8Array.from([0, 255, 13, 10, 45, 45, 127])
      const api = useOData('RoutedService' as any)

      await api.changeSet([{
        kind: 'update',
        entitySet: 'Documents',
        key: 1,
        body: { FileName: 'manual.pdf', MediaType: 'application/pdf' },
        headers: { 'If-Match': 'W/"document-1"' },
      }, {
        kind: 'update-media',
        entitySet: 'Documents',
        key: 1,
        streamProperty: 'Content',
        contentType: 'application/pdf',
        body: media,
      }])

      const options = raw.mock.calls[0]?.[1] as any
      expect(options.body).toBeInstanceOf(Uint8Array)
      const body = options.body as Uint8Array
      const text = new TextDecoder().decode(body)
      expect(text).toContain('PATCH Documents(1) HTTP/1.1')
      expect(text).toContain('If-Match: W/"document-1"')
      expect(text).toContain('PUT Documents(1)/Content/$value HTTP/1.1')
      expect(text).toContain('Content-Type: application/pdf')
      expect(Array.from(body).some((_, offset) =>
        media.every((byte, index) => body[offset + index] === byte),
      )).toBe(true)
    })

    it('serializes service, collection, and entity actions in one atomic changeset', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          'Content-Transfer-Encoding: binary',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const api = useOData('RoutedService' as any)

      await api.changeSet([{
        kind: 'action',
        scope: 'service',
        action: 'Demo.Container/Recalculate',
      }, {
        kind: 'action',
        scope: 'collection',
        entitySet: 'Products',
        action: 'Demo.RepriceAll',
        parameters: { Percent: 5 },
      }, {
        kind: 'action',
        scope: 'entity',
        entitySet: 'Products',
        key: 1,
        action: 'Demo.ArchiveProduct',
        parameters: { Reason: 'Obsolete' },
        headers: { 'If-Match': 'W/"product-1"' },
      }])

      const options = raw.mock.calls[0]?.[1] as any
      expect(options.body).toContain('POST Demo.Container/Recalculate HTTP/1.1')
      expect(options.body).toContain('POST Products/Demo.RepriceAll HTTP/1.1')
      expect(options.body).toContain('POST Products(1)/Demo.ArchiveProduct HTTP/1.1')
      expect(options.body).toContain('{"Percent":5}')
      expect(options.body).toContain('{"Reason":"Obsolete"}')
      expect(options.body).toContain('If-Match: W/"product-1"')
    })

    it('keeps independent action changeset outcomes in one batch', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
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
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const api = useOData('RoutedService' as any)
      expect(api.supportsBatchChangeSets).toBe(true)

      const results = await api.batchChangeSets!([[{
        kind: 'action',
        scope: 'entity',
        entitySet: 'Products',
        key: 1,
        action: 'Demo.ArchiveProduct',
        headers: { 'If-Match': 'W/"product-1"' },
      }], [{
        kind: 'action',
        scope: 'entity',
        entitySet: 'Products',
        key: 2,
        action: 'Demo.ArchiveProduct',
        headers: { 'If-Match': 'W/"product-2"' },
      }]])

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
      const body = raw.mock.calls[0]?.[1].body as string
      expect(body.match(/Content-Type: multipart\/mixed; boundary=changeset_/gu))
        .toHaveLength(2)
      expect(body).toContain('POST Products(1)/Demo.ArchiveProduct HTTP/1.1')
      expect(body).toContain('POST Products(2)/Demo.ArchiveProduct HTTP/1.1')
    })

    it('rejects an independent batch response count mismatch', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const api = useOData('RoutedService' as any)

      await expect(api.batchChangeSets!([[{
        kind: 'update',
        entitySet: 'Products',
        key: 1,
        body: { Active: true },
      }], [{
        kind: 'update',
        entitySet: 'Products',
        key: 2,
        body: { Active: true },
      }]])).rejects.toThrow('count does not match')
    })

    it('serializes navigation creates and deletes in one atomic changeset', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: multipart/mixed; boundary=changeset_response',
          '',
          '--changeset_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '',
          '--changeset_response--',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('RoutedService' as any).changeSet([
        {
          kind: 'create-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['Items'],
          body: { Product: 'Desk' },
        },
        {
          kind: 'delete-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['Items'],
          targetKey: { ItemID: 'A/B' },
          headers: { 'If-Match': 'W/"item-1"' },
        },
      ])

      const body = raw.mock.calls[0]?.[1].body as string
      expect(body).toContain('POST Products(1)/Items HTTP/1.1')
      expect(body).toContain('{"Product":"Desk"}')
      expect(body).toContain('DELETE Products(1)/Items(ItemID=\'A%2FB\') HTTP/1.1')
      expect(body).toContain('If-Match: W/"item-1"')
      const deletePart = body.slice(body.indexOf('DELETE Products(1)/Items'))
      expect(deletePart).not.toContain('Content-Type: application/json')
      expect(deletePart).not.toContain('{}')
    })

    it('serializes relationship links without deleting target entities', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('RoutedService' as any).changeSet([{
        kind: 'link-navigation',
        entitySet: 'Products',
        key: 1,
        navigationPath: ['Categories'],
        targetEntitySet: 'Categories',
        targetKey: { ID: 'A/B' },
      }, {
        kind: 'unlink-navigation',
        entitySet: 'Products',
        key: 1,
        navigationPath: ['Categories'],
        targetKey: { ID: 'Old' },
        headers: { 'If-Match': 'W/"product-1"' },
      }])

      const body = raw.mock.calls[0]?.[1].body as string
      expect(body).toContain('POST Products(1)/Categories/$ref HTTP/1.1')
      expect(body).toContain('{"@odata.id":"Categories(ID=\'A%2FB\')"}')
      expect(body).toContain('DELETE Products(1)/Categories(ID=\'Old\')/$ref HTTP/1.1')
      expect(body).toContain('If-Match: W/"product-1"')
    })

    it('serializes contained navigation sources in atomic changesets', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('RoutedService' as any).changeSet([{
        kind: 'create-navigation',
        entitySet: 'Products',
        key: {
          kind: 'contained-entity',
          rootKey: 1,
          path: [{ navigationPath: ['Items'], key: 2 }],
        },
        navigationPath: ['Tags'],
        body: { Name: 'Priority' },
      }])

      const body = raw.mock.calls[0]?.[1].body as string
      expect(body).toContain('POST Products(1)/Items(2)/Tags HTTP/1.1')
    })

    it('serializes contained media updates in atomic changesets', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('RoutedService' as any).changeSet([{
        kind: 'update-media',
        entitySet: 'Products',
        key: {
          kind: 'contained-entity',
          rootKey: 1,
          path: [{ navigationPath: ['Attachments'], key: 2 }],
        },
        body: Uint8Array.from([1, 2]),
        contentType: 'application/octet-stream',
        streamProperty: 'Content',
      }])

      const body = raw.mock.calls[0]?.[1].body as Uint8Array
      const text = new TextDecoder().decode(body)
      expect(text).toContain(
        'PUT Products(1)/Attachments(2)/Content/$value HTTP/1.1',
      )
      expect(text).toContain('Content-Type: application/octet-stream')
    })

    it('uses the configured direct service root for batch requests', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('DirectService' as any).changeSet([
        { kind: 'update', entitySet: 'Products', key: 'A/B', body: { Active: true } },
      ])

      expect(raw).toHaveBeenCalledWith(
        'https://external.com/odata/$batch',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(raw.mock.calls[0]?.[1].body).toContain('PATCH Products(\'A%2FB\') HTTP/1.1')
    })

    it('rejects unsafe entity and navigation path segments before transport', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      const api = useOData('MyService')

      await expect(api.changeSet([
        { kind: 'update', entitySet: '../Products', key: 1, body: {} },
      ])).rejects.toThrow('valid identifier')
      await expect(api.changeSet([
        {
          kind: 'update-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['../Supplier'],
          body: {},
        },
      ])).rejects.toThrow('valid identifier segments')
      expect(raw).not.toHaveBeenCalled()
    })
  })

  describe('proxy Behavior', () => {
    it('supports dot notation for entity sets', () => {
      const api = useOData('MyService')
      const result = (api as any).Products.list()
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('supports dot notation for services from root useOData()', () => {
      const odx = useOData()
      const result = (odx as any).MyService.Products.list()
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('ignores internal symbols and properties in proxy', () => {
      const odx = useOData() as any
      expect(odx.toJSON).toBeUndefined()
      expect(odx.then).toBeUndefined()

      const service = useOData('Svc') as any
      expect(service.toJSON).toBeUndefined()
      expect(service.then).toBeUndefined()
    })
  })
})
