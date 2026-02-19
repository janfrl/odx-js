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
  <div class="fixed inset-0 z-[100] flex justify-end overflow-hidden">
    <Transition appear name="fade">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-auto" @click="close" />
    </Transition>
    <Transition appear name="slide">
      <div class="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 relative z-[101] pointer-events-auto">
        <header class="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/20 text-zinc-900 dark:text-zinc-100">
          <div>
            <h3 class="font-bold text-lg capitalize mb-1">{{ editor.mode }} Item</h3>
            <p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-widest uppercase opacity-60">{{ selectedEntity }}</p>
          </div>
          <button class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all border-0 shadow-none bg-transparent cursor-pointer" @click="close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div class="flex-1 p-8 overflow-hidden flex flex-col">
          <div class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 mb-3 tracking-[0.2em]">Data Payload</div>
          <textarea v-model="editor.json" :readonly="editor.mode === 'view'" class="flex-1 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 font-mono text-[11px] focus:border-[#00dc82]/30 outline-none resize-none text-zinc-600 dark:text-[#00dc82]/80 leading-relaxed custom-scrollbar shadow-inner" />
          <div v-if="editor.error" class="mt-4 p-4 bg-red-500/5 text-red-500 text-[10px] rounded border border-red-500/10 font-bold">
            {{ editor.error }}
          </div>
        </div>
        <footer v-if="editor.mode !== 'view'" class="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/20">
          <button class="px-5 py-2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors font-medium bg-transparent border-0 cursor-pointer" @click="close">Cancel</button>
          <button :disabled="editor.loading" class="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[11px] font-bold rounded shadow-lg active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest cursor-pointer border-0" @click="saveItem">
            {{ editor.loading ? '...' : (editor.mode === 'create' ? 'Create' : 'Save') }}
          </button>
        </footer>
      </div>
    </Transition>
  </div>
</template>
