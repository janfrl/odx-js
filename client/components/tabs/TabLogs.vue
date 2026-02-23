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
  <div class="h-full flex flex-col pt-8 px-6 bg-base text-base text-base">
    <div class="flex justify-between items-center mb-8 shrink-0 px-2 font-sans text-base">
      <div class="flex items-center gap-3">
        <h1 class="text-sm font-bold opacity-70 uppercase tracking-wider text-base-content text-base">
          Traffic Monitor
        </h1>
        <NBadge
          v-if="logs.length"
          class="text-[11px] px-2 py-0.5 font-bold bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 opacity-90 text-base"
        >
          {{ logs.length }}
        </NBadge>
      </div>
      <!-- Subtle secondary action style -->
      <button
        class="text-[10px] uppercase tracking-[0.15em] font-bold text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-base text-base"
        @click="runClear"
      >
        Purge History
      </button>
    </div>

    <!-- Outer Wrapper -->
    <div class="flex-1 min-h-0 bg-content rounded-t-xl border-t border-x border-base shadow-sm overflow-hidden flex flex-col text-base">
      <!-- Inner Scroll Container -->
      <div class="flex-1 overflow-auto custom-scrollbar text-base">
        <table class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max text-base">
          <thead class="sticky top-0 z-10 text-base">
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
          <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-base text-base">
            <template
              v-for="log in logs"
              :key="log.id"
            >
              <tr
                class="hover:bg-primary/5 transition-colors group text-base cursor-pointer"
                :class="expandedLog === log.id ? 'bg-primary/5' : ''"
                @click="toggleExpand(log.id)"
              >
                <td class="px-6 py-4 text-center border-base">
                  <span
                    :class="(log.status || 0) < 400 ? 'text-primary' : 'text-red-500'"
                    class="font-bold text-base"
                  >{{ log.status }}</span>
                </td>
                <td class="px-6 py-4 opacity-80 uppercase text-[10px] tracking-tighter text-base">
                  {{ log.method }}
                </td>
                <td class="px-6 py-4 truncate max-w-[400px] font-medium tracking-tight text-base">
                  {{ log.service }}<span class="opacity-30 mx-0.5 text-base">/</span>{{ log.entitySet || '-' }}
                </td>
                <td class="px-6 py-4 text-right font-medium text-muted text-base">
                  {{ log.duration }}<span class="text-[9px] opacity-60 ml-0.5 uppercase text-base">ms</span>
                </td>
              </tr>
              <!-- Detail View -->
              <tr v-if="expandedLog === log.id">
                <td
                  colspan="4"
                  class="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-base text-base"
                >
                  <!-- Target URL Section -->
                  <div class="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-base font-mono text-[10px]">
                    <div class="flex items-center gap-2 opacity-50 uppercase text-[9px] font-bold tracking-widest mb-2">
                      <div class="i-carbon-link w-3 h-3" />
                      Target URL (Backend)
                    </div>
                    <div class="break-all text-primary select-all">
                      {{ log.targetUrl || 'Internal / Mock Request' }}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-8 text-base">
                    <!-- Request Details -->
                    <div class="flex flex-col space-y-3">
                      <div class="flex items-center gap-2 opacity-50 uppercase text-[9px] font-bold tracking-widest mb-4 shrink-0 text-base">
                        <div class="i-carbon-upload w-3 h-3 text-base" />
                        Request Payload
                      </div>
                      <div
                        v-if="log.requestBody"
                        class="bg-base rounded-lg border border-base p-4 max-h-[300px] overflow-auto custom-scrollbar flex-1 text-base"
                      >
                        <pre class="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 text-base">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                      </div>
                      <div
                        v-else
                        class="flex flex-col items-center justify-center p-8 bg-zinc-500/5 rounded-lg border border-dashed border-base opacity-60 flex-1 min-h-[100px] text-base"
                      >
                        <div class="i-carbon-document-blank w-6 h-6 mb-2 opacity-70 text-base" />
                        <span class="text-[10px] font-bold uppercase opacity-90 text-base text-base">No request payload</span>
                      </div>
                    </div>

                    <!-- Response Details -->
                    <div class="flex flex-col space-y-3 border-l border-base pl-8 text-base text-base">
                      <div class="flex items-center gap-2 opacity-50 uppercase text-[9px] font-bold tracking-widest mb-4 shrink-0 text-base text-base">
                        <div class="i-carbon-download w-3 h-3 text-base" />
                        Response Body
                      </div>
                      <div
                        v-if="log.responseBody"
                        class="bg-base rounded-lg border border-base p-4 max-h-[300px] overflow-auto custom-scrollbar flex-1 text-base text-base"
                      >
                        <pre class="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 text-base">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                      </div>
                      <div
                        v-else
                        class="flex flex-col items-center justify-center p-8 bg-zinc-500/5 rounded-lg border border-dashed border-base opacity-60 flex-1 min-h-[100px] text-base"
                      >
                        <div class="i-carbon-document-blank w-6 h-6 mb-2 opacity-70 text-base" />
                        <span class="text-[10px] font-bold uppercase opacity-90 text-base text-base">No response body</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="logs.length === 0">
              <td
                colspan="4"
                class="px-6 py-16 text-center opacity-40 italic font-sans text-xs text-base"
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
