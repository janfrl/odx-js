export interface EntityProperty {
  name: string
  type: string
  isKey: boolean
}

export interface NavigationProperty {
  name: string
  relationship: string
  fromRole: string
  toRole: string
}

export interface AssociationEnd {
  type: string
  role: string
  multiplicity: string
}

export interface Association {
  name: string
  ends: AssociationEnd[]
}

export interface EntityMapping {
  name: string
  type: string
  properties: EntityProperty[]
  navigationProperties: NavigationProperty[]
}

export interface ODataRule {
  /** The type of rule to apply (e.g., 'allowOnlyMethods', 'requireScope'). */
  type: 'allowOnlyMethods' | 'denyMethods' | 'requireScope' | 'requireAttribute' | 'denyPath' | 'denyIfHeader' | 'injectHeader' | 'rewritePath' | 'validate' | (string & {})
  /** The value for the rule (e.g., ['GET', 'POST'], 'Admin', '/$metadata'). */
  value: any
  /** Optional custom error message when the rule fails. */
  reason?: string
}

export interface ODataServiceConfig {
  name: string
  url: string
  route?: string
  icon?: string
  strategy?: 'proxied' | 'direct'
  proxyMode?: 'stream' | 'buffer'
  /**
   * SAP CSRF policy for proxied mutations. Generic OData services default to
   * `none`; set `mode: 'sap'` to enable request-scoped token preparation.
   */
  csrf?: {
    mode?: 'sap' | 'none'
    /** Request method used to obtain the token. @default 'HEAD' */
    fetchMethod?: 'HEAD' | 'GET'
  }
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
    mockUserCompanies?: Array<{ company: string, source: string }>
  }
  headers?: Record<string, string>
  rules?: ODataRule[]
}

/**
 * Minimal interface mimicking Nuxt's AsyncData for type inference.
 * The intersection with the raw type T helps the Vue template compiler
 * and IDE to see the unwrapped types without a direct Vue dependency.
 */
export interface ODataAsyncData<T> {
  /**
   * Reactive data payload.
   * @default null
   */
  data: { value: T | null } & (T | null)
  /**
   * Boolean state indicating if the request is in-flight.
   * @default false
   */
  pending: { value: boolean } & boolean
  /**
   * Error object if the request failed.
   * @default null
   */
  error: { value: any | null } & any
  /**
   * Status of the request: idle, pending, success, or error.
   * @default 'idle'
   */
  status: { value: 'idle' | 'pending' | 'success' | 'error' } & ('idle' | 'pending' | 'success' | 'error')
  /** Function to manually refresh the data. */
  refresh: (opts?: any) => Promise<void>
  /** Function to execute the request. */
  execute: (opts?: any) => Promise<void>
  /** Function to clear the data and error states. */
  clear: () => void
}

/**
 * Combined type that is both the data object and a promise resolving to it.
 */
export type ODataAsyncDataPromise<T> = ODataAsyncData<T> & Promise<ODataAsyncData<T>>

/** Opaque query component for one server-driven collection continuation. */
export interface ODataContinuation {
  readonly token: string
}

/**
 * Serializable collection result for list UIs that need the server-side count.
 * Unlike an extra property attached to an array, this shape survives Nuxt SSR
 * payload serialization.
 */
export interface ODataCollectionPage<T> {
  items: T[]
  totalCount?: number
  /** Safe server-driven continuation without a backend origin or path. */
  continuation?: ODataContinuation
}

/**
 * An entity read together with its optimistic-concurrency validator.
 * Arbitrary transport headers and OData metadata intentionally remain hidden.
 */
export interface ODataEntityResponse<T> {
  data: T
  etag?: string
}

/**
 * An entity mutation response with an optional representation. OData services
 * may legitimately answer PATCH with `204 No Content` while still returning
 * the next ETag header.
 */
export interface ODataMutationResponse<T> {
  data?: T
  etag?: string
}

/**
 * Possible types for OData entity keys.
 * Supports single keys (string/number) and composite keys (object).
 */
export type ODataKey
  = | string
    | number
    | boolean
    | Record<string, string | number | boolean>

/** One keyed containment hop below an entity-set root. */
export interface ODataContainedEntitySegment {
  readonly navigationPath: readonly string[]
  readonly key: ODataKey
}

/**
 * Structured source for navigation operations below a contained entity.
 * Keeping keys separate from navigation names prevents callers from building
 * executable OData resource paths with string concatenation.
 */
