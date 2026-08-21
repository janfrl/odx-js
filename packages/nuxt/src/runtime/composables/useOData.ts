import type { ODataActionInvocation, ODataActionResponse, ODataAsyncDataPromise, ODataAtomicMutation, ODataBatchChangeSetResult, ODataChangeSetMethod, ODataChangeSetRequest, ODataChangeSetResponse, ODataCollectionPage, ODataContinuation, ODataCreateResponse, ODataEntityResponse, ODataFunctionInvocation, ODataKey, ODataMediaCreateOptions, ODataMediaCreateResponse, ODataMediaMutationResponse, ODataMediaRequestOptions, ODataMediaResponse, ODataMediaUpdateOptions, ODataMutationResponse, ODataNavigationSource, ODataNavigationUpdate, ODataPublicConfig, ODataQuery, ODataRequestOptions, ODataRuntimeEntitySet, ODataRuntimeService, ODataServiceRegistry, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRequestFetch, useRuntimeConfig } from '#imports'
import {
  $odata,
  $odataCreateWithResponse,
  $odataMutationWithResponse,
  $odataPage,
  $odataWithResponse,
  createODataContinuationPath,
  createODataEntityPath,
  createODataEntityReference,
  createODataMediaPath,
  createODataNavigationRootReference,
  createODataNavigationSourcePath,
  flattenOData,
  formatODataFunctionCall,
  formatODataKey,
  formatODataNavigationPath,
  joinODataPath,
  mergeHeaders,
  parseODataBatchChangeSetsResponse,
  parseODataChangeSetResponse,
  serializeODataBatchChangeSets,
  serializeODataChangeSet,
  stringifyQuery,
  toODataCollectionPage,
  validateODataIdentifier,
  validateODataQualifiedName,
} from '@me-tools/odx-core'
import { computed, isReactive, isRef, toValue } from 'vue'
import { useODataBasePath } from './useODataBasePath'

interface ODataFetchClient {
  <T>(path: string, options?: any): Promise<T>
  raw: <T>(path: string, options?: any) => Promise<{
    _data?: T
    headers: { get: (name: string) => string | null }
  }>
}

const RE_HEADER_NEWLINE = /[\r\n]/u
const RE_MEDIA_TYPE = /^[^\s/;]+\/[^\s/;]+(?:\s*;[^\r\n]+)?$/u

/**
 * Composable for interacting with OData services.
 * Provides autocomplete for registered services and their entity sets via dot notation
 * or standard method calls.
 */
