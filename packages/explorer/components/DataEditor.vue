<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { useSharedODataState } from '../composables/useODataState'

const emit = defineEmits(['refresh'])
const editor = defineModel<EditorState>('editor', { required: true })
const { selectedService, selectedEntity, config, sessionHeaders } = useSharedODataState()
const toast = useToast()

/**
 * Saves the item or updates session headers.
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
    :title="editor.mode === 'headers' ? 'Session Headers' : `${editor.mode} Item`"
    :description="editor.mode !== 'headers' ? selectedEntity ?? '' : ''"
    :ui="{ content: 'rounded-l-2xl' }"
  >
    <template #body>
      <div class="flex-1 flex flex-col gap-4 overflow-hidden">
        <div class="flex items-center gap-2 opacity-50 uppercase text-[10px] font-bold tracking-[0.2em]">
          <UIcon name="i-heroicons-code-bracket" class="w-3.5 h-3.5" />
          <span>JSON Payload</span>
        </div>

        <UTextarea
          v-model="editor.json"
          :readonly="editor.mode === 'view'"
          variant="outline"
          color="neutral"
          autoresize
          :max-rows="25"
          class="font-mono text-xs flex-1"
          placeholder="{ ... }"
        />

        <UAlert
          v-if="editor.error"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="subtle"
          :title="editor.error"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          v-if="editor.mode !== 'view'"
          :label="editor.mode === 'create' ? 'Create' : 'Save'"
          color="primary"
          :loading="editor.loading"
          @click="saveItem"
        />
      </div>
    </template>
  </USlideover>
</template>