export interface ODataContainedEntitySource {
  readonly kind: 'contained-entity'
  readonly rootKey: ODataKey
  readonly path: readonly ODataContainedEntitySegment[]
}

/** Root entity key or an exact contained entity below that root. */
export type ODataNavigationSource = ODataKey | ODataContainedEntitySource

/**
 * Portable options shared by imperative OData reads and mutations.
 *
 * Framework adapters may accept additional transport-specific properties, but
 * portable consumers can rely on cancellation and exact request headers without
 * importing Nuxt, ofetch, or Node.js types.
 */
export interface ODataRequestOptions {
  readonly signal?: AbortSignal
  readonly headers?: Readonly<Record<string, string>>
  readonly [key: string]: unknown
}

export type ODataFunctionParameterValue = string | number | boolean | null

export interface ODataFunctionParameter {
  /** Primitive EDM type used to serialize the URL literal safely. */
  readonly type: string
  readonly value: ODataFunctionParameterValue
}

export interface ODataFunctionInvocation {
  /** Entity key for an entity- or navigation-bound function. */
  readonly key?: ODataKey
  /** Optional navigation binding below the keyed entity. */
  readonly navigationPath?: string | readonly string[]
  /** Typed non-binding parameters serialized with OData inline syntax. */
  readonly parameters?: Readonly<Record<string, ODataFunctionParameter>>
}

export interface ODataActionInvocation<TParameters = Record<string, unknown>> {
  /** Root entity key or exact contained entity for an entity- or navigation-bound action. */
  readonly key?: ODataNavigationSource
  /** Optional navigation binding below the keyed entity. */
  readonly navigationPath?: string | readonly string[]
  /** OData action parameters serialized as the POST body. */
  readonly parameters?: TParameters
}

/**
 * Structured OData query options.
 * T: The model type of the entity being queried.
 */
export interface ODataQuery<T = any> {
  /** Select specific properties to return. */
  $select?: keyof T | (keyof T)[] | string
  /** Sort order (e.g. 'Price desc'). */
  $orderby?: string
  /**
   * Number of results to return.
   * @default undefined
   */
  $top?: number
  /**
   * Number of results to skip (offset).
   * @default 0
   */
  $skip?: number
  /** Filter expression to restrict the results. */
  $filter?: string
  /** Expand navigation properties. */
  $expand?: string
  /**
   * Include the count of matching entities in OData V4 responses.
   */
  $count?: boolean
  /**
   * Include the count of matching entities in OData V2 responses.
   * @default 'none'
   */
  $inlinecount?: 'allpages' | 'none'
  /** Search expression (OData V4). */
  $search?: string
  /** Aggregation pipeline (OData V4 Data Aggregation extension). */
  $apply?: string
  /** Allow for custom query parameters. */
  [key: string]: any
}

/**
 * Interface for a specific OData Entity Set.
 * T: The model type of the entity.
 */
export interface ODataEntitySet<T = any> {
  /**
   * Explicit runtime capability marker for structured contained-navigation
   * sources. Consumers must not infer this support from method names because
   * older ODX releases accepted only an entity key in the same position.
   */
  readonly supportsContainedNavigationSources?: true
  /**
   * Fetches a list of entities.
   */
  list: (query?: ODataQuery<T>, options?: any) => ODataAsyncDataPromise<T[]>
  /**
   * Performs an imperative list read without requiring a Nuxt composable
   * setup context.
   */
  fetchList: (query?: ODataQuery<T>, options?: ODataRequestOptions) => Promise<T[]>

  /**
   * Performs an imperative collection read relative to an existing entity.
   * The navigation path accepts either a single slash-delimited path or
   * validated path segments.
   */
  fetchNavigationList: (
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    query?: ODataQuery<T>,
    options?: ODataRequestOptions,
  ) => Promise<T[]>

  /**
   * Performs an imperative single-entity read without requiring a Nuxt
   * composable setup context.
   */
  fetchOne: (key: ODataKey, query?: ODataQuery<T>, options?: ODataRequestOptions) => Promise<T>

