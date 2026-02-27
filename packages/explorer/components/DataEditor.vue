<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const emit = defineEmits(['refresh'])
const editor = defineModel<EditorState>('editor', { required: true })
const { selectedService, selectedEntity, config, sessionHeaders } = useSharedODataState()
const toast = useToast()

const modeConfig = computed(() => {
  switch (editor.value.mode) {
    case 'create':
      return { title: 'Create Record', icon: 'i-heroicons-plus', method: 'POST', methodColor: 'success' }
    case 'update':
      return { title: 'Edit Record', icon: 'i-heroicons-pencil', method: 'PATCH', methodColor: 'warning' }
    case 'headers':
      return { title: 'Session Headers', icon: 'i-heroicons-adjustments-horizontal', method: 'CONFIG', methodColor: 'primary' }
    case 'view':
    default:
      return { title: 'View Details', icon: 'i-heroicons-eye', method: 'GET', methodColor: 'neutral' }
  }
})

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
        icon: 'i-heroicons-cog-6-tooth',
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
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    editor.value.show = false
    editor.value.loading = false
    emit('refresh')
  }
  catch (e: unknown) {
    editor.value.error = (e as Error).message
    editor.value.loading = false
  }
}

function close() {
  editor.value.show = false
}
</script>

<template>
  <USlideover
    v-model:open="editor.show"
    :ui="{ body: 'bg-neutral-50/50 dark:bg-neutral-950/40' }"
  >
    <template #title>
      <div class="flex items-center gap-3 py-1">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
          <UIcon :name="modeConfig.icon" class="w-5 h-5" />
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-base text-neutral-900 dark:text-white leading-tight">
            {{ modeConfig.title }}
          </span>
          <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {{ editor.mode === 'headers' ? 'Session Configuration' : selectedEntity }}
          </span>
        </div>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col h-full py-2">
        <div class="flex-1 relative flex flex-col min-h-0 bg-white dark:bg-neutral-900 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all overflow-hidden">
          <div class="px-4 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-command-line" class="w-4 h-4 text-primary" />
              <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300 font-mono tracking-tight">payload.json</span>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="modeConfig.methodColor as any" variant="soft" size="sm" class="font-mono">
                {{ modeConfig.method }}
              </UBadge>
            </div>
          </div>

          <div class="flex-1 min-h-0 relative bg-transparent">
            <UTextarea
              v-model="editor.json"
              :readonly="editor.mode === 'view'"
              variant="none"
              class="h-full font-mono text-sm w-full"
              :ui="{
                base: 'h-full w-full resize-none border-0 focus:ring-0 bg-transparent text-neutral-800 dark:text-neutral-200',
                padding: 'p-4',
              }"
              placeholder="{ ... }"
            />
          </div>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="editor.error"
              class="absolute bottom-4 left-4 right-4 z-10"
            >
              <UAlert
                icon="i-heroicons-exclamation-triangle"
                color="error"
                variant="solid"
                :title="editor.error"
                class="shadow-xl rounded-lg"
              />
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="soft"
          class="px-5 font-semibold"
          @click="close"
        />
        <UButton
          v-if="editor.mode !== 'view'"
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
