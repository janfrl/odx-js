import type { ODataActionInvocation, ODataAsyncDataPromise, ODataAtomicMutation, ODataChangeSetMethod, ODataChangeSetResponse, ODataEntitySet, ODataFunctionInvocation, ODataKey, ODataNavigationSource, ODataNavigationUpdate, ODataPublicConfig, ODataQuery, ODataService, ODataServiceRegistry, RegisteredServiceNames } from '@me-tools/odx-core'
import { useFetch, useRuntimeConfig } from '#imports'
import {
  $odata,
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
  validateODataIdentifier,
  validateODataQualifiedName,
} from '@me-tools/odx-core'
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
export function useOData<T extends RegisteredServiceNames>(service: T): T extends keyof ODataServiceRegistry ? ODataServiceRegistry[T] : ODataService
export function useOData(service?: string): any {
  const client = globalThis.$fetch as unknown as ODataFetchClient

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

  const createMethods = <TModel = unknown>(serviceName: string, entitySet?: string): ODataEntitySet<TModel> => {
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

      fetchNavigationList: (
        source: ODataNavigationSource,
        navigationPath: string | readonly string[],
        query?: ODataQuery<TModel>,
        options?: unknown,
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
        options?: unknown,
      ): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odata<TModel>(client, itemPath, 'GET', {
          ...(options as any),
          query: stringifyQuery(query || {}),
        })
      },

      get: (key: ODataKey, query?: ODataQuery<TModel>, options?: unknown): ODataAsyncDataPromise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
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
        source: ODataNavigationSource,
        navigationPath: readonly string[],
        body: Readonly<Record<string, unknown>>,
        options?: any,
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
        options?: any,
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
        options?: any,
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
      update: (key: ODataKey, body: Partial<TModel>, options?: any): Promise<TModel> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return $odata<TModel>(client, itemPath, 'PATCH', {
          ...(options as any),
          body,
        })
      },

      remove: (key: ODataKey, options?: any): Promise<unknown> => {
        const itemPath = `${fullPath}(${formatODataKey(key)})`
        return options === undefined
          ? $odata<unknown>(client, itemPath, 'DELETE')
          : $odata<unknown>(client, itemPath, 'DELETE', options)
      },

      invokeFunction: <TResult = unknown>(
        functionName: string,
        invocation: ODataFunctionInvocation = {},
        options?: any,
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
        options?: any,
      ): Promise<TResult> => {
        validateODataQualifiedName(action, 'OData action')
        const bindingPath = invocation.key === undefined
          ? fullPath
          : `${fullPath}(${formatODataKey(invocation.key)})`
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
    options: any = {},
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
