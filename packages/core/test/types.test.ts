import type {
  ODataActionInvocation,
  ODataActionResponse,
  ODataActionResponseEntitySet,
  ODataActionResponseService,
  ODataAtomicMutation,
  ODataCollectionPage,
  ODataConcurrencyEntitySet,
  ODataConcurrencyService,
  ODataContainedEntityResponseSet,
  ODataContinuationEntitySet,
  ODataCreateEntitySet,
  ODataCreateResponse,
  ODataCreateService,
  ODataDeleteResponse,
  ODataDeleteResponseEntitySet,
  ODataDeleteResponseService,
  ODataEntityResponse,
  ODataEntitySet,
  ODataMediaCreateResponse,
  ODataMediaMutationResponse,
  ODataMergeEntitySet,
  ODataMergeService,
  ODataMutationResponse,
  ODataNavigationEntityRead,
  ODataNavigationMergeEntitySet,
  ODataNavigationMergeService,
  ODataNavigationReferenceEntitySet,
  ODataNavigationReferenceResponseEntitySet,
  ODataNavigationReferenceResponseService,
  ODataNavigationReferenceService,
  ODataPagedEntitySet,
  ODataPagedService,
  ODataQuery,
  ODataRequestOptions,
  ODataRuntimeEntitySet,
  ODataRuntimeService,
  ODataService,
  ODataServiceConfig,
  ODataV2AtomicMutation,
  ODataV2FunctionImportResponseService,
  ODataV2FunctionImportService,
  ODataV2NavigationReferenceEntitySet,
  ODataV2NavigationReferenceService,
  ODataVersionedEntitySet,
  ODataVersionedNavigationEntitySet,
  ODataVersionedNavigationService,
  ODataVersionedService,
} from '../src'
import { describe, expectTypeOf, it } from 'vitest'

interface Product {
  ID: number
  Revenue: number
}

