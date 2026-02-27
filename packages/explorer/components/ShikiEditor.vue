<script setup lang="ts">
import { createHighlighter } from 'shiki'
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const colorMode = useColorMode()
const highlightedHtml = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const highlightRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
let highlighter: any = null

async function initShiki() {
  try {
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['json'],
    })
    isReady.value = true
    renderCode()
  }
  catch (e) {
    console.error('[ShikiEditor] Failed to load highlighter:', e)
  }
}

function renderCode() {
  if (!highlighter) {
    return
  }
  const theme = colorMode.value === 'dark' ? 'github-dark' : 'github-light'

  highlightedHtml.value = highlighter.codeToHtml(props.modelValue || '', {
    lang: 'json',
    theme,
  })
}

watch(() => props.modelValue, () => {
  renderCode()
})

watch(() => colorMode.value, () => {
  renderCode()
})

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function syncScroll() {
  if (highlightRef.value && textareaRef.value) {
    highlightRef.value.scrollTop = textareaRef.value.scrollTop
    highlightRef.value.scrollLeft = textareaRef.value.scrollLeft
  }
}

function handleTab(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const val = target.value

    emit('update:modelValue', `${val.substring(0, start)}  ${val.substring(end)}`)

    nextTick(() => {
      target.selectionStart = target.selectionEnd = start + 2
    })
  }
}

onMounted(() => {
  initShiki()
})
</script>

<template>
  <div class="relative w-full h-full text-sm font-mono leading-relaxed bg-transparent">
    <div
      ref="highlightRef"
      class="absolute inset-0 pointer-events-none p-4 overflow-hidden"
      aria-hidden="true"
      v-html="highlightedHtml"
    />

    <textarea
      ref="textareaRef"
      :value="modelValue"
      :readonly="readonly"
      class="absolute inset-0 w-full h-full resize-none p-4 bg-transparent outline-none focus:ring-0 custom-scrollbar m-0 border-0"
      :class="isReady ? 'text-transparent caret-neutral-900 dark:caret-white' : 'text-neutral-900 dark:text-neutral-100'"
      spellcheck="false"
      @input="onInput"
      @scroll="syncScroll"
      @keydown="handleTab"
    />
  </div>
</template>

<style scoped>
/* Ensure pixel-perfect alignment between textarea and Shiki <pre> */
:deep(pre) {
  margin: 0 !important;
  background: transparent !important;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  tab-size: 2;
}

:deep(code) {
  font-family: inherit !important;
}

textarea {
  white-space: pre;
  word-wrap: normal;
  tab-size: 2;
  font-family: inherit;
}
</style>
