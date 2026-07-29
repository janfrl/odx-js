import type { ODataKey } from './types'

const RE_IDENTIFIER = /^[A-Za-z_]\w*$/u
const RE_QUALIFIED_NAME = /^(?:[A-Za-z_]\w*\.)+[A-Za-z_]\w*$/u
const RE_LEADING_SLASHES = /^\/+/
const RE_SINGLE_QUOTE = /'/g
const RE_TRAILING_SLASHES = /\/+$/

/** Validates and returns one OData identifier without path delimiters. */
export function validateODataIdentifier(
  value: string,
  label = 'OData identifier',
): string {
  if (!RE_IDENTIFIER.test(value))
    throw new TypeError(`${label} "${value}" requires a valid identifier.`)
  return value
}

/** Validates and returns a namespace-qualified OData name. */
export function validateODataQualifiedName(
  value: string,
  label = 'OData qualified name',
): string {
  if (!RE_QUALIFIED_NAME.test(value))
    throw new TypeError(`${label} "${value}" requires a qualified name.`)
  return value
}

/** Serializes a primitive or composite OData entity key for a resource path. */
export function formatODataKey(key: ODataKey): string {
  const formatValue = (value: string | number | boolean): string =>
    typeof value === 'string'
      ? `'${encodeURIComponent(value).replace(RE_SINGLE_QUOTE, '\'\'')}'`
      : String(value)

  if (typeof key !== 'object')
    return formatValue(key)

  const entries = Object.entries(key)
  if (entries.length === 0)
    throw new TypeError('An OData composite key requires at least one field.')

  return entries
    .map(([name, value]) => `${validateODataIdentifier(name, 'OData key field')}=${formatValue(value)}`)
    .join(',')
}

/** Validates and joins one or more navigation-property segments. */
export function formatODataNavigationPath(
  navigationPath: string | readonly string[],
): string {
  const segments = typeof navigationPath === 'string'
    ? navigationPath.split('/')
    : navigationPath
  if (segments.length === 0
    || segments.some(segment => !RE_IDENTIFIER.test(segment))) {
    throw new TypeError(
      'An OData navigation path requires one or more valid identifier segments.',
    )
  }
  return segments.join('/')
}

/** Joins already-addressable OData path fragments without altering URL schemes. */
export function joinODataPath(base: string, ...segments: readonly string[]): string {
  const normalizedBase = base.replace(RE_TRAILING_SLASHES, '')
  const normalizedSegments = segments
    .filter(Boolean)
    .map(segment => segment.replace(RE_LEADING_SLASHES, '').replace(RE_TRAILING_SLASHES, ''))
    .filter(Boolean)

  return normalizedSegments.length > 0
    ? [normalizedBase, ...normalizedSegments].join('/')
    : normalizedBase
}

/** Creates an exact entity resource path from a set name and key. */
export function createODataEntityPath(entitySet: string, key: ODataKey): string {
  return `${validateODataIdentifier(entitySet, 'OData entity set')}(${formatODataKey(key)})`
}