  /**
   * Fetches a single entity by key.
   * Key can be a single value or an object for composite keys.
   */
  get: (key: ODataKey, query?: ODataQuery<T>, options?: any) => ODataAsyncDataPromise<T>
  /**
   * Creates a new entity.
   */
  create: (body: Partial<T>, options?: ODataRequestOptions) => Promise<T>
  /**
   * Creates a new entity through a collection-valued navigation property of
   * an existing parent entity.
   */
  createNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    body: Readonly<Record<string, unknown>>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  /**
   * Updates an entity addressed through a navigation property of an existing
   * parent entity. Omit `targetKey` for a single-valued navigation and provide
   * it for an entity in a collection-valued navigation.
   */
  updateNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    update: ODataNavigationUpdate,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  /**
   * Deletes an entity addressed through a contained collection-valued
   * navigation while preserving the exact parent and related-entity identity.
   * This is an entity DELETE, not a non-contained relationship `$ref` unlink.
   */
  removeNavigation: (
    source: ODataNavigationSource,
    navigationPath: readonly string[],
    targetKey: ODataKey,
    options?: ODataRequestOptions,
  ) => Promise<unknown>
  /**
   * Updates an existing entity.
   */
  update: (key: ODataKey, body: Partial<T>, options?: ODataRequestOptions) => Promise<T>
  /**
   * Deletes an entity.
   */
  remove: (key: ODataKey, options?: ODataRequestOptions) => Promise<unknown>
  /** Invokes an unbound, collection-, entity-, or navigation-bound OData action. */
  invoke: <TResult = unknown, TParameters = Record<string, unknown>>(
    action: string,
    invocation?: ODataActionInvocation<TParameters>,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
  /** Invokes an unbound, collection-, entity-, or navigation-bound OData function. */
  invokeFunction: <TResult = unknown>(
    functionName: string,
    invocation?: ODataFunctionInvocation,
    options?: ODataRequestOptions,
  ) => Promise<TResult>
}

/**
 * Entity-set client with explicit, SSR-safe collection page reads. This
 * extends the original entity-set contract without making existing structural
 * implementations of `ODataEntitySet` add new required methods.
 */
export interface ODataPagedEntitySet<T = any> extends ODataEntitySet<T> {
  readonly supportsCollectionPages: true
  /**
   * Fetches entities and preserves an OData V2 `__count` or V4 `@odata.count`
   * in an SSR-safe object shape.
   */
  listPage: (query?: ODataQuery<T>, options?: any) => ODataAsyncDataPromise<ODataCollectionPage<T>>
  /** Imperative counterpart to `listPage`. */
  fetchPage: (query?: ODataQuery<T>, options?: ODataRequestOptions) => Promise<ODataCollectionPage<T>>
  /**
   * Reads a related collection through Nuxt AsyncData. The caller supplies the
   * related result model because a navigation path can target another entity
   * type than the root entity set.
   */
  listNavigation: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    query?: ODataQuery<TResult>,
    options?: any,
  ) => ODataAsyncDataPromise<TResult[]>
}

/** Entity-set client with safe server-driven paging support. */
export interface ODataContinuationEntitySet<T = any> extends ODataPagedEntitySet<T> {
  readonly supportsContinuations: true
  /** Reads the next page through Nuxt AsyncData on the current entity set. */
  listNextPage: (
    continuation: ODataContinuation,
    options?: any,
  ) => ODataAsyncDataPromise<ODataCollectionPage<T>>
  /** Imperatively reads the next page on the current entity set. */
  fetchNextPage: (
    continuation: ODataContinuation,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<T>>
  /** Reads a page from a related collection through Nuxt AsyncData. */
  listNavigationPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    query?: ODataQuery<TResult>,
    options?: any,
  ) => ODataAsyncDataPromise<ODataCollectionPage<TResult>>
  /** Imperative counterpart to `listNavigationPage`. */
  fetchNavigationPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    query?: ODataQuery<TResult>,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
  /** Continues a related collection through Nuxt AsyncData. */
  listNavigationNextPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    continuation: ODataContinuation,
    options?: any,
  ) => ODataAsyncDataPromise<ODataCollectionPage<TResult>>
  /** Imperatively continues a related collection on the same navigation path. */
  fetchNavigationNextPage: <TResult = unknown>(
    source: ODataNavigationSource,
    navigationPath: string | readonly string[],
    continuation: ODataContinuation,
    options?: ODataRequestOptions,
  ) => Promise<ODataCollectionPage<TResult>>
}

/**
 * Entity-set client with explicit access to optimistic-concurrency metadata.
 * Kept separate so existing structural `ODataPagedEntitySet` implementations
 * remain source-compatible.
 */
