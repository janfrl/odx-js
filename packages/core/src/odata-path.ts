import type {
  ODataContainedEntitySource,
  ODataFunctionParameter,
  ODataFunctionParameterValue,
  ODataKey,
  ODataNavigationSource,
} from './types'

const RE_IDENTIFIER = /^[A-Za-z_]\w*$/u
const RE_QUALIFIED_NAME = /^(?:[A-Za-z_]\w*\.)+[A-Za-z_]\w*$/u
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/u
const RE_DATE_TIME_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/u
const RE_DURATION = /^-?P(?=\d|T\d)(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/u
const RE_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const RE_LEADING_SLASHES = /^\/+/
const RE_INTEGER_MARKER = /[.e]/iu
const RE_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu
const RE_SINGLE_QUOTE = /'/g
const RE_TIME_OF_DAY = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/u
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

function quotedLiteral(value: string): string {
  return `'${encodeURIComponent(value).replace(RE_SINGLE_QUOTE, '\'\'')}'`
}

function requireStringLiteral(
  value: ODataFunctionParameterValue,
  type: string,
  pattern?: RegExp,
): string {
  if (typeof value !== 'string' || (pattern !== undefined && !pattern.test(value)))
    throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
  return value
}

function numericLiteral(
  value: ODataFunctionParameterValue,
  type: string,
  integer: boolean,
): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (integer && !Number.isSafeInteger(value)))
      throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
    return String(value)
  }
  if (typeof value !== 'string'
    || !RE_NUMBER.test(value)
    || (integer && RE_INTEGER_MARKER.test(value))) {
    throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
  }
  return value
}

/** Serializes one typed primitive for OData V4 function inline-parameter syntax. */
export function formatODataFunctionParameter(
  parameter: ODataFunctionParameter,
): string {
  const { type, value } = parameter
  if (value === null)
    return 'null'
  switch (type) {
    case 'Edm.String':
      return quotedLiteral(requireStringLiteral(value, type))
    case 'Edm.Boolean':
      if (typeof value !== 'boolean')
        throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
      return String(value)
    case 'Edm.Byte':
    case 'Edm.Int16':
    case 'Edm.Int32':
    case 'Edm.SByte':
      return numericLiteral(value, type, true)
    case 'Edm.Decimal':
    case 'Edm.Double':
    case 'Edm.Int64':
    case 'Edm.Single':
      return numericLiteral(value, type, false)
    case 'Edm.Guid':
      return requireStringLiteral(value, type, RE_GUID)
    case 'Edm.Date':
      return requireStringLiteral(value, type, RE_DATE)
    case 'Edm.DateTimeOffset':
      return encodeURIComponent(requireStringLiteral(value, type, RE_DATE_TIME_OFFSET))
    case 'Edm.TimeOfDay':
      return encodeURIComponent(requireStringLiteral(value, type, RE_TIME_OF_DAY))
    case 'Edm.Duration':
      return `duration${quotedLiteral(requireStringLiteral(value, type, RE_DURATION))}`
    case 'Edm.Binary':
      return `binary${quotedLiteral(requireStringLiteral(value, type))}`
    default:
      throw new TypeError(`Unsupported OData function parameter type "${type}".`)
  }
}

/** Creates a validated qualified function call segment with inline parameters. */
export function formatODataFunctionCall(
  qualifiedName: string,
  parameters: Readonly<Record<string, ODataFunctionParameter>> = {},
): string {
  const serialized = Object.entries(parameters)
    .map(([name, parameter]) =>
      `${validateODataIdentifier(name, 'OData function parameter')}=${formatODataFunctionParameter(parameter)}`,
    )
    .join(',')
  return `${validateODataQualifiedName(qualifiedName, 'OData function')}(${serialized})`
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

/** Creates a safe service-relative entity reference for an OData `$ref` body. */
export function createODataEntityReference(
  entitySet: string,
  key: ODataKey,
): Readonly<{ '@odata.id': string }> {
  return Object.freeze({ '@odata.id': createODataEntityPath(entitySet, key) })
}

function isContainedEntitySource(
  source: ODataNavigationSource,
): source is ODataContainedEntitySource {
  return typeof source === 'object'
    && source !== null
    && 'kind' in source
    && source.kind === 'contained-entity'
    && 'rootKey' in source
    && 'path' in source
    && Array.isArray(source.path)
}

/** Creates the exact keyed source path for a navigation operation. */
export function createODataNavigationSourcePath(
  entitySet: string,
  source: ODataNavigationSource,
): string {
  if (!isContainedEntitySource(source))
    return createODataEntityPath(entitySet, source)
  if (source.path.length === 0) {
    throw new TypeError(
      'A contained entity source requires at least one keyed containment segment.',
    )
  }
  return source.path.reduce((current, segment) => joinODataPath(
    current,
    `${formatODataNavigationPath(segment.navigationPath)}(${formatODataKey(segment.key)})`,
  ), createODataEntityPath(entitySet, source.rootKey))
}
