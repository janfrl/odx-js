import type { ODataActionInvocation, ODataActionResponse, ODataAsyncDataPromise, ODataAtomicMutation, ODataBatchChangeSetResult, ODataChangeSetMethod, ODataChangeSetRequest, ODataChangeSetResponse, ODataCollectionPage, ODataContainedEntitySource, ODataContinuation, ODataCreateResponse, ODataEntityResponse, ODataFunctionInvocation, ODataKey, ODataMediaCreateOptions, ODataMediaCreateResponse, ODataMediaMutationResponse, ODataMediaRequestOptions, ODataMediaResponse, ODataMediaUpdateOptions, ODataMutationResponse, ODataNavigationEntityRead, ODataNavigationSource, ODataNavigationUpdate, ODataPublicConfig, ODataQuery, ODataRequestOptions, ODataRuntimeEntitySet, ODataRuntimeService, ODataServiceRegistry, ODataV2AtomicMutation, ODataV2FunctionImportInvocation, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRequestEvent, useRequestFetch, useRuntimeConfig } from '#imports'
import {
  $odata,
  $odataActionWithResponse,
  $odataCreateMedia,
  $odataCreateWithResponse,
  $odataFetchMedia,
  $odataMutationWithResponse,
  $odataPage,
  $odataUpdateMedia,
  $odataWithResponse,
  createODataContinuationPath,
  createODataEntityPath,
  createODataEntityReference,
  createODataMediaPath,
  createODataNavigationRootReference,
  createODataNavigationSourcePath,
  createODataV2EntityReference,
  createODataV2NavigationReferencePath,
  flattenOData,
  formatODataFunctionCall,
  formatODataKey,
  formatODataNavigationPath,
  formatODataV2FunctionImportParameters,
  joinODataPath,
  mergeHeaders,
  parseODataBatchChangeSetsResponse,
  parseODataChangeSetResponse,
  serializeODataBatchChangeSets,
  serializeODataChangeSet,
  stringifyQuery,
  toODataCollectionPage,
  validateODataIdentifier,
  validateODataMediaBody,
  validateODataMediaType,
  validateODataQualifiedName,
} from '@me-tools/odx-core'
import { createFetch } from 'ofetch'
import { computed, isReactive, isRef, toValue } from 'vue'
import { useODataBasePath } from './useODataBasePath'

