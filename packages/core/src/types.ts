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
