import type {
  ODataActionInvocation,
  ODataActionResponse,
  ODataAtomicMutation,
  ODataChangeSetMethod,
  ODataChangeSetRequest,
  ODataChangeSetResponse,
  ODataCreateResponse,
  ODataKey,
  ODataMediaMutationResponse,
  ODataMediaRequestOptions,
  ODataMediaResponse,
  ODataMediaUpdateOptions,
  ODataMutationResponse,
  ODataNavigationSource,
  ODataProxyConfig,
  ODataRequestOptions,
} from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import {
  $odata,
  $odataActionWithResponse,
  $odataCreateWithResponse,
  $odataFetchMedia,
  $odataMutationWithResponse,
  $odataUpdateMedia,
  createODataEntityPath,
  createODataEntityReference,
  createODataMediaPath,
  createODataNavigationSourcePath,
  formatODataKey,
  formatODataNavigationPath,
  joinODataPath,
  mergeHeaders,
  parseODataChangeSetResponse,
  serializeODataChangeSet,
  validateODataIdentifier,
  validateODataQualifiedName,
} from '@me-tools/odx-core'
import { createFetch } from 'ofetch'

interface ODataFetchClient {
  <T>(path: string, options?: unknown): Promise<T>
  raw: <T>(path: string, options?: unknown) => Promise<{
    _data?: T
    headers: { get: (name: string) => string | null }
  }>
}

