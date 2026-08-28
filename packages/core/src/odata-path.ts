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
const RE_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?$/u
const RE_DATE_TIME_OFFSET_V2 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?(Z|([+-])(\d{2}):(\d{2}))$/u
const RE_DATE_TIME_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/u
const RE_DURATION = /^-?P(?=\d|T\d)(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/u
const RE_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const RE_HEX_BINARY = /^(?:[0-9a-f]{2})+$/iu
const RE_LEADING_SLASHES = /^\/+/
const RE_INTEGER_MARKER = /[.e]/iu
const RE_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu
const RE_SINGLE_QUOTE = /'/g
const RE_TIME_OF_DAY = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/u
const RE_TRAILING_SLASHES = /\/+$/
const RE_V2_DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u
const RE_V2_FLOAT = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu
const RE_V2_TIME = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d{1,7}))?S)?$/u

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

function invalidParameterValue(type: string): never {
  throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
}

function v2IntegerLiteral(
  value: ODataFunctionParameterValue,
  type: string,
  minimum: bigint,
  maximum: bigint,
): string {
  const literal = numericLiteral(value, type, true)
  const parsed = BigInt(literal)
  if (parsed < minimum || parsed > maximum)
    invalidParameterValue(type)
  return literal
}

function v2NumericLiteral(
  value: ODataFunctionParameterValue,
  type: string,
  pattern: RegExp,
): string {
  const literal = typeof value === 'number'
    ? Number.isFinite(value) ? String(value) : invalidParameterValue(type)
    : requireStringLiteral(value, type)
  if (!pattern.test(literal))
    invalidParameterValue(type)
  return literal
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function requireV2DateTime(
  value: ODataFunctionParameterValue,
  type: string,
  offset: boolean,
): string {
  const literal = requireStringLiteral(value, type)
  const match = (offset ? RE_DATE_TIME_OFFSET_V2 : RE_DATE_TIME).exec(literal)
  if (match === null)
    invalidParameterValue(type)
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const daysInMonth = month === 2
    ? isLeapYear(year) ? 29 : 28
    : [4, 6, 9, 11].includes(month) ? 30 : 31
  if (year < 1753 || month < 1 || month > 12 || day < 1 || day > daysInMonth
    || Number(hourText) > 23 || Number(minuteText) > 59
    || (secondText !== undefined && Number(secondText) > 59)) {
    invalidParameterValue(type)
  }
  if (offset) {
    const offsetHours = Number(match[10])
    const offsetMinutes = Number(match[11])
    if (match[8] !== 'Z'
      && (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0))) {
      invalidParameterValue(type)
    }
  }
  return literal
}

