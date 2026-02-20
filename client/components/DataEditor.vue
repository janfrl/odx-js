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
        class="w-full max-w-xl h-full flex flex-col rounded-none border-y-0 border-r-0 relative z-10 shadow-2xl pointer-events-auto bg-content"
      >
        <!-- Header -->
        <div class="p-4 border-b border-base flex items-center justify-between shrink-0 bg-surface font-sans">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-[11px] uppercase tracking-wider text-base-content">{{ editor.mode }} Item</h3>
            <span class="text-[10px] text-muted opacity-50">/</span>
            <span class="text-[10px] font-mono font-bold text-primary opacity-80">{{ selectedEntity }}</span>
          </div>
          <button 
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base text-muted hover:text-base transition-all border-none bg-transparent cursor-pointer"
            @click="close"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 p-6 flex flex-col overflow-hidden">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">JSON Payload</span>
          </div>
          <textarea
            v-model="editor.json"
            :readonly="editor.mode === 'view'"
            class="flex-1 bg-base border border-base rounded-lg p-4 font-mono text-xs focus:ring-1 focus:ring-primary/30 outline-none resize-none custom-scrollbar text-base"
          />
          <div v-if="editor.error" class="mt-4 p-3 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 font-bold font-sans">
            {{ editor.error }}
          </div>
        </div>

        <!-- Footer -->
        <div v-if="editor.mode !== 'view'" class="p-4 border-t border-base bg-surface flex justify-end gap-3 shrink-0">
          <NButton 
            variant="ghost" 
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
            @click="close"
          >
            Cancel
          </NButton>
          <NButton
            n="primary"
            variant="solid"
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
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
