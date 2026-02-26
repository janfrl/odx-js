<script setup lang="ts">
import { ref } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
const toast = useToast()
const expandedLog = ref<string | null>(null)

/**
 * Toggles the expanded state of a log entry.
 * @param id The ID of the log entry.
 */
function toggleExpand(id: string) {
  expandedLog.value = expandedLog.value === id ? null : id
}

/**
 * Clears all logs and shows a notification.
 */
async function runClear() {
  await clearLogs()
  toast.add({
    title: 'Traffic history purged',
    icon: 'i-heroicons-trash',
    color: 'success',
  })
}
</script>

<template>
  <div class="h-full flex flex-col pt-8 px-6">
    <div class="flex justify-between items-center mb-8 shrink-0 px-2 font-sans">
      <div class="flex items-center gap-3">
        <h1 class="text-sm font-bold opacity-70 uppercase tracking-wider">
          Traffic Monitor
        </h1>
        <UBadge
          v-if="logs.length"
          color="neutral"
          variant="subtle"
          size="sm"
          class="text-[11px] px-2 py-0.5 font-bold"
        >
          {{ logs.length }}
        </UBadge>
      </div>
      <UButton
        label="Purge History"
        color="neutral"
        variant="link"
        size="xs"
        class="text-[10px] uppercase tracking-[0.15em] font-bold"
        @click="runClear"
      />
    </div>

    <div class="flex-1 min-h-0 bg-white dark:bg-[#0a0a0a] rounded-t-xl border-t border-x border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max table-fixed">
          <thead class="sticky top-0 z-10">
            <tr class="text-gray-800 dark:text-gray-200 uppercase text-[9px] font-black tracking-[0.15em]">
              <th class="rounded-tl-xl px-6 py-4 w-20 text-center border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Status
              </th>
              <th class="px-6 py-4 w-24 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Method
              </th>
              <th class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Resource / Path
              </th>
              <th class="rounded-tr-xl px-6 py-4 text-right border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                Duration
              </th>
            </tr>
          </thead>
          <tbody class="divide-y border-gray-200 dark:border-gray-800 font-mono">
            <template
              v-for="log in logs"
              :key="log.id"
            >
              <tr
                class="hover:bg-primary-500/10 transition-colors group cursor-pointer"
                :class="expandedLog === log.id ? 'bg-primary-500/10' : ''"
                @click="toggleExpand(log.id)"
              >
                <td class="px-6 py-4 text-center">
                  <span
                    :class="(log.status || 0) < 400 ? 'text-primary-500' : 'text-error-500'"
                    class="font-bold"
                  >{{ log.status }}</span>
                </td>
                <td class="px-6 py-4 opacity-80 uppercase text-[10px] tracking-tighter text-gray-900 dark:text-gray-100">
                  {{ log.method }}
                </td>
                <td class="px-6 py-4 truncate max-w-[400px] font-medium tracking-tight text-gray-900 dark:text-gray-100">
                  {{ log.service }}<span class="opacity-30 mx-0.5">/</span>{{ log.entitySet || '-' }}
                </td>
                <td class="px-6 py-4 text-right font-medium text-gray-500 dark:text-gray-400">
                  {{ log.duration }}<span class="text-[9px] opacity-60 ml-0.5 uppercase">ms</span>
                </td>
              </tr>
              <tr v-if="expandedLog === log.id">
                <td
                  colspan="4"
                  class="bg-gray-50 dark:bg-gray-900/50 p-8 border-b border-gray-200 dark:border-gray-800"
                >
                  <div class="flex flex-col gap-6 w-full">
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200 uppercase text-[10px] font-bold tracking-wider">
                        <UIcon name="i-heroicons-link" class="w-4 h-4 opacity-70" />
                        Target URL (Backend)
                      </div>
                      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-[11px] break-all text-gray-600 dark:text-gray-300 select-all shadow-sm leading-relaxed">
                        {{ log.targetUrl || 'Internal / Mock Request' }}
                      </div>
                    </div>

                    <div
                      v-if="log.requestHeaders && Object.keys(log.requestHeaders).length > 0"
                      class="flex flex-col gap-2"
                    >
                      <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200 uppercase text-[10px] font-bold tracking-wider">
                        <UIcon name="i-heroicons-adjustments-horizontal" class="w-4 h-4 opacity-70" />
                        Request Headers
                      </div>
                      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-[11px] shadow-sm">
                        <div class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
                          <template v-for="(val, key) in log.requestHeaders" :key="key">
                            <span class="text-primary-500 font-bold opacity-90">{{ key }}:</span>
                            <span class="text-gray-600 dark:text-gray-300 break-all">{{ val }}</span>
                          </template>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200 uppercase text-[10px] font-bold tracking-wider shrink-0">
                          <UIcon name="i-heroicons-arrow-up-on-square" class="w-4 h-4 opacity-70" />
                          Request Payload
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-[120px] overflow-auto custom-scrollbar shadow-sm">
                          <pre v-if="log.requestBody" class="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                          <div v-else class="h-full flex flex-col items-center justify-center">
                            <UIcon name="i-heroicons-document" class="w-6 h-6 mb-2 text-gray-400 dark:text-gray-500" />
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">No data</span>
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200 uppercase text-[10px] font-bold tracking-wider shrink-0">
                          <UIcon name="i-heroicons-arrow-down-on-square" class="w-4 h-4 opacity-70" />
                          Response Body
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-[120px] overflow-auto custom-scrollbar shadow-sm">
                          <pre v-if="log.responseBody" class="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                          <div v-else class="h-full flex flex-col items-center justify-center">
                            <UIcon name="i-heroicons-document" class="w-6 h-6 mb-2 text-gray-400 dark:text-gray-500" />
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">No data</span>
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
