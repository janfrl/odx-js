/**
 * A sample interface for testing.
 */
export interface SampleInterface {
  /**
   * The name of the sample.
   * @default "default-name"
   */
  name: string
  /**
   * An optional count.
   */
  count?: number
  /**
   * A complex type.
   */
  metadata: Record<string, any>
}

/**
 * A sample type alias.
 */
// eslint-disable-next-line ts/consistent-type-definitions -- fixture exercises API type-alias extraction
export type SampleType = {
  /**
   * ID of the type.
   */
  id: string | number
}

/**
 * A sample function.
 * @param param1 The first parameter.
 * @param param2 An optional second parameter.
 */
export function sampleFunction(param1: string, param2: number = 42): boolean {
  void param2
  return !!param1
}

/**
 * An unexported interface.
 */
interface _InternalInterface {
  secret: boolean
}
