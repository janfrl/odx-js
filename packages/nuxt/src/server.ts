import type {
  ODataActionInvocation,
  ODataActionResponse,
  ODataAtomicMutation,
  ODataChangeSetMethod,
  ODataChangeSetRequest,
  ODataChangeSetResponse,
  ODataCollectionPage,
  ODataContainedEntitySource,
  ODataContinuation,
  ODataCreateResponse,
  ODataEntityResponse,
  ODataFunctionInvocation,
  ODataKey,
  ODataMediaCreateOptions,
  ODataMediaCreateResponse,
  ODataMediaMutationResponse,
  ODataMediaRequestOptions,
  ODataMediaResponse,
  ODataMediaUpdateOptions,
  ODataMutationResponse,
  ODataNavigationEntityRead,
  ODataNavigationSource,
  ODataNavigationUpdate,
  ODataProxyConfig,
  ODataQuery,
  ODataRequestOptions,
  ODataV2AtomicMutation,
  ODataV2FunctionImportCapability,
  ODataV2FunctionImportInvocation,
} from '@me-tools/odx-core'
import type { H3Event } from 'h3'
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
  createODataNavigationSourcePath,
  createODataV2EntityReference,
  createODataV2NavigationReferencePath,
  formatODataFunctionCall,
  formatODataKey,
  formatODataNavigationPath,
  formatODataV2FunctionImportParameters,
  joinODataPath,
  mergeHeaders,
  parseODataChangeSetResponse,
  serializeODataChangeSet,
  stringifyQuery,
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

