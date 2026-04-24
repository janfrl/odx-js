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
  return Object.fromEntries(
    Array.from(input.matchAll(ATTRIBUTE_RE), ([, key, value]) => [key, value]),
  )
}

function parseDemoSchema(xml: string): SchemaResponse {
  const namespace = xml.match(SCHEMA_NAMESPACE_RE)?.[1] || 'DemoService'
  const entityTypes = new Map<string, SchemaResponse['entities'][number]>()

  for (const [, type, body = ''] of xml.matchAll(ENTITY_TYPE_RE)) {
    const keys = new Set(Array.from(body.matchAll(PROPERTY_REF_RE), ([, name]) => name))
    const properties = Array.from(body.matchAll(PROPERTY_RE), ([, rawAttributes]) => {
      const attributes = parseAttributes(` ${rawAttributes}`)

      return {
        name: attributes.Name || '',
        type: attributes.Type || 'Edm.String',
        isKey: keys.has(attributes.Name || ''),
      }
    })
      .filter(property => property.name)

    const navigationProperties = Array.from(body.matchAll(NAVIGATION_PROPERTY_RE), ([, rawAttributes]) => {
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

  const entities = Array.from(xml.matchAll(ENTITY_SET_RE), ([, name, qualifiedType]) => {
    const type = qualifiedType.split('.').pop() || qualifiedType
    const entityType = entityTypes.get(type)

    return {
      name,
      type,
      properties: entityType?.properties || [],
      navigationProperties: entityType?.navigationProperties || [],
    }
  })

  return {
    name: serviceName,
    version: 'v4',
    namespace,
    entities,
  }
}

const schema = parseDemoSchema(rawEdmx)

const activeTab = ref<'edmx' | 'usage' | 'response'>('usage')

const tabs = [
  {
    value: 'usage',
    label: 'Nuxt',
    icon: 'i-simple-icons-nuxtdotjs',
    language: 'ts',
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
const usageCode = `// @noErrors
// @filename: odx-types.d.ts
interface Product {
  ID: string
  Name: string | null
  Price: number | null
  Category_ID: string | null
  Category?: Category | null
}
interface Category {
  ID: string
  Name: string | null
  Products?: Product[]
}
interface ODataBuilder<T> {
  select<K extends keyof T>(...fields: (K & string)[]): ODataBuilder<Pick<T, K>>
  expand(field: keyof T & string): ODataBuilder<T>
  filter(predicate: object): ODataBuilder<T>
  top(n: number): ODataBuilder<T>
  get(): Promise<T[]>
}
declare const odata: { demo: { Products: ODataBuilder<Product>; Categories: ODataBuilder<Category> } }
// @filename: index.ts
const products = await odata.demo.Products
//    ^?
  .select('ID', 'Name', 'Price')
  .expand('Category')
  .filter({ Price: { gt: 50 } })
  .top(2)
  .get()

// products: Product[] - inferred from generated EDMX types`
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

    <div class="mx-auto w-full max-w-xl overflow-hidden rounded-lg bg-elevated/40 ring ring-default">
      <div class="border-b border-default p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm font-medium text-highlighted">
              Powered by the ODX Nuxt module
            </div>
            <div class="mt-1 text-xs text-muted">
              {{ schema.namespace }} EDMX -> generated types -> typed Nuxt query
            </div>
          </div>
          <UBadge color="primary" variant="subtle">
            Build-time
          </UBadge>
        </div>

        <div class="grid grid-cols-3 gap-2">
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

      <div class="grid h-[360px] lg:grid-cols-[0.7fr_1.3fr]">
        <div class="overflow-y-auto border-b border-default p-4 lg:border-b-0 lg:border-r">
          <div class="mb-3 text-xs font-medium uppercase text-muted">
            Entity preview
          </div>
          <div class="space-y-2">
            <div
              v-for="entity in entities"
              :key="entity.name"
              class="rounded-md bg-default px-3 py-2 ring ring-default"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium text-highlighted">{{ entity.name }}</span>
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ entity.properties.length }}
                </UBadge>
              </div>
              <div class="mt-1 text-xs text-muted">
                {{ entity.type }}
              </div>
            </div>
          </div>

          <div v-if="selectedEntity" class="mt-4 border-t border-default pt-4">
            <div class="mb-2 text-xs font-medium uppercase text-muted">
              {{ selectedEntity.name }} fields
            </div>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="property in selectedEntity.properties.slice(0, 5)"
                :key="property.name"
                :color="property.isKey ? 'primary' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ property.name }}
              </UBadge>
            </div>
          </div>
        </div>

        <div class="h-full overflow-y-auto p-4 [&_pre]:my-0! [&_pre]:overflow-auto">
          <div v-show="activeTab === 'usage'">
            <div class="comark-content" v-html="usageHtml" />
          </div>
          <div v-show="activeTab === 'edmx'">
            <div class="comark-content" v-html="edmxHtml" />
          </div>
          <div v-show="activeTab === 'response'">
            <div class="comark-content" v-html="responseHtml" />
          </div>
        </div>
      </div>
    </div>
  </UPageHero>
</template>
