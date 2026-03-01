export interface SapODataService {
  name: string
  url: string
  route?: string
  icon?: string
  strategy?: 'proxied' | 'direct'
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
  }
  headers?: Record<string, string>
}

/**
 * Minimal interface mimicking Nuxt's AsyncData for type inference.
 * It uses a structure compatible with Vue Refs for the script block,
 * while allowing the template to see the unwrapped type.
 */
export interface ODataAsyncData<T> {
  data: { value: T | null } | T | any
  pending: { value: boolean } | boolean | any
  error: { value: any | null } | any
  status: { value: 'idle' | 'pending' | 'success' | 'error' } | any
  refresh: (opts?: any) => Promise<void>
  execute: (opts?: any) => Promise<void>
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
 * Interface for a specific OData Entity Set.
 * T: The model type of the entity.
 */
export interface ODataEntitySet<T = any> {
  /**
   * Fetches a list of entities.
   */
  list: (query?: Record<string, string | number | boolean | null | undefined>) => ODataAsyncDataPromise<T[]>
  /**
   * Fetches a single entity by key.
   * Key can be a single value or an object for composite keys.
   */
  get: (key: ODataKey, query?: Record<string, string | number | boolean | null | undefined>) => ODataAsyncDataPromise<T>
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
export interface ODataService<E extends string = string, M extends Record<string, any> = any> extends ODataEntitySet {
  /**
   * Accesses a specific entity set of the service.
   */
  entities: <Name extends E>(name: Name) => ODataEntitySet<Name extends keyof M ? M[Name] : any>
}

/**
 * Global registry for OData services.
 * Can be augmented by generated types.
 */
export interface ODataServiceRegistry {}

export type RegisteredServiceNames = keyof ODataServiceRegistry | (string & {})

export interface ODataProxyConfig {
  services: SapODataService[]
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
  }
  basePath: string
  mode: string
  devtools?: {
    maxLogs?: number
  }
}

export interface ODataPublicConfig {
  basePath?: string
  mode?: string
  services?: SapODataService[]
}

export interface ModuleOptions {
  mode?: 'sdk'
  basePath?: string
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
  }
  headers?: Record<string, string>
  rejectUnauthorized?: boolean
  forwardAuthHeader?: boolean
  services?: SapODataService[]
  buildDir?: string
  devtools?: {
    enabled?: boolean
    maxLogs?: number
  }
}
