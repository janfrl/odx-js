<script setup lang="ts">
import { ref } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
const expandedLog = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedLog.value = expandedLog.value === id ? null : id
}

async function runClear() {
  await clearLogs()
  devtoolsUiShowNotification({
    message: 'Traffic history purged',
    icon: 'i-carbon-trash-can',
    position: 'bottom-right',
    classes: 'text-base border-base',
  })
}
</script>

<template>
  <div class="h-full flex flex-col pt-8 px-6 bg-base text-base">
    <div class="flex justify-between items-center mb-8 shrink-0 px-2 font-sans text-base">
      <div class="flex items-center gap-3">
        <h1 class="text-sm font-bold opacity-70 uppercase tracking-wider text-base-content">
          Traffic Monitor
        </h1>
        <NBadge
          v-if="logs.length"
          class="text-[11px] px-2 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 opacity-90"
        >
          {{ logs.length }}
        </NBadge>
      </div>
      <button
        class="text-[10px] uppercase tracking-[0.15em] font-bold text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-base"
        @click="runClear"
      >
        Purge History
      </button>
    </div>

    <div class="flex-1 min-h-0 bg-content rounded-t-xl border-t border-x border-base shadow-sm overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max table-fixed">
          <thead class="sticky top-0 z-10">
            <tr class="text-zinc-800 dark:text-zinc-200 uppercase text-[9px] font-black tracking-[0.15em]">
              <th class="rounded-tl-xl px-6 py-4 w-20 text-center border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Status
              </th>
              <th class="px-6 py-4 w-24 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Method
              </th>
              <th class="px-6 py-4 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Resource / Path
              </th>
              <th class="rounded-tr-xl px-6 py-4 text-right border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Duration
              </th>
            </tr>
          </thead>
          <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono">
            <template
              v-for="log in logs"
              :key="log.id"
            >
              <tr
                class="hover:bg-primary/10 transition-colors group cursor-pointer"
                :class="expandedLog === log.id ? 'bg-primary/10' : ''"
                @click="toggleExpand(log.id)"
              >
                <td class="px-6 py-4 text-center border-base">
                  <span
                    :class="(log.status || 0) < 400 ? 'text-primary' : 'text-red-500'"
                    class="font-bold"
                  >{{ log.status }}</span>
                </td>
                <td class="px-6 py-4 opacity-80 uppercase text-[10px] tracking-tighter">
                  {{ log.method }}
                </td>
                <td class="px-6 py-4 truncate max-w-[400px] font-medium tracking-tight text-base">
                  {{ log.service }}<span class="opacity-30 mx-0.5">/</span>{{ log.entitySet || '-' }}
                </td>
                <td class="px-6 py-4 text-right font-medium text-muted">
                  {{ log.duration }}<span class="text-[9px] opacity-60 ml-0.5 uppercase">ms</span>
                </td>
              </tr>
              <tr v-if="expandedLog === log.id">
                <td
                  colspan="4"
                  class="bg-zinc-50/50 dark:bg-zinc-900/50 p-8 border-b border-base"
                >
                  <div class="flex flex-col gap-6 w-full">
                    <!-- Target URL Section -->
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 uppercase text-[10px] font-bold tracking-wider">
                        <div class="i-carbon-link w-4 h-4 opacity-70" />
                        Target URL (Backend)
                      </div>
                      <div class="p-4 bg-content rounded-lg border border-base font-mono text-[11px] break-all text-zinc-600 dark:text-zinc-300 select-all shadow-sm leading-relaxed">
                        {{ log.targetUrl || 'Internal / Mock Request' }}
                      </div>
                    </div>

                    <!-- Request Headers Section -->
                    <div 
                      v-if="log.requestHeaders && Object.keys(log.requestHeaders).length > 0"
                      class="flex flex-col gap-2"
                    >
                      <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 uppercase text-[10px] font-bold tracking-wider">
                        <div class="i-carbon-settings-adjust w-4 h-4 opacity-70" />
                        Request Headers
                      </div>
                      <div class="p-4 bg-content rounded-lg border border-base font-mono text-[11px] shadow-sm">
                        <div class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
                          <template v-for="(val, key) in log.requestHeaders" :key="key">
                            <span class="text-primary font-bold opacity-90">{{ key }}:</span>
                            <span class="text-zinc-600 dark:text-zinc-300 break-all">{{ val }}</span>
                          </template>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <!-- Request Details -->
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 uppercase text-[10px] font-bold tracking-wider shrink-0">
                          <div class="i-carbon-upload w-4 h-4 opacity-70" />
                          Request Payload
                        </div>
                        <div class="bg-content rounded-lg border border-base p-4 h-[120px] overflow-auto custom-scrollbar shadow-sm">
                          <pre v-if="log.requestBody" class="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre-wrap break-all">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                          <div v-else class="h-full flex flex-col items-center justify-center">
                            <div class="i-carbon-document-blank w-6 h-6 mb-2 text-zinc-400 dark:text-zinc-500" />
                            <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">No data</span>
                          </div>
                        </div>
                      </div>

                      <!-- Response Details -->
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 uppercase text-[10px] font-bold tracking-wider shrink-0">
                          <div class="i-carbon-download w-4 h-4 opacity-70" />
                          Response Body
                        </div>
                        <div class="bg-content rounded-lg border border-base p-4 h-[120px] overflow-auto custom-scrollbar shadow-sm">
                          <pre v-if="log.responseBody" class="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre-wrap break-all">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                          <div v-else class="h-full flex flex-col items-center justify-center">
                            <div class="i-carbon-document-blank w-6 h-6 mb-2 text-zinc-400 dark:text-zinc-500" />
                            <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">No data</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
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
