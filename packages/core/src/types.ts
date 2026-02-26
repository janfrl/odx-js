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
  list: (query?: Record<string, string | number | boolean | null | undefined>) => any
  get: (key: string | number, query?: Record<string, string | number | boolean | null | undefined>) => any
  create: (body: any) => Promise<T>
  update: (key: string | number, body: any) => Promise<T>
  remove: (key: string | number) => Promise<T>
}

export interface ODataService extends ODataEntitySet {
  entities: (name: string) => ODataEntitySet
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
