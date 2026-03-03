export interface ODataServiceConfig {
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
 * The intersection with the raw type T helps the Vue template compiler
 * and IDE to see the unwrapped types without a direct Vue dependency.
 */
export interface ODataAsyncData<T> {
  data: { value: T | null } & (T | null)
  pending: { value: boolean } & boolean
  error: { value: any | null } & any
  status: { value: 'idle' | 'pending' | 'success' | 'error' } & ('idle' | 'pending' | 'success' | 'error')
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
 * Structured OData query options.
 * T: The model type of the entity being queried.
 */
export interface ODataQuery<T = any> {
  /**
   * Select specific properties to return.
   * Can be a single property name, an array of names, or a comma-separated string.
   */
  $select?: keyof T | (keyof T)[] | string
  /**
   * Filter expression to restrict the results.
   */
  $filter?: string
  /**
   * Order the results by specific properties.
   */
  $orderby?: string
  /**
   * Number of results to return.
   */
  $top?: number
  /**
   * Number of results to skip.
   */
  $skip?: number
  /**
   * Expand navigation properties.
   */
  $expand?: string
  /**
   * Include the count of the matching entities.
   */
  $inlinecount?: 'allpages' | 'none'
  /**
   * Search expression (OData V4).
   */
  $search?: string
  /**
   * Allow for custom query parameters.
   */
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
  services?: ODataServiceConfig[]
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
  services?: ODataServiceConfig[]
  buildDir?: string
  rootDir?: string
  devtools?: {
    enabled?: boolean
    maxLogs?: number
  }
}