export function useOData(): ODataServiceRegistry
export function useOData<T extends RegisteredServiceNames>(service: T): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataRuntimeService
export function useOData(service?: string): any {
  // Server-side imperative reads must retain the active Nitro request context
  // so relative proxy paths resolve inside the current Nuxt application.
  const client = (import.meta.server ? useRequestFetch() : globalThis.$fetch) as unknown as ODataFetchClient

  const mediaType = (value: string): string => {
    const normalized = value.trim()
    if (
      normalized.length === 0
      || RE_HEADER_NEWLINE.test(normalized)
      || !RE_MEDIA_TYPE.test(normalized)
    ) {
      throw new TypeError('An OData media update requires a valid content type.')
    }
    return normalized
  }
  const mediaBody = (body: ArrayBuffer | Uint8Array): ArrayBuffer | Uint8Array => {
    if (!(body instanceof ArrayBuffer) && !(body instanceof Uint8Array))
      throw new TypeError('An OData media mutation requires an ArrayBuffer or Uint8Array body.')
    return body
  }

  const createJsonReadOptions = (options?: unknown): Record<string, any> => {
    const requestOptions = (options ?? {}) as Record<string, any>
    const headers = requestOptions.headers
    const mergedHeaders = isRef(headers) || isReactive(headers) || typeof headers === 'function'
      ? computed(() => mergeHeaders(
          { accept: 'application/json' },
          toValue(headers) as HeadersInit | undefined,
        ))
      : mergeHeaders(
          { accept: 'application/json' },
          headers as HeadersInit | undefined,
        )
    return {
      ...requestOptions,
      headers: mergedHeaders,
    }
  }

  const createPageReadKey = (path: string, query: Readonly<Record<string, string>>): string => {
    const entries = Object.entries(query).sort(([left], [right]) => left.localeCompare(right))
    return `odx-page:${path}:${JSON.stringify(entries)}`
  }

  const resolveServiceRoute = (serviceName: string): string => {
    const config = useRuntimeConfig()
    const publicConfig = config.public.odata as unknown as ODataPublicConfig
    const serviceConfig = publicConfig?.services?.find(s => s.name === serviceName)
    return serviceConfig?.route || serviceName
  }

  const resolveServicePath = (serviceName: string): string => {
    const basePath = useODataBasePath(serviceName)
    if (basePath.startsWith('http'))
      return joinODataPath(basePath)
    return joinODataPath(basePath, resolveServiceRoute(serviceName))
  }

  const createMethods = <TModel = unknown>(serviceName: string, entitySet?: string): ODataRuntimeEntitySet<TModel> => {
    const servicePath = resolveServicePath(serviceName)
    const fullPath = entitySet
      ? joinODataPath(
          servicePath,
          validateODataIdentifier(entitySet, 'OData entity set'),
        )
      : servicePath
    const navigationSourcePath = (source: ODataNavigationSource): string => {
      if (entitySet === undefined) {
        throw new TypeError(
          'An OData navigation operation requires an entity set.',
        )
      }
      return joinODataPath(
        servicePath,
        createODataNavigationSourcePath(entitySet, source),
      )
    }
    const mediaPath = (key: ODataNavigationSource, streamProperty?: string): string => {
      if (entitySet === undefined)
        throw new TypeError('An OData media operation requires an entity set.')
      return joinODataPath(servicePath, createODataMediaPath(entitySet, key, streamProperty))
    }
    const mediaSlug = (value: string | undefined): string | undefined => {
      if (value === undefined)
        return undefined
      const normalized = value.trim()
      if (normalized.length === 0 || RE_HEADER_NEWLINE.test(normalized))
        throw new TypeError('An OData media create requires a valid slug.')
      return normalized
    }
    return {
      supportsCollectionPages: true,
      supportsContainedNavigationSources: true,
      supportsNavigationRootReferences: true,
      supportsNavigationReferences: true,
      supportsEntityResponses: true,
      supportsOptimisticConcurrency: true,
      supportsCreateResponses: true,
      supportsActionResponses: true,
      supportsMerge: true,
      supportsMediaStreams: true,
      supportsContinuations: true,
      createNavigationRootReference: (
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
      ): string => {
        if (entitySet === undefined) {
          throw new TypeError(
            'An OData navigation root reference requires an entity set.',
          )
        }
        return createODataNavigationRootReference(
          entitySet,
          source,
          navigationPath,
        )
      },
      list: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel[]> => {
        const requestOptions = createJsonReadOptions(options)
        return useFetch(fullPath, {
          ...requestOptions,
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel[]>
      },
      listPage: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<ODataCollectionPage<TModel>> => {
        const requestOptions = createJsonReadOptions(options)
        const requestQuery = stringifyQuery(query || {})
        return useFetch(fullPath, {
          ...requestOptions,
          key: requestOptions.key ?? createPageReadKey(fullPath, requestQuery),
          query: requestQuery,
          transform: (data: any) => toODataCollectionPage<TModel>(data),
        }) as unknown as ODataAsyncDataPromise<ODataCollectionPage<TModel>>
      },
      fetchList: (
        query?: ODataQuery<TModel>,
        options?: ODataRequestOptions,
      ): Promise<TModel[]> => $odata<TModel[]>(client, fullPath, 'GET', {
        ...(options as any),
        query: stringifyQuery(query || {}),
      }),
      fetchPage: async (
        query?: ODataQuery<TModel>,
        options?: ODataRequestOptions,
      ): Promise<ODataCollectionPage<TModel>> => {
        return $odataPage<TModel>(client, fullPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },
      listNextPage: (
        continuation: ODataContinuation,
        options?: unknown,
      ): ODataAsyncDataPromise<ODataCollectionPage<TModel>> => {
        const requestOptions = createJsonReadOptions(options)
        const continuationPath = createODataContinuationPath(fullPath, continuation)
        return useFetch(continuationPath, {
          ...requestOptions,
          key: requestOptions.key ?? `odx-page:${continuationPath}`,
          transform: (data: any) => toODataCollectionPage<TModel>(data),
        }) as unknown as ODataAsyncDataPromise<ODataCollectionPage<TModel>>
      },
      fetchNextPage: (
        continuation: ODataContinuation,
        options?: ODataRequestOptions,
      ): Promise<ODataCollectionPage<TModel>> => {
        const continuationPath = createODataContinuationPath(fullPath, continuation)
        return $odataPage<TModel>(client, continuationPath, options as any)
      },
      listNavigationPage: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        query?: ODataQuery<TResult>,
        options?: unknown,
      ): ODataAsyncDataPromise<ODataCollectionPage<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const requestOptions = createJsonReadOptions(options)
        const requestQuery = stringifyQuery(query || {})
        return useFetch(navigationUrl, {
          ...requestOptions,
          key: requestOptions.key ?? createPageReadKey(navigationUrl, requestQuery),
          query: requestQuery,
          transform: (data: any) => toODataCollectionPage<TResult>(data),
        }) as unknown as ODataAsyncDataPromise<ODataCollectionPage<TResult>>
      },
      fetchNavigationPage: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        query?: ODataQuery<TResult>,
        options?: ODataRequestOptions,
      ): Promise<ODataCollectionPage<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        return $odataPage<TResult>(client, navigationUrl, {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },
      listNavigationNextPage: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        continuation: ODataContinuation,
        options?: unknown,
      ): ODataAsyncDataPromise<ODataCollectionPage<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const continuationPath = createODataContinuationPath(navigationUrl, continuation)
        const requestOptions = createJsonReadOptions(options)
        return useFetch(continuationPath, {
          ...requestOptions,
          key: requestOptions.key ?? `odx-page:${continuationPath}`,
          transform: (data: any) => toODataCollectionPage<TResult>(data),
        }) as unknown as ODataAsyncDataPromise<ODataCollectionPage<TResult>>
      },
      fetchNavigationNextPage: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        continuation: ODataContinuation,
        options?: ODataRequestOptions,
      ): Promise<ODataCollectionPage<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const continuationPath = createODataContinuationPath(navigationUrl, continuation)
        return $odataPage<TResult>(client, continuationPath, options as any)
      },

      listNavigation: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        query?: ODataQuery<TResult>,
        options?: unknown,
      ): ODataAsyncDataPromise<TResult[]> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const requestOptions = createJsonReadOptions(options)
        return useFetch(navigationUrl, {
          ...requestOptions,
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TResult[]>
      },

      fetchNavigationList: (
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        query?: ODataQuery<TModel>,
        options?: ODataRequestOptions,
      ): Promise<TModel[]> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        return $odata<TModel[]>(client, navigationUrl, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      fetchOne: (
        key: ODataKey,
        query?: ODataQuery<TModel>,
        options?: ODataRequestOptions,
      ): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odata<TModel>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      fetchOneWithResponse: (
        key: ODataKey,
        query?: ODataQuery<TModel>,
        options?: ODataRequestOptions,
      ): Promise<ODataEntityResponse<TModel>> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odataWithResponse<TModel>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      createMedia: async (
        body: ArrayBuffer | Uint8Array,
        options: ODataMediaCreateOptions,
      ): Promise<ODataMediaCreateResponse<TModel>> => {
        if (entitySet === undefined)
          throw new TypeError('An OData media create requires an entity set.')
        const { contentType, slug, ...requestOptions } = options
        const normalizedSlug = mediaSlug(slug)
        const response = await client.raw<TModel>(fullPath, {
          ...(requestOptions as any),
          body: mediaBody(body),
          headers: mergeHeaders(
            requestOptions.headers,
            {
              'content-type': mediaType(contentType),
              'prefer': 'return=representation',
              ...(normalizedSlug === undefined ? {} : { slug: normalizedSlug }),
            },
          ),
          method: 'POST',
          responseType: 'json',
        })
        const etag = response.headers.get('etag') ?? undefined
        return {
          ...(response._data === undefined ? {} : { data: flattenOData(response._data) as TModel }),
          ...(etag === undefined ? {} : { etag }),
        }
      },

      createNavigationMedia: async <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        body: ArrayBuffer | Uint8Array,
        options: ODataMediaCreateOptions,
      ): Promise<ODataMediaCreateResponse<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const { contentType, slug, ...requestOptions } = options
        const normalizedSlug = mediaSlug(slug)
        const response = await client.raw<TResult>(navigationUrl, {
          ...(requestOptions as any),
          body: mediaBody(body),
          headers: mergeHeaders(
            requestOptions.headers,
            {
              'content-type': mediaType(contentType),
              'prefer': 'return=representation',
              ...(normalizedSlug === undefined ? {} : { slug: normalizedSlug }),
            },
          ),
          method: 'POST',
          responseType: 'json',
        })
        const etag = response.headers.get('etag') ?? undefined
        return {
          ...(response._data === undefined ? {} : { data: flattenOData(response._data) as TResult }),
          ...(etag === undefined ? {} : { etag }),
        }
      },

      fetchMedia: async (
        key: ODataNavigationSource,
        options?: ODataMediaRequestOptions,
      ): Promise<ODataMediaResponse> => {
        const { streamProperty, ...requestOptions } = options ?? {}
        const response = await client.raw<ArrayBuffer>(mediaPath(key, streamProperty), {
          ...(requestOptions as any),
          headers: mergeHeaders(
            { accept: 'application/octet-stream' },
            requestOptions.headers,
          ),
          method: 'GET',
          responseType: 'arrayBuffer',
        })
        if (!(response._data instanceof ArrayBuffer))
          throw new TypeError('ODX returned an invalid media response body.')
        const contentDisposition = response.headers.get('content-disposition') ?? undefined
        const contentType = response.headers.get('content-type') ?? undefined
        const etag = response.headers.get('etag') ?? undefined
        return {
          data: response._data,
          ...(contentDisposition === undefined ? {} : { contentDisposition }),
          ...(contentType === undefined ? {} : { contentType }),
          ...(etag === undefined ? {} : { etag }),
        }
      },

      updateMedia: async (
        key: ODataNavigationSource,
        body: ArrayBuffer | Uint8Array,
        options: ODataMediaUpdateOptions,
      ): Promise<ODataMediaMutationResponse> => {
        const { contentType, streamProperty, ...requestOptions } = options
        const response = await client.raw<unknown>(mediaPath(key, streamProperty), {
          ...(requestOptions as any),
          body: mediaBody(body),
          headers: mergeHeaders(
            requestOptions.headers,
            { 'content-type': mediaType(contentType) },
          ),
          method: 'PUT',
          responseType: 'arrayBuffer',
        })
        const etag = response.headers.get('etag') ?? undefined
        return etag === undefined ? {} : { etag }
      },

      get: (key: ODataKey, query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        const requestOptions = createJsonReadOptions(options)
        return useFetch(itemPath, {
          ...requestOptions,
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel>
      },

      create: (body: Partial<TModel>, options?: ODataRequestOptions): Promise<TModel> =>
        $odata<TModel>(client, fullPath, 'POST', {
          ...(options as any),
          body,
        }),

      createWithResponse: (
        body: Partial<TModel>,
        options?: ODataRequestOptions,
      ): Promise<ODataCreateResponse<TModel>> =>
        $odataCreateWithResponse<TModel>(client, fullPath, {
          ...(options as any),
          body,
        }),

      createNavigation: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        body: Readonly<Record<string, unknown>>,
        options?: ODataRequestOptions,
      ): Promise<TResult> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        return $odata<TResult>(client, navigationUrl, 'POST', {
          ...(options as any),
          body,
        })
      },
      createNavigationWithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        body: Readonly<Record<string, unknown>>,
        options?: ODataRequestOptions,
      ): Promise<ODataCreateResponse<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        return $odataCreateWithResponse<TResult>(client, navigationUrl, {
          ...(options as any),
          body,
        })
      },
      updateNavigation: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        update: ODataNavigationUpdate,
        options?: ODataRequestOptions,
      ): Promise<TResult> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const targetUrl = update.targetKey === undefined
          ? navigationUrl
          : `${navigationUrl}(${formatODataKey(update.targetKey)})`
        return $odata<TResult>(client, targetUrl, 'PATCH', {
          ...(options as any),
          body: update.body,
        })
      },
      updateNavigationWithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        update: ODataNavigationUpdate,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const targetUrl = update.targetKey === undefined
          ? navigationUrl
          : `${navigationUrl}(${formatODataKey(update.targetKey)})`
        return $odataMutationWithResponse<TResult>(client, targetUrl, 'PATCH', {
          ...(options as any),
          body: update.body,
        })
      },
      removeNavigation: (
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<unknown> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const targetUrl = `${navigationUrl}(${formatODataKey(targetKey)})`
        return options === undefined
          ? $odata<unknown>(client, targetUrl, 'DELETE')
          : $odata<unknown>(client, targetUrl, 'DELETE', options)
      },
      linkNavigation: (
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetEntitySet: string,
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<unknown> => {
        const referenceUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
          '$ref',
        )
        return $odata<unknown>(client, referenceUrl, 'POST', {
          ...(options as any),
          body: createODataEntityReference(targetEntitySet, targetKey),
        })
      },
      unlinkNavigation: (
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<unknown> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const referenceUrl = joinODataPath(
          `${navigationUrl}(${formatODataKey(targetKey)})`,
          '$ref',
        )
        return options === undefined
          ? $odata<unknown>(client, referenceUrl, 'DELETE')
          : $odata<unknown>(client, referenceUrl, 'DELETE', options)
      },
      update: (key: ODataKey, body: Partial<TModel>, options?: ODataRequestOptions): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odata<TModel>(client, itemPath, 'PATCH', {
          ...(options as any),
          body,
        })
      },

      updateWithResponse: (
        key: ODataKey,
        body: Partial<TModel>,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TModel>> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odataMutationWithResponse<TModel>(client, itemPath, 'PATCH', {
          ...(options as any),
          body,
        })
      },

      merge: (key: ODataKey, body: Partial<TModel>, options?: ODataRequestOptions): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odata<TModel>(client, itemPath, 'MERGE', {
          ...(options as any),
          body,
        })
      },

      mergeWithResponse: (
        key: ODataKey,
        body: Partial<TModel>,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TModel>> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odataMutationWithResponse<TModel>(client, itemPath, 'MERGE', {
          ...(options as any),
          body,
        })
      },

      remove: (key: ODataKey, options?: ODataRequestOptions): Promise<unknown> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return options === undefined
          ? $odata<unknown>(client, itemPath, 'DELETE')
          : $odata<unknown>(client, itemPath, 'DELETE', options)
      },

      invokeFunction: <TResult = unknown>(
        functionName: string,
        invocation: ODataFunctionInvocation = {},
        options?: ODataRequestOptions,
      ): Promise<TResult> => {
        if (invocation.navigationPath !== undefined && invocation.key === undefined) {
          throw new TypeError(
            'An OData navigation-bound function requires an entity key.',
          )
        }
        const entityPath = invocation.key === undefined
          ? fullPath
          : `${fullPath}(${formatODataKey(invocation.key)})`
        const bindingPath = invocation.navigationPath === undefined
          ? entityPath
          : joinODataPath(
              entityPath,
              formatODataNavigationPath(invocation.navigationPath),
            )
        return $odata<TResult>(
          client,
          joinODataPath(
            bindingPath,
            formatODataFunctionCall(
              functionName,
              invocation.parameters,
            ),
          ),
          'GET',
          options,
        )
      },
      invoke: <TResult = unknown, TParameters = Record<string, unknown>>(
        action: string,
        invocation: ODataActionInvocation<TParameters> = {},
        options?: ODataRequestOptions,
      ): Promise<TResult> => {
        validateODataQualifiedName(action, 'OData action')
        if (invocation.navigationPath !== undefined && invocation.key === undefined) {
          throw new TypeError(
            'An OData navigation-bound action requires an entity key.',
          )
        }
        const entityPath = invocation.key === undefined
          ? fullPath
          : navigationSourcePath(invocation.key)
        const bindingPath = invocation.navigationPath === undefined
          ? entityPath
          : joinODataPath(
              entityPath,
              formatODataNavigationPath(invocation.navigationPath),
            )
        return $odata<TResult>(
          client,
          joinODataPath(bindingPath, action),
          'POST',
          {
            ...(options as any),
            body: invocation.parameters ?? {},
          },
        )
      },
      invokeWithResponse: <TResult = unknown, TParameters = Record<string, unknown>>(
        action: string,
        invocation: ODataActionInvocation<TParameters> = {},
        options?: ODataRequestOptions,
      ): Promise<ODataActionResponse<TResult>> => {
        validateODataQualifiedName(action, 'OData action')
        if (invocation.navigationPath !== undefined && invocation.key === undefined) {
          throw new TypeError(
            'An OData navigation-bound action requires an entity key.',
          )
        }
        const entityPath = invocation.key === undefined
          ? fullPath
          : navigationSourcePath(invocation.key)
        const bindingPath = invocation.navigationPath === undefined
          ? entityPath
          : joinODataPath(
              entityPath,
              formatODataNavigationPath(invocation.navigationPath),
            )
        return $odataMutationWithResponse<TResult>(
          client,
          joinODataPath(bindingPath, action),
          'POST',
          {
            ...(options as any),
            body: invocation.parameters ?? {},
          },
        )
      },
    }
  }

  const atomicMutationRequest = (
    mutation: ODataAtomicMutation,
  ): ODataChangeSetRequest => {
    if (mutation.kind === 'update-media') {
      const headers = Object.fromEntries([
        ...Object.entries(mutation.headers ?? {}).filter(([name]) =>
          name.toLowerCase() !== 'content-type'),
        ['Content-Type', mediaType(mutation.contentType)],
      ])
      return Object.freeze({
        method: 'PUT' as const,
        path: createODataMediaPath(
          mutation.entitySet,
          mutation.key,
          mutation.streamProperty,
        ),
        headers: Object.freeze(headers),
        body: mediaBody(mutation.body),
      })
    }
    if (mutation.kind === 'action') {
      const bindingPath = mutation.scope === 'service'
        ? undefined
        : mutation.scope === 'collection'
          ? mutation.entitySet
          : createODataNavigationSourcePath(mutation.entitySet, mutation.key)
      return Object.freeze({
        method: 'POST' as const,
        path: bindingPath === undefined
          ? mutation.action
          : joinODataPath(bindingPath, mutation.action),
        headers: mutation.headers,
        body: mutation.parameters ?? {},
      })
    }
    const entityPath = mutation.kind === 'update'
      ? createODataEntityPath(mutation.entitySet, mutation.key)
      : createODataNavigationSourcePath(mutation.entitySet, mutation.key)
    const path = mutation.kind === 'update'
      ? entityPath
      : (() => {
          const navigationPath = joinODataPath(entityPath, formatODataNavigationPath(mutation.navigationPath))
          if (mutation.kind === 'link-navigation')
            return joinODataPath(navigationPath, '$ref')
          if (mutation.kind === 'unlink-navigation') {
            return joinODataPath(
              `${navigationPath}(${formatODataKey(mutation.targetKey)})`,
              '$ref',
            )
          }
          return 'targetKey' in mutation && mutation.targetKey !== undefined
            ? `${navigationPath}(${formatODataKey(mutation.targetKey)})`
            : navigationPath
        })()
    const method: ODataChangeSetMethod = mutation.kind === 'create-navigation'
      || mutation.kind === 'link-navigation'
      ? 'POST'
      : mutation.kind === 'delete-navigation' || mutation.kind === 'unlink-navigation'
        ? 'DELETE'
        : 'PATCH'
    return Object.freeze({
      method,
      path,
      headers: mutation.headers,
      ...(mutation.kind === 'link-navigation'
        ? { body: createODataEntityReference(mutation.targetEntitySet, mutation.targetKey) }
        : 'body' in mutation ? { body: mutation.body } : {}),
    })
  }

  const postChangeSetBatch = async <T>(
    serviceName: string,
    payload: { readonly body: string | Uint8Array, readonly contentType: string },
    options: ODataRequestOptions,
    parse: (body: string, contentType: string) => T,
  ): Promise<T> => {
    const response = await client.raw<string>(
      joinODataPath(resolveServicePath(serviceName), '$batch'),
      {
        ...options,
        method: 'POST',
        headers: mergeHeaders(options.headers, {
          'Accept': 'multipart/mixed',
          'Content-Type': payload.contentType,
          'OData-Version': '4.0',
        }),
        body: payload.body,
        responseType: 'text',
      },
    )
    const contentType = response.headers.get('content-type') ?? ''
    if (typeof response._data !== 'string') {
      throw new TypeError('The OData batch response body must be text.')
    }
    return parse(response._data, contentType)
  }

  const createChangeSet = (serviceName: string) => async (
    mutations: readonly ODataAtomicMutation[],
    options: ODataRequestOptions = {},
  ): Promise<readonly ODataChangeSetResponse[]> => {
    const payload = serializeODataChangeSet(mutations.map(atomicMutationRequest))
    return postChangeSetBatch(
      serviceName,
      payload,
      options,
      parseODataChangeSetResponse,
    )
  }

  const createBatchChangeSets = (serviceName: string) => async (
    changeSets: readonly (readonly ODataAtomicMutation[])[],
    options: ODataRequestOptions = {},
  ): Promise<readonly ODataBatchChangeSetResult[]> => {
    const payload = serializeODataBatchChangeSets(changeSets.map(changeSet =>
      changeSet.map(atomicMutationRequest),
    ))
    const results = await postChangeSetBatch(
      serviceName,
      payload,
      options,
      parseODataBatchChangeSetsResponse,
    )
    if (results.length !== changeSets.length) {
      throw new TypeError(
        'The OData batch response count does not match the requested changesets.',
      )
    }
    return results
  }

  const createServiceProxy = (serviceName: string): ODataRuntimeService => {
    const rootMethods = Object.assign(createMethods(serviceName), {
      supportsAtomicActionChangesets: true as const,
      supportsAtomicMediaChangesets: true as const,
      supportsActionResponses: true as const,
      supportsBatchChangeSets: true as const,
      batchChangeSets: createBatchChangeSets(serviceName),
      changeSet: createChangeSet(serviceName),
    })
    return new Proxy(rootMethods as any, {
      get(target, prop) {
        if (prop === 'entitySet') {
          return (name: string) => createMethods(serviceName, name)
        }

        if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
          return undefined
        }

        if (prop in target) {
          return target[prop]
        }

        return createMethods(serviceName, prop as string)
      },
    })
  }

  // Handle useOData('MyService')
  if (service) {
    return createServiceProxy(service)
  }

  // Handle useOData().MyService.MyEntitySet
  return new Proxy({} as any, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
        return target[prop]
      }
      return createServiceProxy(prop as string)
    },
  })
}
