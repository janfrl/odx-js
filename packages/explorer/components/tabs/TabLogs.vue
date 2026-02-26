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
    <div class="px-6 py-2 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50/50 dark:bg-zinc-900/50">
      <div class="flex items-center gap-3">
        <h1 class="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
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

    <div class="flex-1 overflow-auto custom-scrollbar relative">
      <table class="w-full text-left text-xs min-w-max border-collapse">
        <thead class="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 w-24">Status</th>
            <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 w-24">Method</th>
            <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500">Resource</th>
            <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 text-right w-32">Duration</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-900 font-mono text-neutral-700 dark:text-neutral-300">
          <template
            v-for="log in logs"
            :key="log.id"
          >
            <tr
              class="hover:bg-primary-500/5 cursor-pointer transition-colors"
              :class="expandedLog === log.id ? 'bg-primary-500/5' : ''"
              @click="toggleExpand(log.id)"
            >
              <td class="px-6 py-4">
                <UBadge
                  :color="(log.status || 0) < 400 ? 'success' : 'error'"
                  variant="soft"
                  size="sm"
                  class="font-bold min-w-[40px] justify-center"
                >
                  {{ log.status || '???' }}
                </UBadge>
              </td>
              <td class="px-6 py-4 font-black opacity-70 uppercase text-[10px] tracking-widest">{{ log.method }}</td>
              <td class="px-6 py-4 text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                <span class="opacity-50 font-normal">{{ log.service }}</span><span class="opacity-20 mx-1">/</span>{{ log.entitySet || '-' }}
              </td>
              <td class="px-6 py-4 text-right text-neutral-500 tabular-nums">
                {{ log.duration }}<span class="text-[9px] ml-1 opacity-50 uppercase font-sans">ms</span>
              </td>
            </tr>
            <tr v-if="expandedLog === log.id">
              <td
                colspan="4"
                class="bg-gray-50/30 dark:bg-zinc-950/30 p-0 border-y border-gray-100 dark:border-zinc-900"
              >
                <div class="p-8 flex flex-col gap-8 max-w-6xl mx-auto text-neutral-900 dark:text-neutral-100">
                  <!-- Log Details (Target, Headers, Payloads) -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
                      <UIcon name="i-heroicons-link" />
                      Backend Target
                    </div>
                    <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-[11px] break-all select-all text-neutral-600 dark:text-neutral-400 leading-relaxed shadow-sm">
                      {{ log.targetUrl || 'Internal Mock' }}
                    </div>
                  </div>

                  <div v-if="log.requestHeaders" class="space-y-2">
                    <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
                      <UIcon name="i-heroicons-adjustments-horizontal" />
                      Headers
                    </div>
                    <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-[11px] shadow-sm">
                      <div v-for="(val, key) in log.requestHeaders" :key="key" class="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                        <span class="text-primary-500 font-semibold">{{ key }}</span>
                        <span class="text-neutral-500 truncate ml-4" :title="val">{{ val }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
                        <UIcon name="i-heroicons-arrow-up-on-square" />
                        Payload
                      </div>
                      <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 h-64 overflow-auto custom-scrollbar shadow-sm">
                        <pre v-if="log.requestBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                        <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                          <UIcon name="i-heroicons-document-minus" class="w-6 h-6 mb-1" />
                          No Payload
                        </div>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
                        <UIcon name="i-heroicons-arrow-down-on-square" />
                        Response
                      </div>
                      <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 h-64 overflow-auto custom-scrollbar shadow-sm">
                        <pre v-if="log.responseBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                        <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">
                          <UIcon name="i-heroicons-document-minus" class="w-6 h-6 mb-1" />
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
                <p class="text-sm tracking-wide">No network activity recorded yet.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