function requireV2Time(
  value: ODataFunctionParameterValue,
  type: string,
): string {
  const literal = requireStringLiteral(value, type)
  const match = RE_V2_TIME.exec(literal)
  if (match === null || match.slice(1).every(part => part === undefined)
    || Number(match[1] ?? 0) > 23
    || Number(match[2] ?? 0) > 59
    || Number(match[3] ?? 0) > 59) {
    invalidParameterValue(type)
  }
  return literal
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

/** Serializes typed primitive parameters for OData V2 service-operation URIs. */
export function formatODataV2FunctionImportParameters(
  parameters: Readonly<Record<string, ODataFunctionParameter>> = {},
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const [name, parameter] of Object.entries(parameters)) {
    const parameterName = validateODataIdentifier(name, 'OData V2 FunctionImport parameter')
    const { type, value } = parameter
    if (value === null)
      continue

    let literal: string
    switch (type) {
      case 'Edm.String':
        literal = `'${requireStringLiteral(value, type).replace(RE_SINGLE_QUOTE, '\'\'')}'`
        break
      case 'Edm.Boolean':
        if (typeof value !== 'boolean')
          throw new TypeError(`OData function parameter type "${type}" received an invalid value.`)
        literal = String(value)
        break
      case 'Edm.Byte':
        literal = v2IntegerLiteral(value, type, 0n, 255n)
        break
      case 'Edm.Int16':
        literal = v2IntegerLiteral(value, type, -32768n, 32767n)
        break
      case 'Edm.Int32':
        literal = v2IntegerLiteral(value, type, -2147483648n, 2147483647n)
        break
      case 'Edm.SByte':
        literal = v2IntegerLiteral(value, type, -128n, 127n)
        break
      case 'Edm.Decimal':
        literal = `${v2NumericLiteral(value, type, RE_V2_DECIMAL)}M`
        break
      case 'Edm.Double':
        literal = typeof value === 'string' && ['NaN', 'INF', '-INF'].includes(value)
          ? value
          : `${v2NumericLiteral(value, type, RE_V2_FLOAT)}D`
        break
      case 'Edm.Int64':
        literal = `${v2IntegerLiteral(value, type, -9223372036854775808n, 9223372036854775807n)}L`
        break
      case 'Edm.Single':
        literal = typeof value === 'string' && ['NaN', 'INF', '-INF'].includes(value)
          ? value
          : `${v2NumericLiteral(value, type, RE_V2_FLOAT)}F`
        break
      case 'Edm.Guid':
        literal = `guid'${requireStringLiteral(value, type, RE_GUID)}'`
        break
      case 'Edm.DateTime':
        literal = `datetime'${requireV2DateTime(value, type, false)}'`
        break
      case 'Edm.DateTimeOffset':
        literal = `datetimeoffset'${requireV2DateTime(value, type, true)}'`
        break
      case 'Edm.Time':
        literal = `time'${requireV2Time(value, type)}'`
        break
      case 'Edm.Binary':
        literal = `X'${requireStringLiteral(value, type, RE_HEX_BINARY)}'`
        break
      default:
        throw new TypeError(
          `Unsupported OData V2 FunctionImport parameter type "${type}".`,
        )
    }
    result[parameterName] = literal
  }
  return Object.freeze(result)
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

/** Creates a validated entity or named-stream `$value` resource path. */
export function createODataMediaPath(
  entitySet: string,
  key: ODataNavigationSource,
  streamProperty?: string,
): string {
  return joinODataPath(
    createODataNavigationSourcePath(entitySet, key),
    ...(streamProperty === undefined
      ? []
      : [validateODataIdentifier(streamProperty, 'OData stream property')]),
    '$value',
  )
}

/** Creates a safe service-relative entity reference for an OData `$ref` body. */
export function createODataEntityReference(
  entitySet: string,
  key: ODataKey,
): Readonly<{ '@odata.id': string }> {
  return Object.freeze({ '@odata.id': createODataEntityPath(entitySet, key) })
}

/** Creates a safe service-relative entity reference for an OData V2 `$links` body. */
export function createODataV2EntityReference(
  entitySet: string,
  key: ODataKey,
): Readonly<{ uri: string }> {
  return Object.freeze({ uri: createODataEntityPath(entitySet, key) })
}

/** Creates a bounded OData V2 `$links` path for one direct navigation property. */
export function createODataV2NavigationReferencePath(
  entitySet: string,
  source: ODataNavigationSource,
  navigationPath: readonly string[],
  targetKey?: ODataKey,
): string {
  if (navigationPath.length !== 1) {
    throw new TypeError(
      'An OData V2 navigation reference requires exactly one navigation path segment.',
    )
  }
  const navigation = validateODataIdentifier(
    navigationPath[0]!,
    'OData V2 navigation reference',
  )
  return joinODataPath(
    createODataNavigationSourcePath(entitySet, source),
    '$links',
    targetKey === undefined
      ? navigation
      : `${navigation}(${formatODataKey(targetKey)})`,
  )
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
      'A contained entity source requires at least one containment segment.',
    )
  }
  return source.path.reduce((current, segment) => joinODataPath(
    current,
    segment.key === undefined
      ? formatODataNavigationPath(segment.navigationPath)
      : `${formatODataNavigationPath(segment.navigationPath)}(${formatODataKey(segment.key)})`,
  ), createODataEntityPath(entitySet, source.rootKey))
}

/**
 * Creates the exact `$root` reference for a collection-valued navigation.
 *
 * Aggregation transformations can use this service-root-relative identity
 * without asking higher layers to serialize entity keys or containment paths.
 */
export function createODataNavigationRootReference(
  entitySet: string,
  source: ODataNavigationSource,
  navigationPath: string | readonly string[],
): string {
  return joinODataPath(
    '$root',
    createODataNavigationSourcePath(entitySet, source),
    formatODataNavigationPath(navigationPath),
  )
}
