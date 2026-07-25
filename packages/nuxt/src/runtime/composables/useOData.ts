import type { ODataActionInvocation, ODataAsyncDataPromise, ODataAtomicMutation, ODataChangeSetResponse, ODataEntitySet, ODataKey, ODataNavigationUpdate, ODataPublicConfig, ODataQuery, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRuntimeConfig } from '#imports'
import { $odata, flattenOData, mergeHeaders, parseODataChangeSetResponse, serializeODataChangeSet, stringifyQuery } from '@me-tools/odx-core'
import { useODataBasePath } from './useODataBasePath'

const RE_SINGLE_QUOTE = /'/g
const RE_QUALIFIED_ACTION = /^(?:[A-Za-z_]\w*\.)+[A-Za-z_]\w*$/u
const RE_NAVIGATION_SEGMENT = /^[A-Za-z_]\w*$/u
const RE_LEADING_SLASHES = /^\/+/
const RE_TRAILING_SLASHES = /\/+$/
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
export function useOData<T extends RegisteredServiceNames>(service: T): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService
export function useOData(service?: string): any {
  const client = globalThis.$fetch as unknown as ODataFetchClient

  const formatStringKeyLiteral = (value: string): string => `'${encodeURIComponent(value).replace(RE_SINGLE_QUOTE, '\'\'')}'`

  const resolveServiceRoute = (serviceName: string): string => {
    const config = useRuntimeConfig()
    const publicConfig = config.public.odata as unknown as ODataPublicConfig
    const serviceConfig = publicConfig?.services?.find(s => s.name === serviceName)
    return serviceConfig?.route || serviceName
  }

  const normalizeUrlBase = (value: string): string => value.replace(RE_TRAILING_SLASHES, '')

  const joinUrlSegments = (base: string, ...segments: string[]): string => {
    const normalizedBase = normalizeUrlBase(base)
    const normalizedSegments = segments
      .filter(Boolean)
      .map(segment => segment.replace(RE_LEADING_SLASHES, '').replace(RE_TRAILING_SLASHES, ''))
      .filter(Boolean)

    return normalizedSegments.length > 0
      ? [normalizedBase, ...normalizedSegments].join('/')
      : normalizedBase
  }

  /**
   * Formats a single or composite key for OData URLs.
   */
  const formatKey = (key: ODataKey): string => {
    if (typeof key !== 'object') {
      return typeof key === 'string' ? formatStringKeyLiteral(key) : String(key)
    }
    return Object.entries(key)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? formatStringKeyLiteral(v) : v}`)
      .join(',')
  }

  const formatNavigationPath = (navigationPath: readonly string[]): string => {
    if (navigationPath.length === 0
      || navigationPath.some(segment => !RE_NAVIGATION_SEGMENT.test(segment))) {
      throw new TypeError(
        'An OData navigation path requires one or more valid identifier segments.',
      )
    }
    return navigationPath.join('/')
  }
  const formatEntitySet = (entitySet: string): string => {
    if (!RE_NAVIGATION_SEGMENT.test(entitySet)) {
      throw new TypeError(`OData entity set "${entitySet}" requires a valid identifier.`)
    }
    return entitySet
  }

  const resolveServicePath = (serviceName: string): string => {
    const basePath = useODataBasePath(serviceName)
    if (basePath.startsWith('http'))
      return normalizeUrlBase(basePath)
    return joinUrlSegments(basePath, resolveServiceRoute(serviceName))
  }

  const createMethods = <TModel = unknown>(serviceName: string, entitySet?: string): ODataEntitySet<TModel> => {
    const servicePath = resolveServicePath(serviceName)
    const fullPath = entitySet ? joinUrlSegments(servicePath, entitySet) : servicePath
    return {
      list: (query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel[]> => {
        return useFetch(fullPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel[]>
      },
      fetchList: (
        query?: ODataQuery<TModel>,
        options?: unknown,
      ): Promise<TModel[]> => $odata<TModel[]>(client, fullPath, 'GET', {
        ...(options as any),
        query: stringifyQuery(query || {}),
      }),

      fetchOne: (
        key: ODataKey,
        query?: ODataQuery<TModel>,
        options?: unknown,
      ): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<TModel>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      get: (key: ODataKey, query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return useFetch(itemPath, {
          ...(options as any),
          query: stringifyQuery(query || {}),
          transform: (data: any) => flattenOData(data),
        }) as unknown as ODataAsyncDataPromise<TModel>
      },

      create: (body: Partial<TModel>, options?: any): Promise<TModel> =>
        $odata<TModel>(client, fullPath, 'POST', {
          ...(options as any),
          body,
        }),

      createNavigation: <TResult = unknown>(
        key: ODataKey,
        navigationPath: readonly string[],
        body: Readonly<Record<string, unknown>>,
        options?: any,
      ): Promise<TResult> => {
        const navigationUrl = joinUrlSegments(
          `${fullPath}(${formatKey(key)})`,
          formatNavigationPath(navigationPath),
        )
        return $odata<TResult>(client, navigationUrl, 'POST', {
          ...(options as any),
          body,
        })
      },
      updateNavigation: <TResult = unknown>(
        key: ODataKey,
        navigationPath: readonly string[],
        update: ODataNavigationUpdate,
        options?: any,
      ): Promise<TResult> => {
        const navigationUrl = joinUrlSegments(
          `${fullPath}(${formatKey(key)})`,
          formatNavigationPath(navigationPath),
        )
        const targetUrl = update.targetKey === undefined
          ? navigationUrl
          : `${navigationUrl}(${formatKey(update.targetKey)})`
        return $odata<TResult>(client, targetUrl, 'PATCH', {
          ...(options as any),
          body: update.body,
        })
      },
      update: (key: ODataKey, body: Partial<TModel>, options?: any): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return $odata<TModel>(client, itemPath, 'PATCH', {
          ...(options as any),
          body,
        })
      },

      remove: (key: ODataKey, options?: any): Promise<unknown> => {
        const itemPath = `${fullPath}(${formatKey(key)})`
        return options === undefined
          ? $odata<unknown>(client, itemPath, 'DELETE')
          : $odata<unknown>(client, itemPath, 'DELETE', options)
      },

      invoke: <TResult = unknown, TParameters = Record<string, unknown>>(
        action: string,
        invocation: ODataActionInvocation<TParameters> = {},
        options?: any,
      ): Promise<TResult> => {
        if (!RE_QUALIFIED_ACTION.test(action)) {
          throw new TypeError(
            `OData action "${action}" requires a qualified name.`,
          )
        }
        const bindingPath = invocation.key === undefined
          ? fullPath
          : `${fullPath}(${formatKey(invocation.key)})`
        return $odata<TResult>(
          client,
          joinUrlSegments(bindingPath, action),
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
    options: any = {},
  ): Promise<readonly ODataChangeSetResponse[]> => {
    const requests = mutations.map((mutation) => {
      const entityPath = `${formatEntitySet(mutation.entitySet)}(${formatKey(mutation.key)})`
      const path = mutation.kind === 'update'
        ? entityPath
        : (() => {
            const navigationPath = `${entityPath}/${formatNavigationPath(mutation.navigationPath)}`
            return mutation.targetKey === undefined
              ? navigationPath
              : `${navigationPath}(${formatKey(mutation.targetKey)})`
          })()
      return {
        method: 'PATCH' as const,
        path,
        headers: mutation.headers,
        body: mutation.body,
      }
    })
    const payload = serializeODataChangeSet(requests)
    const response = await client.raw<string>(
      joinUrlSegments(resolveServicePath(serviceName), '$batch'),
      {
        ...options,
        method: 'POST',
        headers: mergeHeaders(options.headers, {
          Accept: 'multipart/mixed',
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

  const createServiceProxy = (serviceName: string): ODataService => {
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
