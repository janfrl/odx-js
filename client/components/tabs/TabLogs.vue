<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#050505] pt-8 px-8">
    <div class="flex justify-between items-center mb-8 shrink-0">
      <h1 class="text-base font-medium opacity-80 text-zinc-900 dark:text-zinc-100">Traffic Monitor</h1>
      <button 
        class="text-[10px] text-zinc-400 hover:text-[#00dc82] transition-colors uppercase tracking-[0.2em] font-bold border-b border-dashed border-current pb-0.5 bg-transparent cursor-pointer"
        @click="clearLogs"
      >
        Purge History
      </button>
    </div>
    <div class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#0a0a0a] rounded-t-2xl overflow-hidden shadow-xl shadow-black/5">
      <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0c0c0d]">
        <table class="w-full text-[11px] text-left border-collapse">
          <thead class="bg-zinc-50 dark:bg-zinc-900 text-zinc-400 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-100 dark:border-zinc-800 sticky top-0 shadow-sm z-10">
            <tr>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Method</th>
              <th class="px-6 py-4">Path</th>
              <th class="px-4 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-zinc-500">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-[#00dc82]/5 transition-colors">
              <td class="px-6 py-4">
                <span :class="log.status < 400 ? 'text-[#00dc82]' : 'text-red-500'" class="font-bold opacity-80">{{ log.status }}</span>
              </td>
              <td class="px-6 py-4 opacity-50 uppercase text-[10px] tracking-tighter">{{ log.method }}</td>
              <td class="px-6 py-4 truncate max-w-[400px] text-zinc-800 dark:text-zinc-200 font-medium tracking-tight">
                {{ log.service }}/{{ log.entitySet || '-' }}
              </td>
              <td class="px-4 py-4 text-right opacity-40 italic">{{ log.duration }}ms</td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-zinc-400 italic font-sans text-xs">No activity recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