interface ODataFetchClient {
  <T>(path: string, options?: any): Promise<T>
  raw: <T>(path: string, options?: any) => Promise<{
    _data?: T
    headers: { get: (name: string) => string | null }
  }>
}

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
  const requestFetchComposable = useRequestFetch as unknown as () => ODataFetchClient
  const requestFetch = import.meta.server
    ? requestFetchComposable()
    : globalThis.$fetch as unknown as ODataFetchClient
  // Nitro's context-aware event $fetch intentionally exposes only the parsed
  // body API. Rebuild it on event.fetch when response metadata is required so
  // ofetch's raw API and the active request context remain available together.
  type ContextFetch = (request: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  const requestEvent = useRequestEvent as unknown as () => { fetch?: ContextFetch } | undefined
  const eventFetch = import.meta.server ? requestEvent()?.fetch : undefined
  const fetchHeaders = (headers: HeadersInit): Record<string, string> => {
    const normalized: Record<string, string> = {}
    new Headers(headers).forEach((value, name) => {
      normalized[name] = value
    })
    return normalized
  }
  const rawFetch: typeof fetch = eventFetch
    ? ((request, init) => eventFetch(request, {
        ...init,
        // h3 merges event headers with a plain record. ofetch supplies a
        // Headers instance, whose fields would otherwise be lost on spread.
        headers: init?.headers
          ? fetchHeaders(init.headers)
          : undefined,
      })) as typeof fetch
    : globalThis.fetch
  const client = import.meta.server && typeof requestFetch.raw !== 'function'
    ? (createFetch({
        fetch: rawFetch,
        Headers,
      }) as unknown as ODataFetchClient)
    : requestFetch

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
    const v2NavigationReferencePath = (
      source: ODataNavigationSource,
      navigationPath: readonly string[],
      targetKey?: ODataKey,
    ): string => {
      if (entitySet === undefined) {
        throw new TypeError(
          'An OData V2 navigation reference requires an entity set.',
        )
      }
      return joinODataPath(
        servicePath,
        createODataV2NavigationReferencePath(entitySet, source, navigationPath, targetKey),
      )
    }
    const mediaPath = (key: ODataNavigationSource, streamProperty?: string): string => {
      if (entitySet === undefined)
        throw new TypeError('An OData media operation requires an entity set.')
      return joinODataPath(servicePath, createODataMediaPath(entitySet, key, streamProperty))
    }
    return {
      supportsCollectionPages: true,
      supportsContainedNavigationSources: true,
      supportsContainedEntityResponses: true,
      supportsNavigationRootReferences: true,
      supportsNavigationReferences: true,
      supportsNavigationReferenceResponses: true,
      supportsV2NavigationReferences: true,
      supportsEntityResponses: true,
      supportsNavigationEntityResponses: true,
      supportsOptimisticConcurrency: true,
      supportsCreateResponses: true,
      supportsActionResponses: true,
      supportsDeleteResponses: true,
      supportsMerge: true,
      supportsNavigationMerge: true,
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

      fetchContainedOneWithResponse: <TResult = TModel>(
        source: ODataContainedEntitySource,
        query?: ODataQuery<TResult>,
        options?: ODataRequestOptions,
      ): Promise<ODataEntityResponse<TResult>> => {
        return $odataWithResponse<TResult>(client, navigationSourcePath(source), 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      fetchNavigationOneWithResponse: <TResult = unknown>(
        request: ODataNavigationEntityRead<TResult>,
        options?: ODataRequestOptions,
      ): Promise<ODataEntityResponse<TResult>> => {
        const navigationPath = joinODataPath(
          navigationSourcePath(request.source),
          formatODataNavigationPath(request.navigationPath),
        )
        const itemPath = request.targetKey === undefined
          ? navigationPath
          : `${navigationPath}(${formatODataKey(request.targetKey)})`
        return $odataWithResponse<TResult>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(request.query || {}),
        })
      },

      createMedia: async (
        body: ArrayBuffer | Uint8Array,
        options: ODataMediaCreateOptions,
      ): Promise<ODataMediaCreateResponse<TModel>> => {
        if (entitySet === undefined)
          throw new TypeError('An OData media create requires an entity set.')
        return $odataCreateMedia<TModel>(client, fullPath, body, options)
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
        return $odataCreateMedia<TResult>(client, navigationUrl, body, options)
      },

      fetchMedia: async (
        key: ODataNavigationSource,
        options?: ODataMediaRequestOptions,
      ): Promise<ODataMediaResponse> => {
        const { streamProperty, ...requestOptions } = options ?? {}
        return $odataFetchMedia(client, mediaPath(key, streamProperty), requestOptions)
      },

      updateMedia: async (
        key: ODataNavigationSource,
        body: ArrayBuffer | Uint8Array,
        options: ODataMediaUpdateOptions,
      ): Promise<ODataMediaMutationResponse> => {
        const { contentType, streamProperty, ...requestOptions } = options
        return $odataUpdateMedia(client, mediaPath(key, streamProperty), body, {
          ...requestOptions,
          contentType,
        })
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
      mergeNavigation: <TResult = unknown>(
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
        return $odata<TResult>(client, targetUrl, 'MERGE', {
          ...(options as any),
          body: update.body,
        })
      },
      mergeNavigationWithResponse: <TResult = unknown>(
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
        return $odataMutationWithResponse<TResult>(client, targetUrl, 'MERGE', {
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
      removeNavigationWithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const targetUrl = `${navigationUrl}(${formatODataKey(targetKey)})`
        return $odataMutationWithResponse<TResult>(client, targetUrl, 'DELETE', options as any)
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
      linkNavigationWithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetEntitySet: string,
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => {
        const referenceUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
          '$ref',
        )
        return $odataMutationWithResponse<TResult>(client, referenceUrl, 'POST', {
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
      unlinkNavigationWithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => {
        const navigationUrl = joinODataPath(
          navigationSourcePath(source),
          formatODataNavigationPath(navigationPath),
        )
        const referenceUrl = joinODataPath(
          `${navigationUrl}(${formatODataKey(targetKey)})`,
          '$ref',
        )
        return $odataMutationWithResponse<TResult>(client, referenceUrl, 'DELETE', options as any)
      },
      linkNavigationV2: (
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetEntitySet: string,
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<unknown> => $odata<unknown>(
        client,
        v2NavigationReferencePath(source, navigationPath),
        'POST',
        {
          ...(options as any),
          body: createODataV2EntityReference(targetEntitySet, targetKey),
        },
      ),
      linkNavigationV2WithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetEntitySet: string,
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
        client,
        v2NavigationReferencePath(source, navigationPath),
        'POST',
        {
          ...(options as any),
          body: createODataV2EntityReference(targetEntitySet, targetKey),
        },
      ),
      unlinkNavigationV2: (
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<unknown> => {
        const referenceUrl = v2NavigationReferencePath(source, navigationPath, targetKey)
        return options === undefined
          ? $odata<unknown>(client, referenceUrl, 'DELETE')
          : $odata<unknown>(client, referenceUrl, 'DELETE', options)
      },
      unlinkNavigationV2WithResponse: <TResult = unknown>(
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        targetKey: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
        client,
        v2NavigationReferencePath(source, navigationPath, targetKey),
        'DELETE',
        options as any,
      ),
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

      removeWithResponse: (
        key: ODataKey,
        options?: ODataRequestOptions,
      ): Promise<ODataMutationResponse<TModel>> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odataMutationWithResponse<TModel>(client, itemPath, 'DELETE', options as any)
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
        return $odataActionWithResponse<TResult>(
          client,
          joinODataPath(bindingPath, action),
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
    if (mutation.kind === 'create') {
      return Object.freeze({
        method: 'POST' as const,
        path: validateODataIdentifier(mutation.entitySet, 'OData entity set'),
        headers: mutation.headers,
        body: mutation.body,
      })
    }
    if (mutation.kind === 'delete') {
      return Object.freeze({
        method: 'DELETE' as const,
        path: createODataEntityPath(mutation.entitySet, mutation.key),
        headers: mutation.headers,
      })
    }
    if (mutation.kind === 'update-media') {
      const headers = Object.fromEntries([
        ...Object.entries(mutation.headers ?? {}).filter(([name]) =>
          name.toLowerCase() !== 'content-type'),
        ['Content-Type', validateODataMediaType(mutation.contentType)],
      ])
      return Object.freeze({
        method: 'PUT' as const,
        path: createODataMediaPath(
          mutation.entitySet,
          mutation.key,
          mutation.streamProperty,
        ),
        headers: Object.freeze(headers),
        body: validateODataMediaBody(mutation.body),
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

  const v2AtomicMutationRequest = (
    mutation: ODataV2AtomicMutation,
  ): ODataChangeSetRequest => {
    if (mutation.kind === 'create') {
      return Object.freeze({
        method: 'POST' as const,
        path: validateODataIdentifier(mutation.entitySet, 'OData entity set'),
        headers: mutation.headers,
        body: mutation.body,
      })
    }
    if (mutation.kind === 'delete') {
      return Object.freeze({
        method: 'DELETE' as const,
        path: createODataEntityPath(mutation.entitySet, mutation.key),
        headers: mutation.headers,
      })
    }
    if (mutation.kind === 'function-import') {
      if (mutation.invocation.method !== 'POST') {
        throw new TypeError(
          'An atomic OData V2 FunctionImport requires an explicit POST method.',
        )
      }
      const query = new URLSearchParams(
        formatODataV2FunctionImportParameters(mutation.invocation.parameters),
      ).toString()
      const name = validateODataIdentifier(
        mutation.name,
        'OData V2 FunctionImport',
      )
      return Object.freeze({
        method: 'POST' as const,
        path: query.length === 0 ? name : `${name}?${query}`,
        headers: mutation.headers,
      })
    }
    if (mutation.kind === 'update') {
      return Object.freeze({
        method: 'MERGE' as const,
        path: createODataEntityPath(mutation.entitySet, mutation.key),
        headers: mutation.headers,
        body: mutation.body,
      })
    }
    if (mutation.kind === 'link-navigation') {
      return Object.freeze({
        method: 'POST' as const,
        path: createODataV2NavigationReferencePath(
          mutation.entitySet,
          mutation.key,
          mutation.navigationPath,
        ),
        headers: mutation.headers,
        body: createODataV2EntityReference(
          mutation.targetEntitySet,
          mutation.targetKey,
        ),
      })
    }
    if (mutation.kind === 'unlink-navigation') {
      return Object.freeze({
        method: 'DELETE' as const,
        path: createODataV2NavigationReferencePath(
          mutation.entitySet,
          mutation.key,
          mutation.navigationPath,
          mutation.targetKey,
        ),
        headers: mutation.headers,
      })
    }
    if (mutation.kind !== 'create-navigation'
      && mutation.kind !== 'delete-navigation'
      && mutation.kind !== 'update-navigation') {
      throw new TypeError('Unsupported OData V2 changeset mutation.')
    }

    const navigationPath = joinODataPath(
      createODataNavigationSourcePath(mutation.entitySet, mutation.key),
      formatODataNavigationPath(mutation.navigationPath),
    )
    let entityPath = navigationPath
    if (mutation.kind !== 'create-navigation'
      && !(mutation.kind === 'update-navigation' && mutation.targetKey === undefined)) {
      const targetKey = mutation.targetKey
      if (targetKey === undefined)
        throw new TypeError('An OData V2 navigation delete requires a target key.')
      entityPath = `${navigationPath}(${formatODataKey(targetKey)})`
    }
    return Object.freeze({
      method: mutation.kind === 'create-navigation'
        ? 'POST' as const
        : mutation.kind === 'delete-navigation'
          ? 'DELETE' as const
          : 'MERGE' as const,
      path: entityPath,
      headers: mutation.headers,
      ...('body' in mutation ? { body: mutation.body } : {}),
    })
  }

  const postChangeSetBatch = async <T>(
    serviceName: string,
    payload: { readonly body: string | Uint8Array, readonly contentType: string },
    options: ODataRequestOptions,
    parse: (body: string, contentType: string) => T,
    version: 'v2' | 'v4' = 'v4',
  ): Promise<T> => {
    const response = await client.raw<string>(
      joinODataPath(resolveServicePath(serviceName), '$batch'),
      {
        ...options,
        method: 'POST',
        headers: mergeHeaders(options.headers, version === 'v2'
          ? {
              'Accept': 'multipart/mixed',
              'Content-Type': payload.contentType,
              'DataServiceVersion': '2.0',
              'MaxDataServiceVersion': '2.0',
            }
          : {
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

  const createV2ChangeSet = (serviceName: string) => async (
    mutations: readonly ODataV2AtomicMutation[],
    options: ODataRequestOptions = {},
  ): Promise<readonly ODataChangeSetResponse[]> => {
    const payload = serializeODataChangeSet(mutations.map(v2AtomicMutationRequest))
    return postChangeSetBatch(
      serviceName,
      payload,
      options,
      parseODataChangeSetResponse,
      'v2',
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
      supportsV2AtomicChangesets: true as const,
      supportsV2AtomicNavigationMutations: true as const,
      supportsV2AtomicNavigationReferences: true as const,
      supportsV2AtomicActionChangesets: true as const,
      supportsV2AtomicRootMutations: true as const,
      supportsV2FunctionImports: true as const,
      batchChangeSets: createBatchChangeSets(serviceName),
      changeSet: createChangeSet(serviceName),
      v2ChangeSet: createV2ChangeSet(serviceName),
      invokeFunctionImport: <TResult = unknown>(
        name: string,
        invocation: ODataV2FunctionImportInvocation,
        options?: ODataRequestOptions,
      ): Promise<TResult> => {
        if (invocation.method !== 'GET' && invocation.method !== 'POST') {
          throw new TypeError(
            'An OData V2 FunctionImport requires an explicit GET or POST method.',
          )
        }
        return $odata<TResult>(
          client,
          joinODataPath(
            resolveServicePath(serviceName),
            validateODataIdentifier(name, 'OData V2 FunctionImport'),
          ),
          invocation.method,
          {
            ...(options as any),
            query: formatODataV2FunctionImportParameters(invocation.parameters),
          },
        )
      },
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
