<script setup lang="ts">
import rawEdmxSource from '~/edmx/demo-v4.edmx?raw'

const ATTRIBUTE_RE = /\s([\w:]+)="([^"]*)"/g
const SCHEMA_NAMESPACE_RE = /<Schema [^>]*Namespace="([^"]+)"/
const ENTITY_TYPE_RE = /<EntityType Name="([^"]+)"[^>]*>([\s\S]*?)<\/EntityType>/g
const PROPERTY_REF_RE = /<PropertyRef Name="([^"]+)"/g
const PROPERTY_RE = /<Property ([^/>]*)\/>/g
const NAVIGATION_PROPERTY_RE = /<NavigationProperty ([^>]*)>/g
const ENTITY_SET_RE = /<EntitySet Name="([^"]+)" EntityType="([^"]+)"/g

const route = useRoute()
const localePrefix = computed(() => route.path.startsWith('/de') ? '/de' : '/en')
const getStartedTo = computed(() => `${localePrefix.value}/ecosystem/introduction`)

const links = computed(() => [
  {
    label: 'Get started',
    to: getStartedTo.value,
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'GitHub',
    to: 'https://github.com/janfrl/odx-js',
    target: '_blank',
    color: 'neutral' as const,
    variant: 'subtle' as const,
    icon: 'i-simple-icons-github',
  },
])

interface SchemaResponse {
  name: string
  version: string
  namespace: string
  entities: Array<{
    name: string
    type: string
    properties: Array<{ name: string, type: string, isKey?: boolean }>
    navigationProperties: Array<{ name: string }>
  }>
}

const serviceName = 'demo'
const rawEdmx = rawEdmxSource.trim()

function parseAttributes(input: string) {
  const attributes: Record<string, string> = {}

  for (const match of input.matchAll(ATTRIBUTE_RE)) {
    const key = match[1]
    const value = match[2]

    if (key && value !== undefined)
      attributes[key] = value
  }

  return attributes
}

function parseDemoSchema(xml: string): SchemaResponse {
  const namespace = xml.match(SCHEMA_NAMESPACE_RE)?.[1] || 'DemoService'
  const entityTypes = new Map<string, SchemaResponse['entities'][number]>()

  for (const match of xml.matchAll(ENTITY_TYPE_RE)) {
    const type = match[1]
    const body = match[2] || ''

    if (!type)
      continue

    const keys = new Set(
      Array.from(body.matchAll(PROPERTY_REF_RE), match => match[1]).filter((name): name is string => Boolean(name)),
    )
    const properties = Array.from(body.matchAll(PROPERTY_RE), (match) => {
      const rawAttributes = match[1] || ''
      const attributes = parseAttributes(` ${rawAttributes}`)

      return {
        name: attributes.Name || '',
        type: attributes.Type || 'Edm.String',
        isKey: keys.has(attributes.Name || ''),
      }
    })
      .filter(property => property.name)

    const navigationProperties = Array.from(body.matchAll(NAVIGATION_PROPERTY_RE), (match) => {
      const rawAttributes = match[1] || ''
      const attributes = parseAttributes(` ${rawAttributes}`)

      return { name: attributes.Name || '' }
    })
      .filter(property => property.name)

    entityTypes.set(type, {
      name: type,
      type,
      properties,
      navigationProperties,
    })
  }

  const entities = Array.from(xml.matchAll(ENTITY_SET_RE), (match) => {
    const name = match[1]
    const qualifiedType = match[2]

    if (!name || !qualifiedType)
      return undefined

    const type = qualifiedType.split('.').pop() || qualifiedType
    const entityType = entityTypes.get(type)

    return {
      name,
      type,
      properties: entityType?.properties || [],
      navigationProperties: entityType?.navigationProperties || [],
    }
  })
    .filter((entity): entity is SchemaResponse['entities'][number] => Boolean(entity))

  return {
    name: serviceName,
    version: 'v4',
    namespace,
    entities,
  }
}

const schema = parseDemoSchema(rawEdmx)

const activeTab = ref<'usage' | 'schema' | 'edmx' | 'response'>('usage')

const tabs = [
  {
    value: 'usage',
    label: 'Nuxt',
    icon: 'i-simple-icons-nuxtdotjs',
    language: 'ts',
  },
  {
    value: 'schema',
    label: 'Schema',
    icon: 'i-lucide-waypoints',
  },
  {
    value: 'edmx',
    label: 'EDMX',
    icon: 'i-lucide-file-code-2',
    language: 'xml',
  },
  {
    value: 'response',
    label: 'Data',
    icon: 'i-lucide-database',
    language: 'json',
  },
] as const

function sampleValue(type: string, name: string, index: number) {
  if (name === 'ID')
    return `P-${String(index + 1).padStart(3, '0')}`
  if (name.endsWith('_ID'))
    return `C-${String(index + 1).padStart(3, '0')}`
  if (type.includes('Decimal') || type.includes('Double') || type.includes('Int'))
    return index === 0 ? 89.9 : 129.5
  if (type.includes('Boolean'))
    return index === 0
  if (name === 'Name')
    return index === 0 ? 'Desk Lamp' : 'Monitor Arm'
  return `${name} ${index + 1}`
}

const entities = computed(() => schema.entities)
const selectedEntity = computed(() => entities.value.find(entity => entity.name === 'Products') || entities.value[0])
const usageCode = `
const products = await useOData().demo.Products.list({
  $select: ['ID', 'Name', 'Price'],
  $expand: 'Category',
  $filter: 'Price gt 50',
  $top: 2,
})

products.data.value
`
const generatedModelSource = `
export interface Product {
  ID: string
  Name: string | null
  Price: number | null
  Category_ID: string | null
  Category?: Category | null
}
export interface Category {
  ID: string
  Name: string | null
  Products?: Product[]
}
`

const twoslashExtraFiles = {
  '/node_modules/#build/odx-types/demo/DemoServiceModel.d.ts': generatedModelSource,
  '/node_modules/@bc8-odx/core/index.d.ts': `
export interface ODataAsyncData<T> {
  data: { value: T | null }
  pending: { value: boolean }
  error: { value: unknown | null }
  refresh: () => Promise<void>
}
export type ODataAsyncDataPromise<T> = ODataAsyncData<T> & Promise<ODataAsyncData<T>>
export type ODataKey = string | number | Record<string, string | number>
export interface ODataQuery<T = unknown> {
  $select?: keyof T | (keyof T)[] | string
  $orderby?: string
  $top?: number
  $skip?: number
  $filter?: string
  $expand?: string
  $inlinecount?: 'allpages' | 'none'
  $search?: string
  [key: string]: unknown
}
export interface ODataEntitySet<T = unknown> {
  list: (query?: ODataQuery<T>) => ODataAsyncDataPromise<T[]>
  get: (key: ODataKey, query?: ODataQuery<T>) => ODataAsyncDataPromise<T>
  create: (body: Partial<T>) => Promise<T>
  update: (key: ODataKey, body: Partial<T>) => Promise<T>
  remove: (key: ODataKey) => Promise<unknown>
}
export type ODataService<E extends string = string, M extends Record<string, unknown> = Record<string, unknown>> = {
  entitySet: <Name extends E>(name: Name) => ODataEntitySet<Name extends keyof M ? M[Name] : unknown>
} & {
  [K in E]: ODataEntitySet<K extends keyof M ? M[K] : unknown>
}
export interface ODataServiceRegistry {}
`,
  '/node_modules/.nuxt/odx-types/demo/DemoServiceModel.d.ts': generatedModelSource,
  '/node_modules/.nuxt/odx-types/demo/DemoServiceModel.ts': generatedModelSource,
  '/node_modules/.nuxt/odx-types/index.d.ts': `
import type { ODataService, ODataServiceRegistry } from '@bc8-odx/core'
import type { Product, Category } from './demo/DemoServiceModel'

declare module '@bc8-odx/core' {
  interface ODataServiceRegistry {
    demo: ODataService<'Products' | 'Categories', {
      Products: Product
      Categories: Category
    }>
  }
}
`,
  '/node_modules/.nuxt/imports.d.ts': `
import type { ODataServiceRegistry } from '@bc8-odx/core'
import './odx-types'

declare global {
  const useOData: () => ODataServiceRegistry
}
export {}
`,
} satisfies Record<string, string>
const responseCode = computed(() => {
  const entity = selectedEntity.value
  if (!entity)
    return '{\n  "value": []\n}'

  const value = [0, 1].map((index) => {
    return Object.fromEntries(
      entity.properties.map(property => [
        property.name,
        sampleValue(property.type, property.name, index),
      ]),
    )
  })

  return JSON.stringify({
    '@odata.context': `$metadata#${entity.name}`,
    value,
  }, null, 2)
})
const usageMarkdown = `\`\`\`ts twoslash\n${usageCode}\n\`\`\``
const edmxMarkdown = `\`\`\`xml [EDMX]\n${rawEdmx}\n\`\`\``
const responseMarkdown = computed(() => `\`\`\`json [Data]\n${responseCode.value}\n\`\`\``)

async function renderCode(markdown: string) {
  const { transformerTwoslash } = await import('@shikijs/twoslash')
  const { parse } = await import('comark')
  const { default: highlight } = await import('comark/plugins/highlight')
  const { render } = await import('comark/render')
  const { default: xmlLang } = await import('shiki/langs/xml.mjs')
  const comarkPlugins = [
    highlight({
      languages: [xmlLang],
      transformers: [
        transformerTwoslash({
          explicitTrigger: true,
          twoslashOptions: {
            extraFiles: twoslashExtraFiles,
          },
        }),
      ],
    }),
  ]
  const tree = await parse(markdown, { plugins: comarkPlugins })
  return render(tree, { format: 'text/html' })
}

const usageHtml = useState('landing-hero-usage-html', () => '')
const edmxHtml = useState('landing-hero-edmx-html', () => '')
const responseHtml = useState('landing-hero-response-html', () => '')

if (import.meta.server) {
  usageHtml.value = await renderCode(usageMarkdown)
  edmxHtml.value = await renderCode(edmxMarkdown)
  responseHtml.value = await renderCode(responseMarkdown.value)
}

</script>

<template>
  <UPageHero
    headline="OData Developer Experience"
    title="Modern OData Developer Experience"
    description="ODX turns service metadata into typed clients, safer backend access, and a clearer development loop."
    orientation="horizontal"
    :links="links"
    :ui="{ container: 'py-20 sm:py-24 lg:py-28' }"
  >
    <template #headline>
      <ULink
        :to="getStartedTo"
      >
        <UBadge
          color="primary"
          variant="subtle"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        >
          Explorer 0.4: schema graph and live proxy tap
        </UBadge>
      </ULink>
    </template>

    <div class="landing-hero-demo mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-elevated/40 ring ring-default">
      <div class="border-b border-default p-3">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UIcon name="i-simple-icons-nuxtdotjs" class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-highlighted">
                Typed OData query
              </div>
              <div class="text-xs text-muted">
                Generated from {{ schema.namespace }} metadata
              </div>
            </div>
          </div>

          <div>
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ schema.version.toUpperCase() }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <UButton
            v-for="tab in tabs"
            :key="tab.value"
            :label="tab.label"
            :icon="tab.icon"
            :color="activeTab === tab.value ? 'primary' : 'neutral'"
            :variant="activeTab === tab.value ? 'solid' : 'outline'"
            size="sm"
            block
            @click="activeTab = tab.value"
          />
        </div>
      </div>

      <div class="h-[360px] overflow-hidden p-4 [&_.comark-content]:h-full [&_.comark-content>pre]:my-0! [&_.comark-content>pre]:h-full [&_.comark-content>pre]:w-full [&_.comark-content>pre]:overflow-auto">
        <div v-show="activeTab === 'usage'" class="flex h-full flex-col gap-3">
          <div class="min-h-0 h-full">
            <div class="comark-content" v-html="usageHtml" />
          </div>
        </div>
        <div v-show="activeTab === 'schema'" class="h-full overflow-y-auto">
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="entity in entities"
              :key="entity.name"
              class="rounded-md bg-default p-3 ring ring-default"
            >
              <div class="flex min-w-0 items-baseline gap-2">
                <span class="text-sm text-muted">
                  {{ entity.properties.length }}
                </span>
                <div class="truncate text-sm font-medium text-highlighted">
                  {{ entity.name }}
                </div>
                <div class="sr-only">
                  fields
                </div>
              </div>
              <div class="mt-0.5 text-xs text-muted">
                {{ entity.type }}
              </div>

              <div class="mt-3 flex flex-wrap gap-1.5">
                <UBadge
                  v-for="property in entity.properties.slice(0, 6)"
                  :key="property.name"
                  :color="property.isKey ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ property.name }}
                </UBadge>
              </div>

              <div v-if="entity.navigationProperties.length" class="mt-3 border-t border-default pt-3">
                <div class="mb-1.5 text-xs font-medium uppercase text-muted">
                  Relations
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="navigationProperty in entity.navigationProperties"
                    :key="navigationProperty.name"
                    color="neutral"
                    variant="outline"
                    size="sm"
                  >
                    {{ navigationProperty.name }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'edmx'" class="h-full">
          <div class="comark-content" v-html="edmxHtml" />
        </div>
        <div v-show="activeTab === 'response'" class="h-full">
          <div class="comark-content" v-html="responseHtml" />
        </div>
      </div>
    </div>
  </UPageHero>
</template>

<style>
.landing-hero-demo .twoslash {
  --twoslash-popup-bg: var(--ui-bg);
  --twoslash-popup-color: var(--ui-text-highlighted);
  --twoslash-border-color: var(--ui-border);
  --twoslash-docs-color: var(--ui-text-muted);
  --twoslash-popup-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
}

.landing-hero-demo .twoslash .twoslash-popup-container {
  max-width: min(28rem, calc(100vw - 48px));
  overflow: hidden;
  backdrop-filter: none;
}

.landing-hero-demo .twoslash .twoslash-popup-code,
.landing-hero-demo .twoslash .twoslash-popup-docs {
  background: var(--ui-bg);
}

.landing-hero-demo .twoslash .twoslash-popup-code pre,
.landing-hero-demo .twoslash .twoslash-popup-code code,
.landing-hero-demo .twoslash .twoslash-popup-code .line {
  background: var(--ui-bg) !important;
}
</style>
