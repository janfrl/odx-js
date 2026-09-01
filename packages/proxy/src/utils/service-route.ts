import type { ODataServiceConfig } from '@me-tools/odx-core'

const RE_BOUNDARY_SLASHES = /^\/+|\/+$/g
const RE_PATH_SEPARATOR = /[\\/]/u
const RE_WHITESPACE = /\s/u

/** Rejects service identifiers that could escape generated or cached file paths. */
export function assertSafeODataServiceName(value: string): void {
  if (typeof value !== 'string' || value.length === 0 || RE_PATH_SEPARATOR.test(value)) {
    throw new TypeError(
      `OData service name ${JSON.stringify(value)} must not be empty or contain path separators.`,
    )
  }
}

function fail(value: string): never {
  throw new TypeError(
    `OData service route ${JSON.stringify(value)} must be one exact local URL segment without traversal, queries, fragments, backslashes, or whitespace.`,
  )
}

/** Normalizes the optional slash boundary around a public service alias. */
export function normalizeODataServiceRoute(value: string): string {
  if (typeof value !== 'string'
    || value.length === 0
    || value.includes('\\')
    || value.includes('?')
    || value.includes('#')
    || RE_WHITESPACE.test(value)) {
    return fail(value)
  }
  const normalized = value.replace(RE_BOUNDARY_SLASHES, '')
  let decoded: string
  try {
    decoded = decodeURIComponent(normalized)
  }
  catch {
    return fail(value)
  }
  if (normalized.length === 0
    || normalized.includes('/')
    || decoded === '.'
    || decoded === '..'
    || decoded.includes('/')
    || decoded.includes('\\')
    || decoded.includes('?')
    || decoded.includes('#')
    || RE_WHITESPACE.test(decoded)) {
    return fail(value)
  }
  return normalized
}

function routeCandidates(service: ODataServiceConfig): readonly string[] {
  assertSafeODataServiceName(service.name)
  const route = service.route === undefined
    ? undefined
    : normalizeODataServiceRoute(service.route)
  try {
    const name = normalizeODataServiceRoute(service.name)
    return route === undefined || route.toLowerCase() === name.toLowerCase()
      ? [name]
      : [route, name]
  }
  catch (error) {
    if (route === undefined)
      throw error
    return [route]
  }
}

/** Rejects aliases and fallback names that would resolve to multiple services. */
export function assertUnambiguousODataServiceRoutes(
  services: readonly ODataServiceConfig[],
): void {
  const owners = new Map<string, ODataServiceConfig>()
  for (const service of services) {
    for (const candidate of routeCandidates(service)) {
      const key = candidate.toLowerCase()
      const owner = owners.get(key)
      if (owner !== undefined && owner !== service) {
        throw new TypeError(
          `OData service route ${JSON.stringify(candidate)} is ambiguous between services ${JSON.stringify(owner.name)} and ${JSON.stringify(service.name)}.`,
        )
      }
      owners.set(key, service)
    }
  }
}

/** Returns service configs with normalized explicit aliases after collision checks. */
export function normalizeODataServiceRoutes(
  services: readonly ODataServiceConfig[],
): ODataServiceConfig[] {
  const normalized = services.map((service) => {
    assertSafeODataServiceName(service.name)
    return {
      ...service,
      ...(service.route === undefined
        ? {}
        : { route: normalizeODataServiceRoute(service.route) }),
    }
  })
  assertUnambiguousODataServiceRoutes(normalized)
  return normalized
}

/** Finds exactly one configured service by its validated public route. */
export function findODataServiceByRoute(
  services: readonly ODataServiceConfig[],
  requestedRoute: string,
): ODataServiceConfig | undefined {
  const route = normalizeODataServiceRoute(requestedRoute).toLowerCase()
  const matches = services.filter(service =>
    routeCandidates(service).some(candidate => candidate.toLowerCase() === route),
  )
  if (matches.length > 1) {
    throw new TypeError(
      `OData service route ${JSON.stringify(requestedRoute)} resolves to multiple configured services.`,
    )
  }
  return matches[0]
}
