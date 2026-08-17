import type {
  ODataCollectionPage,
  ODataEntityResponse,
  ODataEntitySet,
  ODataPagedEntitySet,
  ODataPagedService,
  ODataQuery,
  ODataRequestOptions,
  ODataService,
  ODataVersionedEntitySet,
  ODataVersionedService,
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

  it('adds count-aware pages without widening the base entity-set contract', () => {
    type BaseProductsService = ODataService<'Products', { Products: Product }>
    type ProductsService = ODataPagedService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<BaseProductsService['Products']>().toEqualTypeOf<ODataEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataPagedEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchPage']>>>()
      .toEqualTypeOf<ODataCollectionPage<Product>>()
  })

  it('specializes additive entity-response reads without widening to any', () => {
    type ProductsService = ODataVersionedService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataVersionedEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchOneWithResponse']>>>()
      .toEqualTypeOf<ODataEntityResponse<Product>>()
  })
})
