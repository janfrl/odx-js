<script setup lang="ts">
import { ref } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
const toast = useToast()
const expandedLog = ref<string | null>(null)

/**
 * Toggles the expanded state of a log entry.
 */
function toggleExpand(id: string) {
  expandedLog.value = expandedLog.value === id ? null : id
}

/**
 * Clears all logs and shows a notification.
 */
async function runClear() {
  /* eslint-disable no-alert */
  if (confirm('Are you sure you want to clear all traffic logs?')) {
    await clearLogs()
    toast.add({
      title: 'Traffic history purged',
      icon: 'i-heroicons-trash',
      color: 'success',
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col min-h-0 bg-white dark:bg-black">
    <div class="p-4 sm:p-6 pb-0 flex-1 flex flex-col min-h-0">
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden ring-1 ring-gray-200/70 dark:ring-gray-800/70 rounded-t-2xl bg-white dark:bg-zinc-900/50 shadow-2xl transition-all">
        <!-- Toolbar -->
        <div class="px-6 py-2 border-b border-gray-200/70 dark:border-gray-800/70 flex justify-between items-center shrink-0 bg-gray-50/50 dark:bg-zinc-950 rounded-t-[inherit]">
          <div class="flex items-center gap-3">
            <h1 class="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">
              Traffic Monitor
            </h1>
            <UBadge
              v-if="logs.length"
              color="neutral"
              variant="subtle"
              size="sm"
              class="font-mono font-bold text-[10px]"
            >
              {{ logs.length }}
            </UBadge>
          </div>
          <UButton
            label="Purge History"
            color="error"
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            class="uppercase text-[10px] font-bold tracking-widest"
            @click="runClear"
          />
        </div>

        <!-- Log Table -->
        <div class="flex-1 overflow-auto custom-scrollbar relative">
          <table class="w-full text-left text-xs min-w-max border-collapse">
            <thead class="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="px-6 py-3 font-black uppercase tracking-[0.1em] text-[10px] text-neutral-400 w-24">Status</th>
                <th class="px-6 py-3 font-black uppercase tracking-[0.1em] text-[10px] text-neutral-400 w-24">Method</th>
                <th class="px-6 py-3 font-black uppercase tracking-[0.1em] text-[10px] text-neutral-400">Resource</th>
                <th class="px-6 py-3 font-black uppercase tracking-[0.1em] text-[10px] text-neutral-400 text-right w-32">Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-900 font-mono text-neutral-700 dark:text-neutral-300">
              <template
                v-for="log in logs"
                :key="log.id"
              >
                <tr
                  class="hover:bg-primary-500/5 cursor-pointer transition-colors group"
                  :class="expandedLog === log.id ? 'bg-primary-500/5' : ''"
                  @click="toggleExpand(log.id)"
                >
                  <td class="px-6 py-4">
                    <UBadge
                      :color="(log.status || 0) < 400 ? 'success' : 'error'"
                      variant="soft"
                      size="sm"
                      class="font-black min-w-[40px] justify-center"
                    >
                      {{ log.status || '???' }}
                    </UBadge>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest opacity-70">
                      {{ log.method }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    <span class="opacity-40 font-normal mr-1">{{ log.service }}</span>
                    <span class="opacity-20 mx-1 text-neutral-400">/</span>
                    <span class="group-hover:text-primary transition-colors">{{ log.entitySet || '-' }}</span>
                  </td>
                  <td class="px-6 py-4 text-right text-neutral-500 tabular-nums">
                    <span class="font-bold">{{ log.duration }}</span>
                    <span class="text-[9px] ml-1 opacity-30 uppercase font-sans font-black">ms</span>
                  </td>
                </tr>

                <tr v-if="expandedLog === log.id">
                  <td
                    colspan="4"
                    class="bg-gray-50/30 dark:bg-zinc-950/30 p-0 border-y border-gray-100 dark:border-zinc-900"
                  >
                    <div class="p-8 flex flex-col gap-10 max-w-6xl mx-auto text-neutral-900 dark:text-neutral-100">
                      <div class="space-y-3">
                        <div class="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                          <UIcon name="i-heroicons-link" class="w-3.5 h-3.5" />
                          Backend Target
                        </div>
                        <div class="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-800 font-mono text-[11px] break-all select-all text-neutral-600 dark:text-neutral-400 leading-relaxed shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                          {{ log.targetUrl || 'Internal Mock' }}
                        </div>
                      </div>

                      <div v-if="log.requestHeaders" class="space-y-3">
                        <div class="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                          <UIcon name="i-heroicons-adjustments-horizontal" class="w-3.5 h-3.5" />
                          Request Headers
                        </div>
                        <div class="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-[11px] shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                          <div v-for="(val, key) in log.requestHeaders" :key="key" class="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1.5 group/header">
                            <span class="text-primary-500 font-bold opacity-80 group-hover/header:opacity-100 transition-opacity">{{ key }}</span>
                            <span class="text-neutral-500 truncate ml-4 font-medium" :title="val">{{ val }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div class="space-y-3">
                          <div class="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                            <UIcon name="i-heroicons-arrow-up-on-square" class="w-3.5 h-3.5" />
                            Payload
                          </div>
                          <div class="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-800 h-64 overflow-auto custom-scrollbar shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <pre v-if="log.requestBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                            <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                              <UIcon name="i-heroicons-document-minus" class="w-8 h-8 mb-2" />
                              No Payload
                            </div>
                          </div>
                        </div>
                        <div class="space-y-3">
                          <div class="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                            <UIcon name="i-heroicons-arrow-down-on-square" class="w-3.5 h-3.5" />
                            Response
                          </div>
                          <div class="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-800 h-64 overflow-auto custom-scrollbar shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <pre v-if="log.responseBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                            <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                              <UIcon name="i-heroicons-document-minus" class="w-8 h-8 mb-2" />
                              No Response Body
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="logs.length === 0">
                <td colspan="4" class="px-6 py-32 text-center text-neutral-400 italic">
                  <div class="flex flex-col items-center gap-2">
                    <UIcon name="i-heroicons-no-symbol" class="w-12 h-12 opacity-10 mb-2" />
                    <p class="text-sm tracking-wide font-medium">No network activity recorded yet.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