describe('portable imperative transport types', () => {
  it('allows server-owned BTP destination resolution without a backend URL', () => {
    expectTypeOf<{
      name: 'BusinessPartner'
      destination: 'S4_BUSINESS_PARTNER'
    }>().toExtend<ODataServiceConfig>()
  })

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
    expectTypeOf<ODataRuntimeService['supportsAtomicMediaChangesets']>()
      .toEqualTypeOf<true | undefined>()
    expectTypeOf<NonNullable<ODataRuntimeService['v2ChangeSet']>>()
      .toBeFunction()
    expectTypeOf<ODataRuntimeService['supportsV2AtomicChangesets']>()
      .toEqualTypeOf<true | undefined>()
    expectTypeOf<ODataRuntimeService['supportsV2AtomicNavigationMutations']>()
      .toEqualTypeOf<true | undefined>()
    expectTypeOf<ODataRuntimeService['supportsV2AtomicRootMutations']>()
      .toEqualTypeOf<true | undefined>()
    expectTypeOf<{
      kind: 'create'
      entitySet: 'Products'
      body: { Name: string }
    }>().toExtend<ODataAtomicMutation>()
    expectTypeOf<{
      kind: 'delete'
      entitySet: 'Products'
      key: number
      headers: { 'If-Match': string }
    }>().toExtend<ODataV2AtomicMutation>()
    expectTypeOf<{
      kind: 'update-media'
      entitySet: 'Documents'
      key: number
      streamProperty: 'Content'
      contentType: 'application/pdf'
      body: Uint8Array
    }>().toExtend<ODataAtomicMutation>()
    expectTypeOf<{
      kind: 'update-navigation'
      entitySet: 'Products'
      key: number
      navigationPath: readonly ['Category']
      body: { Name: string }
    }>().toExtend<ODataV2AtomicMutation>()
    expectTypeOf<{
      kind: 'create-navigation'
      entitySet: 'Products'
      key: number
      navigationPath: readonly ['Reviews']
      body: { Text: string }
    }>().toExtend<ODataV2AtomicMutation>()
    expectTypeOf<{
      kind: 'delete-navigation'
      entitySet: 'Products'
      key: number
      navigationPath: readonly ['Reviews']
      targetKey: number
    }>().toExtend<ODataV2AtomicMutation>()
  })

  it('keeps V2 FunctionImports as an additive service capability', () => {
    expectTypeOf<ODataService<'Products', { Products: Product }>>()
      .not
      .toHaveProperty('invokeFunctionImport')
    expectTypeOf<ODataV2FunctionImportService['invokeFunctionImport']>()
      .toBeFunction()
    expectTypeOf<ODataRuntimeService['supportsV2FunctionImports']>()
      .toEqualTypeOf<true>()
    expectTypeOf<ODataV2FunctionImportService<'Products', { Products: Product }>>()
      .not
      .toHaveProperty('invokeFunctionImportWithResponse')
    expectTypeOf<ODataV2FunctionImportResponseService['invokeFunctionImportWithResponse']>()
      .toBeFunction()
    expectTypeOf<ODataRuntimeService['supportsV2FunctionImportResponses']>()
      .toEqualTypeOf<true>()
    expectTypeOf<Awaited<ReturnType<ODataRuntimeService['invokeFunctionImportWithResponse']>>>()
      .toEqualTypeOf<ODataActionResponse<unknown>>()
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
      .toEqualTypeOf<ODataMutationResponse<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['updateNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<unknown>>()
  })

  it('adds explicit MERGE without widening the concurrency contract', () => {
    type ProductsService = ODataMergeService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataMergeEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['merge']>>>()
      .toEqualTypeOf<Product>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['mergeWithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<Product>>()
  })

  it('adds navigation MERGE without widening root MERGE clients', () => {
    type ProductsService = ODataNavigationMergeService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataNavigationMergeEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['mergeNavigation']>>>()
      .toEqualTypeOf<unknown>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['mergeNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<unknown>>()
    expectTypeOf<ODataMergeEntitySet<Product>>()
      .not
      .toHaveProperty('mergeNavigation')
  })

  it('preserves typed response metadata for exact related entities', () => {
    type ProductsService = ODataVersionedNavigationService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>
    type RelatedRead = ODataNavigationEntityRead<{ ID: number, Name: string }>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataVersionedNavigationEntitySet<Product>>()
    expectTypeOf<RelatedRead['targetKey']>().toEqualTypeOf<import('../src').ODataKey | undefined>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchNavigationOneWithResponse']>>>()
      .toEqualTypeOf<ODataEntityResponse<unknown>>()
    expectTypeOf<ODataVersionedEntitySet<Product>>()
      .not
      .toHaveProperty('fetchNavigationOneWithResponse')
  })

  it('keeps exact contained reads capability-marked', () => {
    expectTypeOf<ODataRuntimeEntitySet<Product>>()
      .toExtend<ODataContainedEntityResponseSet<Product>>()
    expectTypeOf<Awaited<ReturnType<ODataRuntimeEntitySet<Product>['fetchContainedOneWithResponse']>>>()
      .toEqualTypeOf<ODataEntityResponse<unknown>>()
    expectTypeOf<ODataEntitySet<Product>>()
      .not
      .toHaveProperty('fetchContainedOneWithResponse')
  })

  it('adds create responses without widening the base entity-set contract', () => {
    type ProductsService = ODataCreateService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataCreateEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['createWithResponse']>>>()
      .toEqualTypeOf<ODataCreateResponse<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['createNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataCreateResponse<unknown>>()
    expectTypeOf<ODataEntitySet<Product>>()
      .not
      .toHaveProperty('createWithResponse')
  })

  it('adds action responses without widening body-only invocation', () => {
    type ProductsService = ODataActionResponseService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataActionResponseEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['invokeWithResponse']>>>()
      .toEqualTypeOf<ODataActionResponse<unknown>>()
    expectTypeOf<Awaited<ReturnType<ProductsService['invokeWithResponse']>>>()
      .toEqualTypeOf<ODataActionResponse<unknown>>()
    expectTypeOf<ODataActionResponse<unknown>['location']>()
      .toEqualTypeOf<string | undefined>()
    expectTypeOf<ODataEntitySet<Product>>()
      .not
      .toHaveProperty('invokeWithResponse')
  })

  it('adds delete responses without widening body-only removal', () => {
    type ProductsService = ODataDeleteResponseService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataDeleteResponseEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['removeWithResponse']>>>()
      .toEqualTypeOf<ODataDeleteResponse<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['removeNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataDeleteResponse<unknown>>()
    expectTypeOf<ODataEntitySet<Product>>()
      .not
      .toHaveProperty('removeWithResponse')
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

  it('preserves relationship-write responses without widening the reference contract', () => {
    type ProductsService = ODataNavigationReferenceResponseService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataNavigationReferenceResponseEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['linkNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<unknown>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['unlinkNavigationWithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<unknown>>()
    expectTypeOf<ODataNavigationReferenceEntitySet<Product>>()
      .not
      .toHaveProperty('linkNavigationWithResponse')
  })

  it('keeps SAP Gateway V2 relationship writes behind an additive entity-set contract', () => {
    type ProductsService = ODataV2NavigationReferenceService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataV2NavigationReferenceEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet['supportsV2NavigationReferences']>()
      .toEqualTypeOf<true>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['linkNavigationV2WithResponse']>>>()
      .toEqualTypeOf<ODataMutationResponse<unknown>>()
    expectTypeOf<ODataNavigationReferenceEntitySet<Product>>()
      .not
      .toHaveProperty('linkNavigationV2')
  })

  it('combines generated runtime capabilities without widening additive contracts', () => {
    type ProductsService = ODataRuntimeService<'Products', { Products: Product }>
    type ProductsEntitySet = ReturnType<ProductsService['entitySet']>

    expectTypeOf<ProductsEntitySet>().toExtend<ODataRuntimeEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataMergeEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataCreateEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataActionResponseEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataDeleteResponseEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataContinuationEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataVersionedNavigationEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataNavigationReferenceResponseEntitySet<Product>>()
    expectTypeOf<ProductsEntitySet>().toExtend<ODataV2NavigationReferenceEntitySet<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchNextPage']>>>()
      .toEqualTypeOf<ODataCollectionPage<Product>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['fetchNavigationPage']>>>()
      .toEqualTypeOf<ODataCollectionPage<unknown>>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['updateMedia']>>>()
      .toEqualTypeOf<ODataMediaMutationResponse>()
    expectTypeOf<ODataMediaMutationResponse['sapMessage']>()
      .toEqualTypeOf<string | undefined>()
    expectTypeOf<Awaited<ReturnType<ProductsEntitySet['createMedia']>>>()
      .toEqualTypeOf<ODataMediaCreateResponse<Product>>()
    expectTypeOf<ODataMediaCreateResponse<Product>['entityId']>()
      .toEqualTypeOf<string | undefined>()
  })
})