export interface ODataVersionedEntitySet<T = any> extends ODataPagedEntitySet<T> {
  readonly supportsEntityResponses: true
  /**
   * Imperatively reads one entity and preserves its ETag for a subsequent
   * conditional mutation. Existing `fetchOne` remains body-only.
   */
  fetchOneWithResponse: (
    key: ODataKey,
    query?: ODataQuery<T>,
    options?: ODataRequestOptions,
  ) => Promise<ODataEntityResponse<T>>
}

/**
 * Entity-set client with an explicit optimistic-concurrency mutation path.
 * Kept separate so structural implementations of `ODataVersionedEntitySet`
 * remain source-compatible.
 */
export interface ODataConcurrencyEntitySet<T = any> extends ODataVersionedEntitySet<T> {
  readonly supportsOptimisticConcurrency: true
  /**
   * Conditionally updates one entity while preserving the response ETag.
   * Existing `update` remains body-only and source-compatible.
   */
  updateWithResponse: (
    key: ODataKey,
    body: Partial<T>,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<T>>
}

/** Entity-set client with explicit SAP Gateway OData V2 MERGE updates. */
export interface ODataMergeEntitySet<T = any> extends ODataConcurrencyEntitySet<T> {
  readonly supportsMerge: true
  /** Performs an explicit SAP Gateway OData V2 MERGE update. */
  merge: (key: ODataKey, body: Partial<T>, options?: ODataRequestOptions) => Promise<T>
  /** Performs MERGE and preserves its optional representation and next ETag. */
  mergeWithResponse: (
    key: ODataKey,
    body: Partial<T>,
    options?: ODataRequestOptions,
  ) => Promise<ODataMutationResponse<T>>
}

/** Complete entity-set capability implemented by the generated ODX client. */
export type ODataRuntimeEntitySet<T = any>
  = ODataMergeEntitySet<T> & ODataContinuationEntitySet<T>

/** Describes a PATCH target below a parent entity navigation path. */
export interface ODataNavigationUpdate {
  /** PATCH payload for the related entity. */
  body: Readonly<Record<string, unknown>>
  /** Related entity key for a collection navigation; omit for a to-one navigation. */
  targetKey?: ODataKey
}

/** Updates an entity as one member of an atomic OData changeset. */
export interface ODataAtomicUpdate {
  readonly kind: 'update'
  readonly entitySet: string
  readonly key: ODataKey
  readonly body: Readonly<Record<string, unknown>>
  readonly headers?: Readonly<Record<string, string>>
}

/** Updates a related entity as one member of an atomic OData changeset. */
export interface ODataAtomicNavigationUpdate {
  readonly kind: 'update-navigation'
  readonly entitySet: string
  readonly key: ODataNavigationSource
  readonly navigationPath: readonly string[]
  readonly targetKey?: ODataKey
  readonly body: Readonly<Record<string, unknown>>
  readonly headers?: Readonly<Record<string, string>>
}

/** Creates a related entity as one member of an atomic OData changeset. */
export interface ODataAtomicNavigationCreate {
  readonly kind: 'create-navigation'
  readonly entitySet: string
  readonly key: ODataNavigationSource
  readonly navigationPath: readonly string[]
  readonly body: Readonly<Record<string, unknown>>
  readonly headers?: Readonly<Record<string, string>>
}

/** Deletes a related entity as one member of an atomic OData changeset. */
export interface ODataAtomicNavigationDelete {
  readonly kind: 'delete-navigation'
  readonly entitySet: string
  readonly key: ODataNavigationSource
  readonly navigationPath: readonly string[]
  readonly targetKey: ODataKey
  readonly headers?: Readonly<Record<string, string>>
}

/** Invokes an OData action as one member of an atomic changeset. */
export type ODataAtomicAction
  = | {
    readonly kind: 'action'
    readonly scope: 'service'
    readonly action: string
    readonly parameters?: Readonly<Record<string, unknown>>
    readonly headers?: Readonly<Record<string, string>>
  }
  | {
    readonly kind: 'action'
    readonly scope: 'collection'
    readonly entitySet: string
    readonly action: string
    readonly parameters?: Readonly<Record<string, unknown>>
    readonly headers?: Readonly<Record<string, string>>
  }
  | {
    readonly kind: 'action'
    readonly scope: 'entity'
    readonly entitySet: string
    readonly key: ODataNavigationSource
    readonly action: string
    readonly parameters?: Readonly<Record<string, unknown>>
    readonly headers?: Readonly<Record<string, string>>
  }

/** A mutation supported by the typed service-level atomic changeset API. */
export type ODataAtomicMutation
  = | ODataAtomicAction
    | ODataAtomicUpdate
    | ODataAtomicNavigationCreate
    | ODataAtomicNavigationDelete
    | ODataAtomicNavigationUpdate

/**
 * Generic OData Service interface.
 * E: Union of available entity set names.
 * M: Mapping of entity set names to their model types.
 */
type ODataServiceContract<
  E extends string,
  M extends Record<string, any>,
  TEntitySet extends ODataEntitySet<any>,
> = {
  /** Advertises typed OData action members inside atomic changesets. */
  readonly supportsAtomicActionChangesets?: true
  /** Advertises multiple independent changesets inside one OData batch. */
  readonly supportsBatchChangeSets?: true
  /**
   * Accesses a specific entity set of the service.
   */
  entitySet: <Name extends E>(name: Name) => ODataEntitySetWithModel<TEntitySet, Name extends keyof M ? M[Name] : any>
  /** Invokes a service-level unbound OData action. */
  invoke: ODataEntitySet<never>['invoke']
  /** Invokes an unbound OData function. */
  invokeFunction: ODataEntitySet<never>['invokeFunction']
  /**
   * Executes one or more mutations as a single atomic OData changeset.
   * The promise rejects when the server rejects any changeset member.
   */
  changeSet: (
    mutations: readonly ODataAtomicMutation[],
    options?: ODataRequestOptions,
  ) => Promise<readonly import('./odata-changeset').ODataChangeSetResponse[]>
  /**
   * Executes independent mutation groups in one batch without collapsing
   * successful groups when another changeset fails.
   */
  batchChangeSets?: (
    changeSets: readonly (readonly ODataAtomicMutation[])[],
    options?: ODataRequestOptions,
  ) => Promise<readonly import('./odata-changeset').ODataBatchChangeSetResult[]>
} & {
  /**
   * Direct access to entity sets via properties.
   */
  [K in E]: ODataEntitySetWithModel<TEntitySet, K extends keyof M ? M[K] : any>
}

type ODataEntitySetWithModel<TEntitySet extends ODataEntitySet<any>, TModel>
  = TEntitySet extends ODataRuntimeEntitySet<any>
    ? ODataRuntimeEntitySet<TModel>
    : TEntitySet extends ODataMergeEntitySet<any>
      ? ODataMergeEntitySet<TModel>
      : TEntitySet extends ODataContinuationEntitySet<any>
        ? ODataContinuationEntitySet<TModel>
        : TEntitySet extends ODataConcurrencyEntitySet<any>
          ? ODataConcurrencyEntitySet<TModel>
          : TEntitySet extends ODataVersionedEntitySet<any>
            ? ODataVersionedEntitySet<TModel>
            : TEntitySet extends ODataPagedEntitySet<any>
              ? ODataPagedEntitySet<TModel>
              : ODataEntitySet<TModel>

export type ODataService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataEntitySet<any>>

/**
 * OData service whose entity sets expose explicit collection-page reads.
 * Kept separate so structural implementations of `ODataService` remain valid.
 */
export type ODataPagedService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataPagedEntitySet<any>>

/** OData service whose entity sets expose explicit entity response metadata. */
export type ODataVersionedService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataVersionedEntitySet<any>>

/** OData service with explicit optimistic-concurrency mutation responses. */
export type ODataConcurrencyService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataConcurrencyEntitySet<any>>

/** OData service whose entity sets expose explicit SAP Gateway MERGE updates. */
export type ODataMergeService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataMergeEntitySet<any>>

/** Complete service capability implemented by the generated ODX client. */
export type ODataRuntimeService<E extends string = string, M extends Record<string, any> = any>
  = ODataServiceContract<E, M, ODataRuntimeEntitySet<any>>

/**
 * Global registry for OData services.
 * Can be augmented by generated types.
 */
export interface ODataServiceRegistry {}

export type RegisteredServiceNames = keyof ODataServiceRegistry | (string & {})

export interface ODataProxyConfig {
  services: ODataServiceConfig[]
  buildDir: string
  rootDir: string
  destination?: string
  headers?: Record<string, string>
  forwardAuthHeader?: boolean
  rejectUnauthorized?: boolean
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
    mockUserCompanies?: Array<{ company: string, source: string }>
  }
  basePath: string
  mode: string
  defaultProxyMode?: 'stream' | 'buffer'
  /**
   * Optional host-specific hook dispatcher. The proxy package supplies the
   * concrete Nitro/Hookable type without coupling core to a server framework.
   */
  hooks?: unknown
  telemetry?: {
    enabled?: boolean
  }
  security?: {
    /**
     * Enable SAP XSUAA token validation in the Node.js Nitro host.
     * This adapter is opt-in so portable Nitro targets do not bundle the
     * Node-only SAP security SDK.
     */
    sapXsuaa?: boolean
  }

