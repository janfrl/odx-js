import type { H3Event } from 'h3'
import type { Hookable } from 'hookable'
import type { FetchOptions, FetchResponse } from 'ofetch'

export interface ODataProxyHooks {
  'odx:proxy:request': (ctx: { event: H3Event, serviceName: string, fetchOptions: FetchOptions }) => void | Promise<void>
  'odx:proxy:response': (ctx: { event: H3Event, serviceName: string, response: FetchResponse<any> }) => void | Promise<void>
  [key: `odx:proxy:request:${string}`]: (ctx: { event: H3Event, serviceName: string, fetchOptions: FetchOptions }) => void | Promise<void>
  [key: `odx:proxy:response:${string}`]: (ctx: { event: H3Event, serviceName: string, response: FetchResponse<any> }) => void | Promise<void>
}

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

/**
 * Possible types for OData entity keys.
 * Supports single keys (string/number) and composite keys (object).
 */
export type ODataKey = string | number | Record<string, string | number>

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
   * Include the count of the matching entities.
   * @default 'none'
   */
  $inlinecount?: 'allpages' | 'none'
  /** Search expression (OData V4). */
  $search?: string
  /** Allow for custom query parameters. */
  [key: string]: any
}

/**
 * Interface for a specific OData Entity Set.
 * T: The model type of the entity.
 */
export interface ODataEntitySet<T = any> {
  /**
   * Fetches a list of entities.
   */
  list: (query?: ODataQuery<T>, options?: any) => ODataAsyncDataPromise<T[]>
  /**
   * Fetches a single entity by key.
   * Key can be a single value or an object for composite keys.
   */
  get: (key: ODataKey, query?: ODataQuery<T>, options?: any) => ODataAsyncDataPromise<T>
  /**
   * Creates a new entity.
   */
  create: (body: Partial<T>) => Promise<T>
  /**
   * Updates an existing entity.
   */
  update: (key: ODataKey, body: Partial<T>) => Promise<T>
  /**
   * Deletes an entity.
   */
  remove: (key: ODataKey) => Promise<any>
}

/**
 * Generic OData Service interface.
 * E: Union of available entity set names.
 * M: Mapping of entity set names to their model types.
 */
export type ODataService<E extends string = string, M extends Record<string, any> = any> = {
  /**
   * Accesses a specific entity set of the service.
   */
  entitySet: <Name extends E>(name: Name) => ODataEntitySet<Name extends keyof M ? M[Name] : any>
} & {
  /**
   * Direct access to entity sets via properties.
   */
  [K in E]: ODataEntitySet<K extends keyof M ? M[K] : any>
}

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
  hooks?: Hookable<ODataProxyHooks>
  devtools?: {
    enabled?: boolean
    maxLogs?: number
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

export interface ODataPublicConfig {
  basePath?: string
  mode?: string
  services?: ODataServiceConfig[]
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
  devtools?: {
    /** @default true */
    enabled?: boolean
    /** @default 100 */
    maxLogs?: number
  }
}

// Global hook augmentations for Nitro
declare module 'nitropack' {
  interface NitroRuntimeHooks extends ODataProxyHooks {}
}

declare module 'h3' {
  interface H3EventContext {
    odataConfig: ODataProxyConfig
    odataAuth?: string
    securityContext?: any
  }
}
