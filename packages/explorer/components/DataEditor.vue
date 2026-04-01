<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const emit = defineEmits(['refresh'])
const editor = defineModel<EditorState>('editor', { required: true })
const { selectedService, selectedEntity, config, sessionHeaders } = useSharedODataState()
const toast = useToast()

let validationTimeout: ReturnType<typeof setTimeout> | null = null

const modeConfig = computed(() => {
  switch (editor.value.mode) {
    case 'create':
      return { title: 'Create Record', icon: 'i-lucide-plus', method: 'POST' }
    case 'update':
      return { title: 'Edit Record', icon: 'i-lucide-pencil', method: 'PATCH' }
    case 'headers':
      return { title: 'Session Headers', icon: 'i-lucide-sliders-horizontal', method: 'CONFIG' }
    case 'response':
      return { title: 'Response Data', icon: 'i-lucide-terminal', method: 'REST' }
    case 'view':
    default:
      return { title: 'View Details', icon: 'i-lucide-eye', method: 'GET' }
  }
})

const RE_LINE_COL = /\(line (\d+) column (\d+)\)/

/**
 * Formats native JSON parse errors into a cleaner, human-readable string.
 */
function formatJsonError(err: Error): string {
  const msg = err.message
  const lineColMatch = msg.match(RE_LINE_COL)

  if (lineColMatch) {
    const cleanMsg = msg.split(' in JSON')[0]
    return `Invalid JSON: ${cleanMsg} (Line ${lineColMatch[1]}, Col ${lineColMatch[2]})`
  }

  return `Invalid JSON: ${msg.replace('in JSON ', '')}`
}

watch(
  () => editor.value.json,
  (newVal) => {
    if (editor.value.mode === 'view') {
      editor.value.error = null
      return
    }

    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }

    if (!newVal || newVal.trim() === '') {
      editor.value.error = 'Payload cannot be empty'
      return
    }

    try {
      JSON.parse(newVal)
      editor.value.error = null
    }
    catch (e: unknown) {
      validationTimeout = setTimeout(() => {
        editor.value.error = formatJsonError(e as Error)
      }, 800)
    }
  },
  { immediate: true },
)

/**
 * Saves the current item or updates the session headers.
 * Executes the respective HTTP method based on the editor mode.
 */
async function saveItem() {
  if (editor.value.mode !== 'headers' && (!selectedService.value || !selectedEntity.value)) {
    return
  }

  editor.value.loading = true
  editor.value.error = null

  try {
    const payload = JSON.parse(editor.value.json)

    if (editor.value.mode === 'headers') {
      sessionHeaders.value = payload
      toast.add({
        title: 'Session headers updated',
        icon: 'i-lucide-settings',
        color: 'success',
      })
      editor.value.show = false
      editor.value.loading = false
      emit('refresh')
      return
    }

    const route = selectedService.value!.route || selectedService.value!.name.toLowerCase()
    const idKey = editor.value.original ? Object.keys(editor.value.original).find(k => k.toLowerCase() === 'id') : null
    const id = idKey ? (editor.value.original as Record<string, unknown>)[idKey] : null

    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}${id ? `?id=${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      let msg = `Server Error ${res.status}`
      try {
        const errData = JSON.parse(errorText)
        msg = errData.message || errData.statusMessage || msg
      }
      catch {
        if (errorText && errorText.length < 100) {
          msg = errorText
        }
      }
      throw new Error(msg)
    }

    toast.add({
      title: `Item ${id ? 'updated' : 'created'} successfully`,
      icon: 'i-lucide-circle-check',
      color: 'success',
    })

    editor.value.show = false
    editor.value.loading = false
    emit('refresh')
  }
  catch (e: unknown) {
    if (e instanceof SyntaxError) {
      editor.value.error = formatJsonError(e)
    }
    else {
      editor.value.error = (e as Error).message
    }
    editor.value.loading = false
  }
}

/**
 * Closes the editor slide-over.
 */
function close() {
  editor.value.show = false
}
</script>

<template>
  <USlideover
    v-model:open="editor.show"
    :description="editor.mode === 'headers' ? 'Session Configuration' : selectedEntity"
    :ui="{ body: 'bg-neutral-50 dark:bg-neutral-950' }"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon :name="modeConfig.icon" class="w-5 h-5 text-muted" />
        <span>{{ modeConfig.title }}</span>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col h-full py-2">
        <div class="flex-1 relative flex flex-col min-h-0 bg-default rounded-xl ring-1 ring-default shadow-sm focus-within:ring-2 focus-within:ring-primary transition-all overflow-hidden">
          <div class="px-4 py-2.5 flex items-center justify-between border-b border-default bg-default/50 shrink-0">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-terminal" class="w-4 h-4 text-muted" />
              <span class="text-xs font-semibold text-toned font-mono tracking-tight">payload.json</span>
            </div>
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="soft" size="sm" class="font-mono">
                {{ modeConfig.method }}
              </UBadge>
            </div>
          </div>

          <div class="flex-1 min-h-0 relative bg-transparent rounded-b-xl overflow-hidden">
            <ShikiEditor
              v-model="editor.json"
              :readonly="editor.mode === 'view' || editor.mode === 'response'"
            />
          </div>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-2 scale-95"
          >
            <div
              v-if="editor.error"
              class="absolute bottom-4 left-4 right-4 z-10"
            >
              <UAlert
                icon="i-lucide-circle-alert"
                color="error"
                variant="subtle"
                :title="editor.error"
              />
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <template v-if="editor.mode !== 'view' && editor.mode !== 'response'" #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="soft"
          class="px-5 font-semibold"
          @click="close"
        />
        <UButton
          :label="editor.mode === 'create' ? 'Create Record' : 'Save Changes'"
          color="primary"
          class="px-5 font-semibold shadow-sm"
          :loading="editor.loading"
          @click="saveItem"
        />
      </div>
    </template>
  </USlideover>
</template>