  devtools?: {
    enabled?: boolean
    maxLogs?: number
    logPayloads?: boolean
    maxPayloadBytes?: number
    logStore?: OdxRuntimeLogStoreConfig
  }
}

export interface OdxRuntimeLogStoreConfig {
  /**
   * `memory` keeps logs in process memory. `sql` enables persistent storage
   * through the proxy-owned database adapter.
   * @default 'memory'
   */
  provider?: 'memory' | 'sql'
  sql?: {
    /**
     * SQL connector used by the proxy-owned persistent log adapter.
     * @default inferred from `url` or `path`
     */
    connector?: 'postgresql' | 'sqlite'
    /**
     * Database connection URL for network SQL providers such as PostgreSQL.
     */
    url?: string
    /**
     * Local SQLite file path for development or explicit single-instance demos.
     */
    path?: string
  }
}

export interface ODataExplorerServiceInfo {
  name: string
  route?: string
  icon?: string
  strategy?: 'proxied' | 'direct'
  proxyMode?: 'stream' | 'buffer'
  entities?: EntityMapping[]
  isGenerated?: boolean
  version?: 'v2' | 'v4' | null
  metadata?: ODataExplorerMetadataState
}

export interface ODataExplorerMetadataState {
  status: 'available' | 'stale' | 'missing'
  source: 'remote' | 'cache' | 'local' | null
  stale: boolean
  staleReason: string | null
  refreshedAt: string | null
  timestamp: number | null
  hash: string | null
  bytes: number | null
  message?: string
}

