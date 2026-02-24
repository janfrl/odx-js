<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { useSharedODataState } from '../composables/useODataState'

const emit = defineEmits(['refresh'])

const editor = defineModel<EditorState>('editor', { required: true })

const { selectedService, selectedEntity, config, sessionHeaders } = useSharedODataState()

async function saveItem() {
  if (editor.value.mode !== 'headers' && (!selectedService.value || !selectedEntity.value))
    return

  editor.value.loading = true
  editor.value.error = null

  try {
    const payload = JSON.parse(editor.value.json)

    if (editor.value.mode === 'headers') {
      sessionHeaders.value = payload
      devtoolsUiShowNotification({
        message: 'Session headers updated',
        icon: 'i-carbon-settings-adjust',
        position: 'bottom-right',
        classes: 'text-base border-base',
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
        if (errorText && errorText.length < 100)
          msg = errorText
      }
      throw new Error(msg)
    }

    devtoolsUiShowNotification({
      message: `Item ${id ? 'updated' : 'created'} successfully`,
      icon: 'i-carbon-checkmark-outline',
      position: 'bottom-right',
      classes: 'text-base border-base',
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
  <div class="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none text-base">
    <!-- Backdrop Transition -->
    <Transition
      name="fade"
      appear
    >
      <div
        v-if="editor.show"
        class="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        @click="close"
      />
    </Transition>

    <!-- Slide Panel Transition -->
    <Transition
      name="slide"
      appear
    >
      <NCard
        v-if="editor.show"
        class="w-full max-w-xl h-full flex flex-col rounded-none border-y-0 border-r-0 relative z-10 shadow-2xl pointer-events-auto bg-content text-base"
      >
        <!-- Header -->
        <div class="p-4 border-b border-base flex items-center justify-between shrink-0 bg-surface font-sans text-base">
          <div class="flex items-center gap-2 text-base">
            <h3 class="font-bold text-[11px] uppercase tracking-wider text-base-content">
              {{ editor.mode === 'headers' ? 'Session Headers' : `${editor.mode} Item` }}
            </h3>
            <template v-if="editor.mode !== 'headers'">
              <span class="text-[10px] text-muted opacity-50">/</span>
              <span class="text-[10px] font-mono font-bold text-primary opacity-80">{{ selectedEntity }}</span>
            </template>
          </div>
          <NButton
            icon="i-carbon-close"
            class="!border-none !bg-transparent !shadow-none text-muted hover:text-base opacity-60 hover:opacity-100"
            @click="close"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 p-6 flex flex-col overflow-hidden text-base">
          <div class="flex items-center gap-2 mb-3 text-base">
            <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400 opacity-90 font-sans">
              JSON Payload
            </span>
          </div>
          <textarea
            v-model="editor.json"
            :readonly="editor.mode === 'view'"
            class="flex-1 bg-base border border-base rounded-lg p-4 font-mono text-xs focus:ring-1 focus:ring-primary/30 outline-none resize-none custom-scrollbar text-base"
          />
          <div
            v-if="editor.error"
            class="mt-4 p-3 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 font-bold font-sans"
          >
            {{ editor.error }}
          </div>
        </div>

        <!-- Footer -->
        <div
          v-if="editor.mode !== 'view'"
          class="p-4 border-t border-base bg-surface flex justify-end gap-6 shrink-0 px-8 text-base"
        >
          <button
            class="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer uppercase tracking-wider"
            @click="close"
          >
            Cancel
          </button>

          <!-- Adaptive High Contrast Primary Button -->
          <button
            :disabled="editor.loading"
            class="px-6 h-[32px] rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black font-bold uppercase text-[10px] tracking-wider hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50"
            @click="saveItem"
          >
            {{ editor.loading ? '...' : (editor.mode === 'create' ? 'Create' : 'Save') }}
          </button>
        </div>
      </NCard>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
