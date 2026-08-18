import type { ODataActionInvocation, ODataAsyncDataPromise, ODataAtomicMutation, ODataChangeSetMethod, ODataChangeSetResponse, ODataCollectionPage, ODataContinuation, ODataEntityResponse, ODataFunctionInvocation, ODataKey, ODataMutationResponse, ODataNavigationSource, ODataNavigationUpdate, ODataPublicConfig, ODataQuery, ODataRequestOptions, ODataRuntimeEntitySet, ODataRuntimeService, ODataServiceRegistry, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRequestFetch, useRuntimeConfig } from '#imports'
import {
  $odata,
  $odataMutationWithResponse,
  $odataPage,
  $odataWithResponse,
  createODataContinuationPath,
  createODataEntityPath,
  createODataNavigationSourcePath,
  flattenOData,
  formatODataFunctionCall,
  formatODataKey,
  formatODataNavigationPath,
  joinODataPath,
  mergeHeaders,
  parseODataChangeSetResponse,
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
    return {
      supportsCollectionPages: true,
      supportsContainedNavigationSources: true,
      supportsEntityResponses: true,
      supportsOptimisticConcurrency: true,
      supportsMerge: true,
      supportsContinuations: true,
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
    }
  }

  const createChangeSet = (serviceName: string) => async (
    mutations: readonly ODataAtomicMutation[],
    options: ODataRequestOptions = {},
  ): Promise<readonly ODataChangeSetResponse[]> => {
    const requests = mutations.map((mutation) => {
      const entityPath = mutation.kind === 'update'
        ? createODataEntityPath(mutation.entitySet, mutation.key)
        : createODataNavigationSourcePath(mutation.entitySet, mutation.key)
      const path = mutation.kind === 'update'
        ? entityPath
        : (() => {
            const navigationPath = joinODataPath(entityPath, formatODataNavigationPath(mutation.navigationPath))
            return 'targetKey' in mutation && mutation.targetKey !== undefined
              ? `${navigationPath}(${formatODataKey(mutation.targetKey)})`
              : navigationPath
          })()
      const method: ODataChangeSetMethod = mutation.kind === 'create-navigation'
        ? 'POST'
        : mutation.kind === 'delete-navigation'
          ? 'DELETE'
          : 'PATCH'
      return {
        method,
        path,
        headers: mutation.headers,
        ...('body' in mutation ? { body: mutation.body } : {}),
      }
    })
    const payload = serializeODataChangeSet(requests)
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
      },
    )
    const contentType = response.headers.get('content-type') ?? ''
    if (typeof response._data !== 'string') {
      throw new TypeError('The OData batch response body must be text.')
    }
    return parseODataChangeSetResponse(response._data, contentType)
  }

  const createServiceProxy = (serviceName: string): ODataRuntimeService => {
    const rootMethods = Object.assign(createMethods(serviceName), {
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