export interface ODataExplorerConfigResponse {
  basePath: string
  mode: string
  services: ODataExplorerServiceInfo[]
  forwardAuthHeader?: boolean
  versions?: {
    node: string
    module: string
  }
}

export interface ODataPublicServiceConfig {
  name: string
  strategy?: 'proxied' | 'direct'
  route?: string
  /** Required in browser runtime config only for direct services. */
  url?: string
}

export interface ODataPublicConfig {
  basePath?: string
  mode?: string
  services?: ODataPublicServiceConfig[]
}

export interface ModuleOptions {
  /**
   * The Nitro route prefix where the proxy handlers are mounted.
   * @default '/api/odx'
   */
  basePath?: string
  /**
   * The generation mode.
   * @default 'sdk'
   */
  mode?: 'sdk'
  /**
   * Default response handling mode for the proxy.
   * @default 'stream'
   */
  defaultProxyMode?: 'stream' | 'buffer'
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
    mockUserCompanies?: Array<{ company: string, source: string }>
  }
  headers?: Record<string, string>
  /**
   * Whether to reject unauthorized TLS certificates.
   * @default true
   */
  rejectUnauthorized?: boolean
  /**
   * Whether to forward the Authorization header to the OData backend.
   * @default true
   */
  forwardAuthHeader?: boolean
  /**
   * List of OData services to configure.
   * @default []
   */
  services?: ODataServiceConfig[]
  buildDir?: string
  rootDir?: string
  btpConfigService?: string
  telemetry?: {
    /**
     * Publish privacy-safe completed-request summaries to the host hook.
     * @default false
     */
    enabled?: boolean
  }
  security?: {
    /**
     * Enable SAP XSUAA token validation in the Node.js Nitro host.
     * Requires `@sap/xsenv` and `@sap/xssec` and must not be enabled for
     * non-Node deployment targets.
     * @default false
     */
    sapXsuaa?: boolean
  }

  devtools?: {
    /** @default true */
    enabled?: boolean
    /** @default 100 */
    maxLogs?: number
    /**
     * Store bounded request and response payload previews in development logs.
     * Production proxy tracing remains disabled by default.
     * @default true
     */
    logPayloads?: boolean
    /**
     * Maximum serialized bytes retained for each logged request/response payload.
     * Larger payloads are replaced with a truncated preview marker.
     * @default 32768
     */
    maxPayloadBytes?: number
    logStore?: OdxRuntimeLogStoreConfig
  }
}
