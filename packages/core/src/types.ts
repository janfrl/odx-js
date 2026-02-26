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

export interface ODataEntitySet<T = any> {
  list: <R = T>(query?: Record<string, string | number | boolean | null | undefined>) => any
  get: <R = T>(key: string | number, query?: Record<string, string | number | boolean | null | undefined>) => any
  create: <R = T>(body: any) => Promise<R>
  update: <R = T>(key: string | number, body: any) => Promise<R>
  remove: (key: string | number) => Promise<any>
}

/**
 * Generic OData Service interface.
 * E: Union of available entity set names.
 * M: Mapping of entity set names to their model types.
 */
export interface ODataService<E extends string = string, M extends Record<string, any> = any> extends ODataEntitySet {
  entities: <Name extends E>(name: Name) => ODataEntitySet<M extends Record<Name, any> ? M[Name] : any>
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
