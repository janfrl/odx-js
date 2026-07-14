<script setup lang="ts">
import { recomputeAllPoppers } from 'floating-vue'
import rawEdmxSource from '~/edmx/demo-v4.edmx?raw'

const props = withDefaults(defineProps<{
  headline?: string
  title?: string
  description?: string
  explorer?: string
  getStarted?: string
  getStartedTo?: string
  githubLabel?: string
  cardTitle?: string
  cardSubtitlePrefix?: string
  metadata?: string
  fields?: string
  relations?: string
  dataTab?: string
}>(), {
  headline: 'OData Developer Experience',
  title: 'Modern OData Developer Experience',
  description: 'ODX turns service metadata into typed clients, safer backend access, and a clearer development loop.',
  explorer: 'Explorer 0.4: schema graph and live proxy tap',
  getStarted: 'Get started',
  getStartedTo: '/en/ecosystem/introduction',
  githubLabel: 'GitHub',
  cardTitle: 'Typed OData query',
  cardSubtitlePrefix: 'Generated from',
  metadata: 'metadata',
  fields: 'fields',
  relations: 'Relations',
  dataTab: 'Data',
})

const ATTRIBUTE_RE = /\s([\w:]+)="([^"]*)"/g
const SCHEMA_NAMESPACE_RE = /<Schema [^>]*Namespace="([^"]+)"/
const ENTITY_TYPE_RE = /<EntityType Name="([^"]+)"[^>]*>([\s\S]*?)<\/EntityType>/g
const PROPERTY_REF_RE = /<PropertyRef Name="([^"]+)"/g
const PROPERTY_RE = /<Property ([^/>]*)\/>/g
const NAVIGATION_PROPERTY_RE = /<NavigationProperty ([^>]*)>/g
const ENTITY_SET_RE = /<EntitySet Name="([^"]+)" EntityType="([^"]+)"/g

const links = computed(() => [
  {
    label: props.getStarted,
    to: props.getStartedTo,
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: props.githubLabel,
    to: 'https://github.com/me-tools/odx',
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
const metadataTo = `/__odx__/schema?service=${serviceName}&raw=true`
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

const tabs = computed(() => [
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
    label: props.dataTab,
    icon: 'i-lucide-database',
    language: 'json',
  },
])

const demoRef = ref<HTMLElement | null>(null)
const twoslashPopupCleanup: Array<() => void> = []
let twoslashResizeObserver: ResizeObserver | undefined

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
const { data: products } = await useOData()
  .demo.Products
  .list({
    $select: ['ID', 'Name', 'Price'],
    $expand: 'Category',
    $filter: 'Price gt 50',
    $top: 2,
  })

type ProductShape = Expand<
  ODataItem<typeof products.value>
>
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
  '/node_modules/@me-tools/odx-core/index.d.ts': `
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
import type { ODataService, ODataServiceRegistry } from '@me-tools/odx-core'
import type { Product, Category } from './demo/DemoServiceModel'

declare module '@me-tools/odx-core' {
  interface ODataServiceRegistry {
    demo: ODataService<'Products' | 'Categories', {
      Products: Product
      Categories: Category
    }>
  }
}
`,
  '/node_modules/.nuxt/imports.d.ts': `
import type { ODataServiceRegistry } from '@me-tools/odx-core'
import './odx-types'

declare global {
  const useOData: () => ODataServiceRegistry
  type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
  type ODataItem<T> = NonNullable<T> extends Array<infer Item> ? Item : never
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

onMounted(() => {
  const demo = demoRef.value
  if (!demo)
    return

  import('floating-vue').then(({ createTooltip, destroyTooltip }) => {
    demo.querySelectorAll<HTMLElement>('.twoslash-hover, .twoslash-error-hover').forEach((trigger) => {
      const popup = trigger.querySelector<HTMLElement>('.twoslash-popup-container')
      if (!popup)
        return

      const floatingContent = popup.cloneNode(true) as HTMLElement
      floatingContent.querySelector('.twoslash-popup-arrow')?.remove()
      const content = floatingContent.innerHTML
      popup.remove()

      createTooltip(trigger, {
        content,
        html: true,
        theme: 'twoslash',
        popperClass: 'shiki twoslash-floating landing-twoslash-floating',
      }, {})

      twoslashPopupCleanup.push(() => destroyTooltip(trigger))
    })
  })

  twoslashResizeObserver = new ResizeObserver(() => recomputeAllPoppers())
  twoslashResizeObserver.observe(demo)
})

onBeforeUnmount(() => {
  twoslashResizeObserver?.disconnect()
  twoslashPopupCleanup.forEach(remove => remove())
})
</script>

<template>
  <UPageHero
    :headline="props.headline"
    :title="props.title"
    :description="props.description"
    orientation="horizontal"
    :links="links"
    :ui="{ container: 'pt-20 !pb-20 sm:pt-24 sm:!pb-24 lg:pt-28 lg:!pb-32' }"
  >
    <template #headline>
      <ULink
        :to="props.getStartedTo"
      >
        <UBadge
          color="primary"
          variant="subtle"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        >
          {{ props.explorer }}
        </UBadge>
      </ULink>
    </template>

    <div ref="demoRef" class="landing-hero-demo mx-auto w-full max-w-2xl rounded-lg bg-elevated/40 ring ring-default">
      <div class="border-b border-default p-3">
        <div class="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UIcon name="i-simple-icons-nuxtdotjs" class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-highlighted">
                {{ props.cardTitle }}
              </div>
              <div class="text-xs text-muted">
                {{ props.cardSubtitlePrefix }}
                <ULink
                  :to="metadataTo"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-muted underline decoration-dotted underline-offset-2 hover:text-default"
                >
                  {{ schema.namespace }}
                  {{ props.metadata }}
                </ULink>
              </div>
            </div>
          </div>

          <div>
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ schema.version.toUpperCase() }}
            </UBadge>
          </div>
        </div>

        <UTabs
          v-model="activeTab"
          :items="tabs"
          :content="false"
          color="primary"
          variant="pill"
          size="sm"
          :ui="{
            root: 'w-full',
            list: 'w-full bg-default ring ring-default',
            trigger: 'flex-1 justify-center transition-none',
            label: 'transition-none',
            leadingIcon: 'transition-none',
          }"
        />
      </div>

      <div class="relative h-[360px] overflow-hidden px-3 pb-3 pt-3">
        <div
          class="landing-hero-pane landing-hero-usage absolute inset-x-3 bottom-3 top-3 flex flex-col gap-3 overflow-hidden [&_.comark-content]:h-full [&_.comark-content>pre]:my-0! [&_.comark-content>pre]:w-full"
          :class="activeTab === 'usage' ? 'is-active' : 'pointer-events-none'"
        >
          <div class="min-h-0 h-full">
            <div class="comark-content" v-html="usageHtml" />
          </div>
        </div>
        <div
          class="landing-hero-pane absolute inset-x-3 bottom-3 top-3 overflow-y-auto"
          :class="activeTab === 'schema' ? 'is-active' : 'pointer-events-none'"
        >
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
                  {{ props.fields }}
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
                  {{ props.relations }}
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
        <div
          class="landing-hero-pane absolute inset-x-3 bottom-3 top-3 [&_.comark-content]:h-full [&_.comark-content>pre]:my-0! [&_.comark-content>pre]:h-full [&_.comark-content>pre]:w-full [&_.comark-content>pre]:overflow-auto"
          :class="activeTab === 'edmx' ? 'is-active' : 'pointer-events-none'"
        >
          <div class="comark-content" v-html="edmxHtml" />
        </div>
        <div
          class="landing-hero-pane absolute inset-x-3 bottom-3 top-3 [&_.comark-content]:h-full [&_.comark-content>pre]:my-0! [&_.comark-content>pre]:h-full [&_.comark-content>pre]:w-full [&_.comark-content>pre]:overflow-auto"
          :class="activeTab === 'response' ? 'is-active' : 'pointer-events-none'"
        >
          <div class="comark-content" v-html="responseHtml" />
        </div>
      </div>
    </div>
  </UPageHero>
</template>

<style>
:root {
  --twoslash-popup-bg: var(--ui-bg);
  --twoslash-popup-color: var(--ui-text-highlighted);
  --twoslash-border-color: var(--ui-border);
  --twoslash-docs-color: var(--ui-text-muted);
  --twoslash-popup-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
  --twoslash-docs-font: var(--ui-font-sans);
  --twoslash-code-font: var(--ui-font-mono);
}

.landing-hero-demo {
  container-type: inline-size;
}

.landing-hero-pane {
  visibility: hidden;
  opacity: 0;
  content-visibility: hidden;
  contain: layout paint style;
}

.landing-hero-pane.is-active {
  visibility: visible;
  opacity: 1;
  content-visibility: visible;
}

.landing-hero-demo .comark-content > pre {
  padding-block: 0.375rem !important;
}

.landing-hero-usage .comark-content > pre {
  height: auto !important;
  overflow: hidden !important;
}

.landing-hero-demo .twoslash .twoslash-popup-container {
  display: none !important;
}

@container (max-width: 34rem) {
  .landing-hero-usage .comark-content > pre {
    overflow: auto !important;
  }
}

.landing-twoslash-floating.v-popper__popper {
  z-index: 1000;
  max-width: calc(100vw - 2rem);
  overflow: hidden;
}

.landing-twoslash-floating .v-popper__inner {
  max-width: 100%;
  background: var(--ui-bg) !important;
  border-color: var(--ui-border) !important;
  box-shadow: var(--twoslash-popup-shadow);
  overflow: hidden;
}

.landing-twoslash-floating .v-popper__arrow-outer {
  border-color: var(--ui-border) !important;
}

.landing-twoslash-floating .v-popper__arrow-inner {
  border-color: var(--ui-bg) !important;
}

.landing-twoslash-floating .twoslash-popup-code,
.landing-twoslash-floating .twoslash-popup-docs {
  background: var(--ui-bg) !important;
}

.landing-twoslash-floating .twoslash-popup-code {
  max-width: min(42rem, calc(100vw - 2rem));
  max-height: min(16rem, calc(100vh - 2rem));
  overflow: auto;
}

.landing-twoslash-floating .twoslash-popup-docs {
  max-width: min(42rem, calc(100vw - 2rem));
}

body:has(.landing-twoslash-floating.v-popper__popper) {
  overflow-x: hidden;
}

.landing-twoslash-floating .twoslash-popup-code pre,
.landing-twoslash-floating .twoslash-popup-code code,
.landing-twoslash-floating .twoslash-popup-code .line,
.landing-twoslash-floating .twoslash-popup-code span,
.landing-twoslash-floating .twoslash-popup-docs,
.landing-twoslash-floating .twoslash-popup-docs * {
  background: var(--ui-bg) !important;
}

.landing-twoslash-floating .twoslash-popup-code pre {
  margin: 0;
}
</style>
