import type {
  ODataActionInvocation,
  ODataCollectionPage,
  ODataConcurrencyEntitySet,
  ODataConcurrencyService,
  ODataContinuationEntitySet,
  ODataEntityResponse,
  ODataEntitySet,
  ODataMergeEntitySet,
  ODataMergeService,
  ODataNavigationReferenceEntitySet,
  ODataNavigationReferenceService,
  ODataPagedEntitySet,
  ODataPagedService,
  ODataQuery,
  ODataRequestOptions,
  ODataRuntimeEntitySet,
  ODataRuntimeService,
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
    expectTypeOf<NonNullable<ODataRuntimeService['batchChangeSets']>>()
      .toBeFunction()
    expectTypeOf<ODataRuntimeService['supportsBatchChangeSets']>()
      .toEqualTypeOf<true | undefined>()
  })

  it('declares analytical apply as a portable query option', () => {
    expectTypeOf<ODataQuery<Product>['$apply']>().toEqualTypeOf<string | undefined>()
  })

  it('addresses navigation-bound action targets without executable path strings', () => {
    type Invocation = ODataActionInvocation<{ Percent: number }>

    expectTypeOf<{
      readonly kind: 'contained-entity'
      readonly rootKey: number
      readonly path: readonly [{
        readonly navigationPath: readonly ['Items']
        readonly key: number
      }]
    }>().toExtend<NonNullable<Invocation['key']>>()
    expectTypeOf<Invocation['navigationPath']>()
      .toEqualTypeOf<string | readonly string[] | undefined>()
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

  it('adds mutation responses without widening the versioned read contract', () => {
    type ProductsService = ODataConcurrencyService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataConcurrencyEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['updateWithResponse']>>>()
      .toEqualTypeOf<{ data?: Product, etag?: string }>()
  })

  it('adds explicit MERGE without widening the concurrency contract', () => {
    type ProductsService = ODataMergeService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataMergeEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['merge']>>>()
      .toEqualTypeOf<Product>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['mergeWithResponse']>>>()
      .toEqualTypeOf<{ data?: Product, etag?: string }>()
  })

  it('adds relationship references without widening the base entity-set contract', () => {
    type ProductsService = ODataNavigationReferenceService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataNavigationReferenceEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet['supportsNavigationReferences']>()
      .toEqualTypeOf<true>()
    expectTypeOf<ODataEntitySet<Product>>()
      .not
      .toHaveProperty('linkNavigation')
  })

  it('combines generated runtime capabilities without widening additive contracts', () => {
    type ProductsService = ODataRuntimeService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataRuntimeEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataMergeEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataContinuationEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchNextPage']>>>()
      .toEqualTypeOf<ODataCollectionPage<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchNavigationPage']>>>()
      .toEqualTypeOf<ODataCollectionPage<unknown>>()
  })
})
