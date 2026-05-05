import { vi } from 'vitest'

export const useFetch = vi.fn((url, options) => ({ url, options }))

export const useRuntimeConfig = vi.fn(() => (globalThis as typeof globalThis & {
  __odxRuntimeConfig: unknown
}).__odxRuntimeConfig)