export interface ODataServerReadEntitySet {
  fetchOne: <TResult = unknown>(
    key: ODataKey,
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  fetchOneWithResponse: <TResult = unknown>(
    key: ODataKey,
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataEntityResponse<TResult>>
  fetchContainedOneWithResponse: <TResult = unknown>(
    source: ODataContainedEntitySource,
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataEntityResponse<TResult>>
  fetchNavigationOneWithResponse: <TResult = unknown>(
    request: ODataNavigationEntityRead<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataEntityResponse<TResult>>
  fetchList: <TResult = unknown>(
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<TResult[]>
  fetchPage: <TResult = unknown>(
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
  fetchNextPage: <TResult = unknown>(
    continuation: ODataContinuation,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
  fetchNavigationList: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<TResult[]>
  fetchNavigationPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
  fetchNavigationNextPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    continuation: ODataContinuation,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
  invokeFunction: <TResult = unknown>(
    functionName: string,
    invocation?: ODataFunctionInvocation,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
}

export interface ODataServerReadService {
  /** Invokes an unbound OData V4 function at the configured service root. */
  invokeFunction: <TResult = unknown>(
    functionName: string,
    invocation?: ODataFunctionInvocation,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  entitySet: (name: string) => ODataServerReadEntitySet
}

export interface ODataServerMutationEntitySet {
  readonly supportsMerge: true
  readonly supportsNavigationMerge: true
  readonly supportsV2NavigationReferences: true
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
  merge: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
    key: ODataKey,
    body: TBody,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  mergeWithResponse: <TResult = unknown, TBody extends Record<string, unknown> = Record<string, unknown>>(
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
  createNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    body: Readonly<Record<string, unknown>>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  createNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    body: Readonly<Record<string, unknown>>,
    options?: ODataRequestOptions,
  ) => Promise<ODataCreateResponse<TResult>>
  updateNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    update: ODataNavigationUpdate,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  updateNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    update: ODataNavigationUpdate,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  mergeNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    update: ODataNavigationUpdate,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  mergeNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    update: ODataNavigationUpdate,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  removeNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  removeNavigationWithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  createMedia: <TResult = unknown>(
    body: ArrayBuffer | Uint8Array,
    options: ODataMediaCreateOptions,
  ) => Promise<ODataMediaCreateResponse<TResult>>
  createNavigationMedia: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    body: ArrayBuffer | Uint8Array,
    options: ODataMediaCreateOptions,
  ) => Promise<ODataMediaCreateResponse<TResult>>
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
  linkNavigationV2: (
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetEntitySet: string,
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<unknown>
  linkNavigationV2WithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetEntitySet: string,
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
  unlinkNavigationV2: (
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<unknown>
  unlinkNavigationV2WithResponse: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<TResult>>
}

export interface ODataServerMutationService extends ODataV2FunctionImportCapability {
  readonly supportsV2AtomicChangesets: true
  readonly supportsV2AtomicNavigationMutations: true
  readonly supportsV2AtomicNavigationReferences: true
  readonly supportsV2AtomicActionChangesets: true
  /** Invokes an unbound OData V4 action at the configured service root. */
  invoke: <TResult = unknown, TParameters = Record<string, unknown>>(
    action: string,
    invocation?: ODataActionInvocation<TParameters>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  /** Invokes the same action while preserving optional response metadata. */
  invokeWithResponse: <TResult = unknown, TParameters = Record<string, unknown>>(
    action: string,
    invocation?: ODataActionInvocation<TParameters>,
    options?: ODataRequestOptions,
  ) => Promise<ODataActionResponse<TResult>>
  entitySet: (name: string) => ODataServerMutationEntitySet
  changeSet: (
    mutations: readonly ODataAtomicMutation[],
    options?: ODataRequestOptions,
  ) => Promise<readonly ODataChangeSetResponse[]>
  v2ChangeSet: (
    mutations: readonly ODataV2AtomicMutation[],
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

function v2AtomicMutationRequest(
  mutation: ODataV2AtomicMutation,
): ODataChangeSetRequest {
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
    return {
      method: 'POST',
      path: query.length === 0 ? name : `${name}?${query}`,
      headers: mutation.headers,
    }
  }
  if (mutation.kind === 'update') {
    return {
      method: 'MERGE',
      path: createODataEntityPath(mutation.entitySet, mutation.key),
      headers: mutation.headers,
      body: mutation.body,
    }
  }
  if (mutation.kind === 'link-navigation') {
    return {
      method: 'POST',
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
    }
  }
  if (mutation.kind === 'unlink-navigation') {
    return {
      method: 'DELETE',
      path: createODataV2NavigationReferencePath(
        mutation.entitySet,
        mutation.key,
        mutation.navigationPath,
        mutation.targetKey,
      ),
      headers: mutation.headers,
    }
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
  let path = navigationPath
  if (mutation.kind !== 'create-navigation'
    && !(mutation.kind === 'update-navigation' && mutation.targetKey === undefined)) {
    const targetKey = mutation.targetKey
    if (targetKey === undefined)
      throw new TypeError('An OData V2 navigation delete requires a target key.')
    path = `${navigationPath}(${formatODataKey(targetKey)})`
  }
  return {
    method: mutation.kind === 'create-navigation'
      ? 'POST'
      : mutation.kind === 'delete-navigation'
        ? 'DELETE'
        : 'MERGE',
    path,
    headers: mutation.headers,
    ...('body' in mutation ? { body: mutation.body } : {}),
  }
}

function resolveODataServerTransport(
  event: H3Event,
  serviceName: string,
  operation: 'mutations' | 'reads',
): Readonly<{ client: ODataFetchClient, servicePath: string }> {
  const config = event.context.odataConfig as ODataProxyConfig | undefined
  if (config === undefined)
    throw new TypeError(`ODX server ${operation} require the Nuxt ODX server middleware.`)
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
  return { client, servicePath }
}

export function createODataServerReadService(
  event: H3Event,
  serviceName: string,
): ODataServerReadService {
  const { client, servicePath } = resolveODataServerTransport(event, serviceName, 'reads')
  return {
    invokeFunction: <TResult>(
      functionName: string,
      invocation: ODataFunctionInvocation = {},
      options?: ODataRequestOptions,
    ): Promise<TResult> => {
      if (invocation.key !== undefined || invocation.navigationPath !== undefined) {
        throw new TypeError(
          'A service-level OData function cannot declare an entity or navigation binding.',
        )
      }
      return $odata<TResult>(
        client,
        joinODataPath(
          servicePath,
          formatODataFunctionCall(functionName, invocation.parameters),
        ),
        'GET',
        options as Record<string, unknown> | undefined,
      )
    },
    entitySet(name) {
      const entitySet = validateODataIdentifier(name, 'OData entity set')
      const collectionPath = joinODataPath(servicePath, entitySet)
      const sourcePath = (source: ODataNavigationSource): string =>
        joinODataPath(servicePath, createODataNavigationSourcePath(entitySet, source))
      const navigationPath = (source: ODataNavigationSource, path: readonly string[]): string =>
        joinODataPath(sourcePath(source), formatODataNavigationPath(path))
      return {
        fetchOne: <TResult>(
          key: ODataKey,
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, sourcePath(key), 'GET', {
          ...(options as Record<string, unknown> | undefined),
          query: stringifyQuery(query),
        }),
        fetchOneWithResponse: <TResult>(
          key: ODataKey,
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<ODataEntityResponse<TResult>> => $odataWithResponse<TResult>(
          client,
          sourcePath(key),
          'GET',
          {
            ...(options as Record<string, unknown> | undefined),
            query: stringifyQuery(query),
          },
        ),
        fetchContainedOneWithResponse: <TResult>(
          source: ODataContainedEntitySource,
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<ODataEntityResponse<TResult>> => $odataWithResponse<TResult>(
          client,
          sourcePath(source),
          'GET',
          {
            ...(options as Record<string, unknown> | undefined),
            query: stringifyQuery(query),
          },
        ),
        fetchNavigationOneWithResponse: <TResult>(
          request: ODataNavigationEntityRead<TResult>,
          options?: ODataRequestOptions,
        ): Promise<ODataEntityResponse<TResult>> => {
          const relatedPath = navigationPath(
            request.source,
            typeof request.navigationPath === 'string'
              ? [request.navigationPath]
              : request.navigationPath,
          )
          const itemPath = request.targetKey === undefined
            ? relatedPath
            : `${relatedPath}(${formatODataKey(request.targetKey)})`
          return $odataWithResponse<TResult>(client, itemPath, 'GET', {
            ...(options as Record<string, unknown> | undefined),
            query: stringifyQuery(request.query ?? {}),
          })
        },
        fetchList: <TResult>(
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<TResult[]> => $odata<TResult[]>(client, collectionPath, 'GET', {
          ...(options as Record<string, unknown> | undefined),
          query: stringifyQuery(query),
        }),
        fetchPage: <TResult>(
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<ODataCollectionPage<TResult>> => $odataPage<TResult>(client, collectionPath, {
          ...(options as Record<string, unknown> | undefined),
          query: stringifyQuery(query),
        }),
        fetchNextPage: <TResult>(
          continuation: ODataContinuation,
          options?: ODataRequestOptions,
        ): Promise<ODataCollectionPage<TResult>> => $odataPage<TResult>(
          client,
          createODataContinuationPath(collectionPath, continuation),
          options as Record<string, unknown> | undefined,
        ),
        fetchNavigationList: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<TResult[]> => $odata<TResult[]>(client, navigationPath(source, path), 'GET', {
          ...(options as Record<string, unknown> | undefined),
          query: stringifyQuery(query),
        }),
        fetchNavigationPage: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          query: ODataQuery<TResult> = {},
          options?: ODataRequestOptions,
        ): Promise<ODataCollectionPage<TResult>> => $odataPage<TResult>(client, navigationPath(source, path), {
          ...(options as Record<string, unknown> | undefined),
          query: stringifyQuery(query),
        }),
        fetchNavigationNextPage: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          continuation: ODataContinuation,
          options?: ODataRequestOptions,
        ): Promise<ODataCollectionPage<TResult>> => $odataPage<TResult>(
          client,
          createODataContinuationPath(navigationPath(source, path), continuation),
          options as Record<string, unknown> | undefined,
        ),
        invokeFunction: <TResult>(
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
            ? collectionPath
            : sourcePath(invocation.key)
          const bindingPath = invocation.navigationPath === undefined
            ? entityPath
            : joinODataPath(entityPath, formatODataNavigationPath(invocation.navigationPath))
          return $odata<TResult>(
            client,
            joinODataPath(bindingPath, formatODataFunctionCall(functionName, invocation.parameters)),
            'GET',
            options as Record<string, unknown> | undefined,
          )
        },
      }
    },
  }
}

export function createODataServerMutationService(
  event: H3Event,
  serviceName: string,
): ODataServerMutationService {
  const { client, servicePath } = resolveODataServerTransport(event, serviceName, 'mutations')

  return {
    supportsV2AtomicChangesets: true,
    supportsV2AtomicNavigationMutations: true,
    supportsV2AtomicNavigationReferences: true,
    supportsV2AtomicActionChangesets: true,
    supportsV2FunctionImports: true,
    invoke: <TResult, TParameters>(
      action: string,
      invocation: ODataActionInvocation<TParameters> = {},
      options?: ODataRequestOptions,
    ): Promise<TResult> => {
      validateODataQualifiedName(action, 'OData action')
      if (invocation.key !== undefined || invocation.navigationPath !== undefined) {
        throw new TypeError(
          'A service-level OData action cannot declare an entity or navigation binding.',
        )
      }
      return $odata<TResult>(client, joinODataPath(servicePath, action), 'POST', {
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
      if (invocation.key !== undefined || invocation.navigationPath !== undefined) {
        throw new TypeError(
          'A service-level OData action cannot declare an entity or navigation binding.',
        )
      }
      return $odataActionWithResponse<TResult>(client, joinODataPath(servicePath, action), {
        ...(options as Record<string, unknown> | undefined),
        body: invocation.parameters ?? {},
      })
    },
    invokeFunctionImport: <TResult>(
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
          servicePath,
          validateODataIdentifier(name, 'OData V2 FunctionImport'),
        ),
        invocation.method,
        {
          ...(options as Record<string, unknown> | undefined),
          query: formatODataV2FunctionImportParameters(invocation.parameters),
        },
      )
    },
    entitySet(name) {
      const entitySet = validateODataIdentifier(name, 'OData entity set')
      const collectionPath = joinODataPath(servicePath, entitySet)
      const sourcePath = (source: ODataNavigationSource): string =>
        joinODataPath(servicePath, createODataNavigationSourcePath(entitySet, source))
      const navigationCollectionPath = (
        source: ODataNavigationSource,
        path: readonly string[],
      ): string => joinODataPath(sourcePath(source), formatODataNavigationPath(path))
      const navigationTargetPath = (
        source: ODataNavigationSource,
        path: readonly string[],
        targetKey?: ODataKey,
      ): string => {
        const navigationPath = navigationCollectionPath(source, path)
        return targetKey === undefined
          ? navigationPath
          : `${navigationPath}(${formatODataKey(targetKey)})`
      }
      return {
        supportsMerge: true,
        supportsNavigationMerge: true,
        supportsV2NavigationReferences: true,
        create: <TResult, TBody extends Record<string, unknown>>(
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, collectionPath, 'POST', {
          ...(options as Record<string, unknown> | undefined),
          body,
        }),
        createWithResponse: <TResult, TBody extends Record<string, unknown>>(
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<ODataCreateResponse<TResult>> => $odataCreateWithResponse<TResult>(
          client,
          collectionPath,
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
        merge: <TResult, TBody extends Record<string, unknown>>(
          key: ODataKey,
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(client, sourcePath(key), 'MERGE', {
          ...(options as Record<string, unknown> | undefined),
          body,
        }),
        mergeWithResponse: <TResult, TBody extends Record<string, unknown>>(
          key: ODataKey,
          body: TBody,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          sourcePath(key),
          'MERGE',
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
        createNavigation: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          body: Readonly<Record<string, unknown>>,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(
          client,
          navigationCollectionPath(source, path),
          'POST',
          {
            ...(options as Record<string, unknown> | undefined),
            body,
          },
        ),
        createNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          body: Readonly<Record<string, unknown>>,
          options?: ODataRequestOptions,
        ): Promise<ODataCreateResponse<TResult>> => $odataCreateWithResponse<TResult>(
          client,
          navigationCollectionPath(source, path),
          {
            ...(options as Record<string, unknown> | undefined),
            body,
          },
        ),
        updateNavigation: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          update: ODataNavigationUpdate,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(
          client,
          navigationTargetPath(source, path, update.targetKey),
          'PATCH',
          {
            ...(options as Record<string, unknown> | undefined),
            body: update.body,
          },
        ),
        updateNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          update: ODataNavigationUpdate,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          navigationTargetPath(source, path, update.targetKey),
          'PATCH',
          {
            ...(options as Record<string, unknown> | undefined),
            body: update.body,
          },
        ),
        mergeNavigation: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          update: ODataNavigationUpdate,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(
          client,
          navigationTargetPath(source, path, update.targetKey),
          'MERGE',
          {
            ...(options as Record<string, unknown> | undefined),
            body: update.body,
          },
        ),
        mergeNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          update: ODataNavigationUpdate,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          navigationTargetPath(source, path, update.targetKey),
          'MERGE',
          {
            ...(options as Record<string, unknown> | undefined),
            body: update.body,
          },
        ),
        removeNavigation: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<TResult> => $odata<TResult>(
          client,
          navigationTargetPath(source, path, targetKey),
          'DELETE',
          options as Record<string, unknown> | undefined,
        ),
        removeNavigationWithResponse: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          navigationTargetPath(source, path, targetKey),
          'DELETE',
          options as Record<string, unknown> | undefined,
        ),
        createMedia: <TResult>(
          body: ArrayBuffer | Uint8Array,
          options: ODataMediaCreateOptions,
        ): Promise<ODataMediaCreateResponse<TResult>> =>
          $odataCreateMedia<TResult>(client, collectionPath, body, options),
        createNavigationMedia: <TResult>(
          source: ODataNavigationSource,
          path: readonly string[],
          body: ArrayBuffer | Uint8Array,
          options: ODataMediaCreateOptions,
        ): Promise<ODataMediaCreateResponse<TResult>> =>
          $odataCreateMedia<TResult>(
            client,
            navigationCollectionPath(source, path),
            body,
            options,
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
          if (invocation.navigationPath !== undefined && invocation.key === undefined) {
            throw new TypeError(
              'An OData navigation-bound action requires an entity key.',
            )
          }
          const entityPath = invocation.key === undefined
            ? joinODataPath(servicePath, entitySet)
            : sourcePath(invocation.key)
          const bindingPath = invocation.navigationPath === undefined
            ? entityPath
            : joinODataPath(entityPath, formatODataNavigationPath(invocation.navigationPath))
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
          if (invocation.navigationPath !== undefined && invocation.key === undefined) {
            throw new TypeError(
              'An OData navigation-bound action requires an entity key.',
            )
          }
          const entityPath = invocation.key === undefined
            ? joinODataPath(servicePath, entitySet)
            : sourcePath(invocation.key)
          const bindingPath = invocation.navigationPath === undefined
            ? entityPath
            : joinODataPath(entityPath, formatODataNavigationPath(invocation.navigationPath))
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
        linkNavigationV2(source, navigationPath, targetEntitySet, targetKey, options) {
          return $odata(
            client,
            joinODataPath(
              servicePath,
              createODataV2NavigationReferencePath(entitySet, source, navigationPath),
            ),
            'POST',
            {
              ...(options as Record<string, unknown> | undefined),
              body: createODataV2EntityReference(targetEntitySet, targetKey),
            },
          )
        },
        linkNavigationV2WithResponse: <TResult>(
          source: ODataNavigationSource,
          navigationPath: readonly string[],
          targetEntitySet: string,
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          joinODataPath(
            servicePath,
            createODataV2NavigationReferencePath(entitySet, source, navigationPath),
          ),
          'POST',
          {
            ...(options as Record<string, unknown> | undefined),
            body: createODataV2EntityReference(targetEntitySet, targetKey),
          },
        ),
        unlinkNavigationV2(source, navigationPath, targetKey, options) {
          return $odata(
            client,
            joinODataPath(
              servicePath,
              createODataV2NavigationReferencePath(entitySet, source, navigationPath, targetKey),
            ),
            'DELETE',
            options as Record<string, unknown> | undefined,
          )
        },
        unlinkNavigationV2WithResponse: <TResult>(
          source: ODataNavigationSource,
          navigationPath: readonly string[],
          targetKey: ODataKey,
          options?: ODataRequestOptions,
        ): Promise<ODataMutationResponse<TResult>> => $odataMutationWithResponse<TResult>(
          client,
          joinODataPath(
            servicePath,
            createODataV2NavigationReferencePath(entitySet, source, navigationPath, targetKey),
          ),
          'DELETE',
          options as Record<string, unknown> | undefined,
        ),
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
    async v2ChangeSet(mutations, options = {}) {
      const payload = serializeODataChangeSet(mutations.map(v2AtomicMutationRequest))
      const response = await client.raw<string>(joinODataPath(servicePath, '$batch'), {
        ...options,
        method: 'POST',
        headers: mergeHeaders(options.headers, {
          'Accept': 'multipart/mixed',
          'Content-Type': payload.contentType,
          'DataServiceVersion': '2.0',
          'MaxDataServiceVersion': '2.0',
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
