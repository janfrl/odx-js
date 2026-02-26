export interface SapODataService {
  name: string
  url: string
  route?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
  }
  headers?: Record<string, string>
}

/**
 * Minimal interface mimicking Nuxt's AsyncData for type inference.
 */
export interface ODataAsyncData<T> {
  data: { value: T | null }
  pending: { value: boolean }
  error: { value: any | null }
  status: { value: 'idle' | 'pending' | 'success' | 'error' }
  refresh: (opts?: any) => Promise<void>
  execute: (opts?: any) => Promise<void>
  clear: () => void
}

/**
 * Combined type that is both the data object and a promise resolving to it.
 */
export type ODataAsyncDataPromise<T> = ODataAsyncData<T> & Promise<ODataAsyncData<T>>

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
   */
  get: (key: string | number, query?: Record<string, string | number | boolean | null | undefined>) => ODataAsyncDataPromise<T>
  /**
   * Creates a new entity.
   */
  create: (body: Partial<T>) => Promise<T>
  /**
   * Updates an existing entity.
   */
  update: (key: string | number, body: Partial<T>) => Promise<T>
  /**
   * Deletes an entity.
   */
  remove: (key: string | number) => Promise<any>
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
