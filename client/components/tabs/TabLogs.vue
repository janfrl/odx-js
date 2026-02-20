<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
</script>

<template>
  <div class="h-full flex flex-col pt-8 px-6 bg-base text-base">
    <div class="flex justify-between items-center mb-8 shrink-0 px-2 font-sans">
      <div class="flex items-center gap-3">
        <h1 class="text-sm font-bold opacity-90 uppercase tracking-wider">Traffic Monitor</h1>
        <NBadge 
          v-if="logs.length" 
          n="gray" 
          variant="subtle" 
          class="text-[10px] px-1.5 py-0.5 font-mono"
        >
          {{ logs.length }}
        </NBadge>
      </div>
      <button
        class="text-[10px] uppercase tracking-[0.15em] font-bold text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-base"
        @click="clearLogs"
      >
        Purge History
      </button>
    </div>

    <!-- Log Table Area -->
    <div class="flex-1 min-h-0 bg-content rounded-t-lg border-t border-x border-base overflow-hidden shadow-sm">
      <div class="h-full overflow-auto custom-scrollbar bg-content">
        <table class="w-full text-left text-[11px] border-collapse min-w-max">
          <thead class="sticky top-0 z-10 bg-surface border-b border-base text-muted">
            <tr class="uppercase text-[9px] font-bold tracking-widest">
              <th class="px-6 py-4 w-20 text-center">Status</th>
              <th class="px-6 py-4 w-24">Method</th>
              <th class="px-6 py-4">Resource / Path</th>
              <th class="px-6 py-4 text-right">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-primary/5 transition-colors group">
              <td class="px-6 py-4 text-center">
                <span :class="log.status < 400 ? 'text-primary' : 'text-red-500'" class="font-bold">{{ log.status }}</span>
              </td>
              <td class="px-6 py-4 opacity-80 uppercase text-[10px] tracking-tighter text-base">
                {{ log.method }}
              </td>
              <td class="px-6 py-4 truncate max-w-[400px] font-medium tracking-tight">
                {{ log.service }}<span class="opacity-30 mx-0.5">/</span>{{ log.entitySet || '-' }}
              </td>
              <td class="px-6 py-4 text-right font-medium text-muted">
                {{ log.duration }}<span class="text-[9px] opacity-60 ml-0.5 uppercase">ms</span>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="4" class="px-6 py-16 text-center opacity-40 italic font-sans text-xs">
                No activity recorded yet. Incoming requests will be captured here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
