<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
</script>

<template>
  <div class="h-full flex flex-col pt-8 px-6 bg-base text-base">
    <div class="flex justify-between items-center mb-8 shrink-0 px-2 font-sans">
      <div class="flex items-center gap-3">
        <h1 class="text-sm font-bold opacity-90 uppercase tracking-wider text-base-content">
          Traffic Monitor
        </h1>
        <NBadge
          v-if="logs.length"
          n="gray"
          variant="subtle"
          class="text-[10px] px-1.5 py-0.5 font-mono"
        >
          {{ logs.length }}
        </NBadge>
      </div>
      <!-- Subtle secondary action style -->
      <button
        class="text-[10px] uppercase tracking-[0.15em] font-bold text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-base"
        @click="clearLogs"
      >
        Purge History
      </button>
    </div>

    <!-- Outer Wrapper -->
    <div class="flex-1 min-h-0 bg-content rounded-t-xl border-t border-x border-base shadow-sm overflow-hidden flex flex-col">
      <!-- Inner Scroll Container -->
      <div class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max">
          <thead class="sticky top-0 z-10">
            <tr class="text-zinc-800 dark:text-zinc-200 uppercase text-[9px] font-black tracking-[0.15em]">
              <th class="rounded-tl-xl px-6 py-4 w-20 text-center border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                Status
              </th>
              <th class="px-6 py-4 w-24 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                Method
              </th>
              <th class="px-6 py-4 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                Resource / Path
              </th>
              <th class="rounded-tr-xl px-6 py-4 text-right border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                Duration
              </th>
            </tr>
          </thead>
          <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-base">
            <tr
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-primary/5 transition-colors group text-base"
            >
              <td class="px-6 py-4 text-center border-base">
                <span
                  :class="log.status < 400 ? 'text-primary' : 'text-red-500'"
                  class="font-bold"
                >{{ log.status }}</span>
              </td>
              <td class="px-6 py-4 opacity-80 uppercase text-[10px] tracking-tighter">
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
              <td
                colspan="4"
                class="px-6 py-16 text-center opacity-40 italic font-sans text-xs"
              >
                No activity recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
