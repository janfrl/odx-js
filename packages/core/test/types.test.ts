import type {
  ODataEntitySet,
  ODataQuery,
  ODataRequestOptions,
  ODataService,
} from '../src'
import { describe, expectTypeOf, it } from 'vitest'

interface Product {
  ID: number
  Revenue: number
}

describe('portable imperative transport types', () => {
  it('exposes cancellation and headers without a framework transport type', () => {
    expectTypeOf<NonNullable<Parameters<ODataEntitySet<Product>['fetchList']>[1]>>()
      .toExtend<ODataRequestOptions>()
    expectTypeOf<NonNullable<Parameters<ODataEntitySet<Product>['update']>[2]>>()
      .toExtend<ODataRequestOptions>()
    expectTypeOf<NonNullable<Parameters<ODataService['changeSet']>[1]>>()
      .toExtend<ODataRequestOptions>()
  })

  it('declares analytical apply as a portable query option', () => {
    expectTypeOf<ODataQuery<Product>['$apply']>().toEqualTypeOf<string | undefined>()
  })
})
