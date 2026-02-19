<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const props = defineProps<{
  editor: any
}>()

const emit = defineEmits(['update:editor', 'refresh'])

const { selectedService, selectedEntity, config } = useSharedODataState()

async function saveItem() {
  if (!selectedService.value || !selectedEntity.value) return
  const edit = { ...props.editor }
  edit.loading = true
  edit.error = null
  emit('update:editor', edit)

  try {
    const payload = JSON.parse(edit.json)
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const idKey = edit.original ? Object.keys(edit.original).find(k => k.toLowerCase() === 'id') : null
    const id = idKey ? edit.original[idKey] : null
    
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}${id ? `?id=${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) throw new Error(`Server Error ${res.status}`)
    
    emit('update:editor', { ...edit, show: false, loading: false })
    emit('refresh')
  } catch (e: any) {
    emit('update:editor', { ...edit, error: e.message, loading: false })
  }
}

function close() {
  emit('update:editor', { ...props.editor, show: false })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none text-base">
    <!-- Backdrop Transition -->
    <Transition name="fade" appear>
      <div 
        v-if="editor.show"
        class="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" 
        @click="close" 
      />
    </Transition>

    <!-- Slide Panel Transition -->
    <Transition name="slide" appear>
      <NCard 
        v-if="editor.show"
        class="w-full max-w-xl h-full flex flex-col rounded-none border-y-0 border-r-0 relative z-10 shadow-2xl pointer-events-auto"
      >
        <div class="p-4 border-b border-base flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-900/40 font-sans">
          <div>
            <h3 class="font-bold capitalize text-base-content">{{ editor.mode }} Item</h3>
            <p class="text-[9px] font-mono opacity-80 uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              {{ selectedEntity }}
            </p>
          </div>
          <button 
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border-none bg-transparent cursor-pointer"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </div>

        <div class="flex-1 p-6 flex flex-col overflow-hidden">
          <span class="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2 font-mono text-zinc-700 dark:text-zinc-300">
            JSON Payload
          </span>
          <textarea
            v-model="editor.json"
            :readonly="editor.mode === 'view'"
            class="flex-1 bg-zinc-50 dark:bg-black border border-base rounded-lg p-4 font-mono text-xs focus:ring-1 focus:ring-primary/30 outline-none resize-none custom-scrollbar text-base-content"
          />
          <div v-if="editor.error" class="mt-4 p-3 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 font-bold font-sans">
            {{ editor.error }}
          </div>
        </div>

        <div v-if="editor.mode !== 'view'" class="p-4 border-t border-base bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-2 shrink-0">
          <NButton variant="ghost" @click="close">Cancel</NButton>
          <NButton
            n="primary"
            class="px-6 font-bold uppercase text-[10px]"
            :loading="editor.loading"
            @click="saveItem"
          >
            {{ editor.mode === 'create' ? 'Create' : 'Save' }}
          </NButton>
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
