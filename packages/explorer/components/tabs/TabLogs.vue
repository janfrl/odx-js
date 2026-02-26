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
  <UContainer class="p-8 h-full flex flex-col min-h-0">
    <div class="flex justify-between items-center mb-8 shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold">
          Traffic Monitor
        </h1>
        <UBadge
          v-if="logs.length"
          color="neutral"
          variant="subtle"
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
        @click="runClear"
      />
    </div>

    <UCard
      class="flex-1 min-h-0 flex flex-col"
      :ui="{ body: 'p-0 overflow-hidden flex flex-col h-full' }"
    >
      <div class="flex-1 overflow-auto custom-scrollbar h-full">
        <table class="w-full text-left text-xs min-w-max">
          <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 w-24">Status</th>
              <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 w-24">Method</th>
              <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500">Resource</th>
              <th class="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-neutral-500 text-right w-32">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800 font-mono">
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
                    variant="subtle"
                    size="sm"
                  >
                    {{ log.status }}
                  </UBadge>
                </td>
                <td class="px-6 py-4 font-bold opacity-70 uppercase">{{ log.method }}</td>
                <td class="px-6 py-4 text-sm font-medium tracking-tight">
                  {{ log.service }}<span class="opacity-30 mx-1">/</span>{{ log.entitySet || '-' }}
                </td>
                <td class="px-6 py-4 text-right text-neutral-500">
                  {{ log.duration }}<span class="text-[9px] ml-1 uppercase">ms</span>
                </td>
              </tr>
              <tr v-if="expandedLog === log.id">
                <td
                  colspan="4"
                  class="bg-gray-50/50 dark:bg-gray-950/50 p-8"
                >
                  <div class="flex flex-col gap-8 max-w-5xl mx-auto">
                    <!-- URL -->
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400">
                        <UIcon name="i-heroicons-link" />
                        Backend Target
                      </div>
                      <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-[11px] break-all select-all">
                        {{ log.targetUrl || 'Internal Mock' }}
                      </div>
                    </div>

                    <!-- Headers -->
                    <div v-if="log.requestHeaders" class="space-y-2">
                      <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400">
                        <UIcon name="i-heroicons-adjustments-horizontal" />
                        Headers
                      </div>
                      <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-[11px]">
                        <div v-for="(val, key) in log.requestHeaders" :key="key" class="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                          <span class="text-primary-500 font-semibold">{{ key }}</span>
                          <span class="text-neutral-500 truncate ml-4" :title="val">{{ val }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Payloads -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="space-y-2">
                        <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400">
                          <UIcon name="i-heroicons-arrow-up-on-square" />
                          Payload
                        </div>
                        <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 h-48 overflow-auto custom-scrollbar">
                          <pre v-if="log.requestBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                          <div v-else class="h-full flex items-center justify-center opacity-20 italic text-xs">No Payload</div>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400">
                          <UIcon name="i-heroicons-arrow-down-on-square" />
                          Response
                        </div>
                        <div class="p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 h-48 overflow-auto custom-scrollbar">
                          <pre v-if="log.responseBody" class="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                          <div v-else class="h-full flex items-center justify-center opacity-20 italic text-xs">No Response Body</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="logs.length === 0">
              <td colspan="4" class="px-6 py-20 text-center text-neutral-400 italic">
                No network activity recorded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>
