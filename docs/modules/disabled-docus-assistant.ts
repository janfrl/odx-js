import { addComponent, addImports, createResolver, defineNuxtModule } from '@nuxt/kit'

const ASSISTANT_COMPONENTS = [
  'AssistantChat',
  'AssistantPanel',
  'AssistantFloatingInput',
  'AssistantLoading',
  'AssistantMatrix',
]

export default defineNuxtModule({
  meta: {
    name: 'odx-disabled-docus-assistant',
  },
  setup(_options, nuxt) {
    if (nuxt.options.assistant !== false) {
      return
    }

    const resolver = createResolver(import.meta.url)
    const docusAssistantRuntime = resolver.resolve('../node_modules/docus/modules/assistant/runtime')

    const publicRuntimeConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicRuntimeConfig.assistant = {
      ...toRecord(publicRuntimeConfig.assistant),
      enabled: false,
      apiPath: '/__docus__/assistant',
    }

    addImports([
      {
        name: 'useAssistant',
        from: resolver.resolve(docusAssistantRuntime, 'composables/useAssistant'),
      },
    ])

    const disabledComponent = resolver.resolve(docusAssistantRuntime, 'components/AssistantChatDisabled.vue')
    for (const name of ASSISTANT_COMPONENTS) {
      addComponent({
        name,
        filePath: disabledComponent,
      })
    }
  },
})

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}