export interface ODataServerMutationEntitySet {
  create: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    body: TBody,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  createWithResponse: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    body: TBody,
    options?: ODataRequestOptions,
  ) => Promise<ODataCreateResponse<TResult>>
  update: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    key: ODataKey,
    body: TBody,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  updateWithResponse: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    key: ODataKey,
    body: TBody,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  remove: <TResult = unknown>(
    key: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  removeWithResponse: <TResult = unknown>(
    key: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  fetchMedia: (
    key: ODataNavigationSource,
    options?: ODataMediaRequestOptions,
  ) => Promise<ODataMediaResponse>
  updateMedia: (
    key: ODataNavigationSource,
    body: ArrayBuffer | Uint8Array,
    options: ODataMediaUpdateOptions,
  ) => Promise<ODataMediaMutationResponse>
  invoke: <TResult = unknown, TParameters = Record<string, unknown>>(
    action: string,
    invocation?: ODataActionInvocation<TParameters>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  invokeWithResponse: <TResult = unknown, TParameters = Record<string, unknown>>(
    action: string,
    invocation?: ODataActionInvocation<TParameters>,
    options?: ODataRequestOptions,
  ) => Promise<ODataActionResponse<TResult>>
  linkNavigation: (
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetEntitySet: string,
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<unknown>
  linkNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetEntitySet: string,
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  unlinkNavigation: (
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<unknown>
  unlinkNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
}

export interface ODataServerMutationService {
  entitySet: (name: string) => ODataServerMutationEntitySet
  changeSet: (
    mutations: readonly ODataAtomicMutation[],
    options?: ODataRequestOptions,
  ) => Promise<readonly ODataChangeSetResponse[]>
}

function atomicMutationRequest(mutation: ODataAtomicMutation): ODataChangeSetRequest {
  if (mutation.kind === 'update-media') {
    const headers = Object.fromEntries([
      ...Object.entries(mutation.headers ?? {}).filter(([name]) =>
        name.toLowerCase() !== 'content-type'),
      ['Content-Type', mutation.contentType],
    ])
    return {
      method: 'PUT',
      path: createODataMediaPath(mutation.entitySet, mutation.key, mutation.streamProperty),
      headers,
      body: mutation.body,
    }
  }
  if (mutation.kind === 'action') {
    validateODataQualifiedName(mutation.action, 'OData action')
    const bindingPath = mutation.scope === 'service'
      ? undefined
      : mutation.scope === 'collection'
        ? validateODataIdentifier(mutation.entitySet, 'OData entity set')
        : createODataNavigationSourcePath(mutation.entitySet, mutation.key)
    return {
      method: 'POST',
      path: bindingPath === undefined
        ? mutation.action
        : joinODataPath(bindingPath, mutation.action),
      headers: mutation.headers,
      body: mutation.parameters ?? {},
    }
  }
  const entityPath = mutation.kind === 'update'
    ? createODataEntityPath(mutation.entitySet, mutation.key)
    : createODataNavigationSourcePath(mutation.entitySet, mutation.key)
  const path = mutation.kind === 'update'
    ? entityPath
    : (() => {
        const navigationPath = joinODataPath(
          entityPath,
          formatODataNavigationPath(mutation.navigationPath),
        )
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
  return {
    method,
    path,
    headers: mutation.headers,
    ...(mutation.kind === 'link-navigation'
      ? { body: createODataEntityReference(mutation.targetEntitySet, mutation.targetKey) }
      : 'body' in mutation ? { body: mutation.body } : {}),
  }
}

export function createODataServerMutationService(
  event: H3Event,
  serviceName: string,
): ODataServerMutationService {
  const config = event.context.odataConfig as ODataProxyConfig | undefined
  if (config === undefined)
    throw new TypeError('ODX server mutations require the Nuxt ODX server middleware.')
  const service = config.services.find(candidate => candidate.name === serviceName)
  if (service === undefined)
    throw new TypeError(`Unknown OData service "${serviceName}".`)
  const servicePath = joinODataPath(
    config.basePath || '/api/odx',
    service.route || service.name,
  )
  const contextFetch: typeof fetch = event.fetch === undefined
    ? globalThis.fetch
    : ((request, init) => event.fetch!(request as string, {
        ...init,
        headers: init?.headers === undefined
          ? undefined
          : (() => {
              const normalized: Record<string, string> = {}
              new Headers(init.headers).forEach((value, name) => {
                normalized[name] = value
              })
              return normalized
            })(),
      })) as typeof fetch
  const client = createFetch({ fetch: contextFetch, Headers }) as unknown as ODataFetchClient

  return {
    entitySet(name) {
      const entitySet = validateODataIdentifier(name, 'OData entity set')
      const sourcePath = (source: ODataNavigationSource): string =>
        joinODataPath(servicePath, createODataNavigationSourcePath(entitySet, source))
      return {
        create: <TResult, TBody extends Record<string, unknown>>(
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, joinODataPath(servicePath, entitySet), 'POST', {
          ...(options as Record<string, unknown> | undefined),
          body,
        }),
        createWithResponse: <TResult, TBody extends Record<string, unknown>>(
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<ODataCreateResponse<TResult>> => $odataCreateWithResponse<TResult>(
          client,
          joinODataPath(servicePath, entitySet),
          {
            ...(options as Record<string, unknown> | undefined),
            body,
          },
        ),
        update: <TResult, TBody extends Record<string, unknown>>(
          key: ODataKey,
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, sourcePath(key), 'PATCH', {
          ...(options as Record<string, unknown> | undefined),
          body,
        }),
        updateWithResponse: <TResult, TBody extends Record<string, unknown>>(
          key: ODataKey,
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          sourcePath(key),
          'PATCH',
          {
            ...(options as Record<string, unknown> | undefined),
            body,
          },
        ),
        remove: <TResult>(
          key: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, sourcePath(key), 'DELETE', options as Record<string, unknown> | undefined),
        removeWithResponse: <TResult>(
          key: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          sourcePath(key),
          'DELETE',
          options as Record<string, unknown> | undefined,
        ),
        fetchMedia: (
          key: ODataNavigationSource,
          options?: ODataMediaRequestOptions,
        ): Promise<ODataMediaResponse> => {
          const { streamProperty, ...requestOptions } = options ?? {}
          const path = joinODataPath(
            servicePath,
            createODataMediaPath(entitySet, key, streamProperty),
          )
          return $odataFetchMedia(client, path, requestOptions)
        },
        updateMedia: (
          key: ODataNavigationSource,
          body: ArrayBuffer | Uint8Array,
          options: ODataMediaUpdateOptions,
        ): Promise<ODataMediaMutationResponse> => {
          const { contentType, streamProperty, ...requestOptions } = options
          const path = joinODataPath(
            servicePath,
            createODataMediaPath(entitySet, key, streamProperty),
          )
          return $odataUpdateMedia(client, path, body, {
            ...requestOptions,
            contentType,
          })
        },
        invoke: <TResult, TParameters>(
          action: string,
          invocation: ODataActionInvocation<TParameters> = {},
          options?: ODataRequestOptions,
        ): Promise<TResult> => {
          validateODataQualifiedName(action, 'OData action')
          const bindingPath = invocation.key === undefined
            ? joinODataPath(servicePath, entitySet)
            : sourcePath(invocation.key)
          return $odata<TResult>(client, joinODataPath(bindingPath, action), 'POST', {
            ...(options as Record<string, unknown> | undefined),
            body: invocation.parameters ?? {},
          })
        },
        invokeWithResponse: <TResult, TParameters>(
          action: string,
          invocation: ODataActionInvocation<TParameters> = {},
          options?: ODataRequestOptions,
        ): Promise<ODataActionResponse<TResult>> => {
          validateODataQualifiedName(action, 'OData action')
          const bindingPath = invocation.key === undefined
            ? joinODataPath(servicePath, entitySet)
            : sourcePath(invocation.key)
          return $odataActionWithResponse<TResult>(client, joinODataPath(bindingPath, action), {
            ...(options as Record<string, unknown> | undefined),
            body: invocation.parameters ?? {},
          })
        },
        linkNavigation(source, navigationPath, targetEntitySet, targetKey, options) {
          const path = joinODataPath(
            sourcePath(source),
            formatODataNavigationPath(navigationPath),
            '$ref',
          )
          return $odata(client, path, 'POST', {
            ...(options as Record<string, unknown> | undefined),
            body: createODataEntityReference(targetEntitySet, targetKey),
          })
        },
        linkNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          navigationPath: readonly string[],
          targetEntitySet: string,
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => {
          const path = joinODataPath(
            sourcePath(source),
            formatODataNavigationPath(navigationPath),
            '$ref',
          )
          return $odataMutationWithResponse<TResult>(client, path, 'POST', {
            ...(options as Record<string, unknown> | undefined),
            body: createODataEntityReference(targetEntitySet, targetKey),
          })
        },
        unlinkNavigation(source, navigationPath, targetKey, options) {
          const path = joinODataPath(
            `${joinODataPath(sourcePath(source), formatODataNavigationPath(navigationPath))}(${formatODataKey(targetKey)})`,
            '$ref',
          )
          return $odata(client, path, 'DELETE', options as Record<string, unknown> | undefined)
        },
        unlinkNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          navigationPath: readonly string[],
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => {
          const path = joinODataPath(
            `${joinODataPath(sourcePath(source), formatODataNavigationPath(navigationPath))}(${formatODataKey(targetKey)})`,
            '$ref',
          )
          return $odataMutationWithResponse<TResult>(
            client,
            path,
            'DELETE',
            options as Record<string, unknown> | undefined,
          )
        },
      }
    },
    async changeSet(mutations, options = {}) {
      const payload = serializeODataChangeSet(mutations.map(atomicMutationRequest))
      const response = await client.raw<string>(joinODataPath(servicePath, '$batch'), {
        ...options,
        method: 'POST',
        headers: mergeHeaders(options.headers, {
          'Accept': 'multipart/mixed',
          'Content-Type': payload.contentType,
          'OData-Version': '4.0',
        }),
        body: payload.body,
        responseType: 'text',
      })
      if (typeof response._data !== 'string')
        throw new TypeError('The OData batch response body must be text.')
      return parseODataChangeSetResponse(
        response._data,
        response.headers.get('content-type') ?? '',
      )
    },
  }
}
