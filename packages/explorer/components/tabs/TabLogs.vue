<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
const toast = useToast()
const expanded = ref({})

const columns = [
  { id: 'status', accessorKey: 'status', header: 'Status', size: 100 },
  { id: 'method', accessorKey: 'method', header: 'Method', size: 100 },
  { id: 'resource', accessorKey: 'resource', header: 'Resource' },
  { id: 'duration', accessorKey: 'duration', header: 'Duration', size: 120 },
]

async function runClear() {
  /* eslint-disable no-alert */
  if (confirm('Are you sure you want to clear all traffic logs?')) {
    await clearLogs()
    toast.add({
      title: 'Traffic history purged',
      icon: 'i-lucide-trash-2',
      color: 'success',
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans">
    <div class="px-6 py-4 shrink-0 flex items-center justify-between">
      <header class="flex flex-col gap-1.5">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Traffic Monitor
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Live request/response logs from the OData proxy.
        </p>
      </header>

      <div class="flex items-center gap-3">
        <UBadge
          v-if="logs.length"
          color="neutral"
          variant="subtle"
          size="md"
          class="font-mono font-bold text-[11px] px-3"
        >
          {{ logs.length }} Entries
        </UBadge>
        <UButton
          label="Purge History"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          @click="runClear"
        />
      </div>
    </div>

    <div class="flex-1 flex flex-col min-h-0 relative px-6 pb-0">
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-x border-neutral-200/70 dark:border-neutral-800/70 rounded-t-2xl bg-white dark:bg-neutral-900/50 shadow-2xl transition-all">
        <div class="flex-1 overflow-auto custom-scrollbar relative">
          <UTable
            v-model:expanded="expanded"
            :columns="columns"
            :data="logs"
            class="min-w-max h-full"
            :ui="{
              thead: 'bg-neutral-50/80 dark:bg-neutral-900/80 sticky top-0 z-30 backdrop-blur-sm',
              th: 'text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 py-4 px-6',
              td: 'px-6 py-4 font-mono text-neutral-700 dark:text-neutral-300',
              tr: 'hover:bg-primary-500/5 cursor-pointer transition-colors',
            }"
          >
            <template #status-cell="{ row }">
              <UBadge
                :color="(row.original.status || 0) < 400 ? 'success' : 'error'"
                variant="soft"
                size="md"
                class="font-black min-w-12 justify-center"
              >
                {{ row.original.status || '???' }}
              </UBadge>
            </template>

            <template #method-cell="{ row }">
              <span class="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-black uppercase tracking-widest opacity-70">
                {{ row.original.method }}
              </span>
            </template>

            <template #resource-cell="{ row }">
              <div class="text-[14px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                <span class="opacity-40 font-normal mr-1">{{ row.original.service }}</span>
                <span class="opacity-20 mx-1 text-neutral-400">/</span>
                <span class="group-hover:text-primary transition-colors">{{ row.original.entitySet || '-' }}</span>
              </div>
            </template>

            <template #duration-cell="{ row }">
              <div class="text-right tabular-nums text-neutral-500">
                <span class="font-bold text-sm">{{ row.original.duration }}</span>
                <span class="text-[10px] ml-1 opacity-30 uppercase font-sans font-black">ms</span>
              </div>
            </template>

            <template #expanded-row="{ row }">
              <div class="p-10 flex flex-col gap-12 max-w-6xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
                <div class="space-y-4">
                  <div class="flex items-center gap-3 text-[11px] font-black uppercase text-neutral-400 tracking-widest">
                    <UIcon name="i-lucide-link" class="w-4 h-4" />
                    Backend Target
                  </div>
                  <div class="p-6 bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800 font-mono text-[12px] break-all select-all text-neutral-600 dark:text-neutral-400 leading-relaxed shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    {{ row.original.targetUrl || 'Internal Mock' }}
                  </div>
                </div>

                <div v-if="row.original.requestHeaders" class="space-y-4">
                  <div class="flex items-center gap-3 text-[11px] font-black uppercase text-neutral-400 tracking-widest">
                    <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4" />
                    Request Headers
                  </div>
                  <div class="p-6 bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3 text-[12px] shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    <div v-for="(val, key) in row.original.requestHeaders" :key="key" class="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2 group/header">
                      <span class="text-primary-500 font-bold opacity-80 group-hover/header:opacity-100 transition-opacity">{{ key }}</span>
                      <span class="text-neutral-500 truncate ml-6 font-medium" :title="val">{{ val }}</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div class="space-y-4">
                    <div class="flex items-center gap-3 text-[11px] font-black uppercase text-neutral-400 tracking-widest">
                      <UIcon name="i-lucide-upload" class="w-4 h-4" />
                      Payload
                    </div>
                    <div class="p-6 bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800 h-80 overflow-auto custom-scrollbar shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                      <pre v-if="row.original.requestBody" class="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(row.original.requestBody, null, 2) }}</pre>
                      <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-sm font-sans">
                        <UIcon name="i-lucide-file-minus" class="w-10 h-10 mb-3" />
                        No Payload
                      </div>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="flex items-center gap-3 text-[11px] font-black uppercase text-neutral-400 tracking-widest">
                      <UIcon name="i-lucide-download" class="w-4 h-4" />
                      Response
                    </div>
                    <div class="p-6 bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800 h-80 overflow-auto custom-scrollbar shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                      <pre v-if="row.original.responseBody" class="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-mono">{{ JSON.stringify(row.original.responseBody, null, 2) }}</pre>
                      <div v-else class="h-full flex flex-col items-center justify-center opacity-20 italic text-sm font-sans">
                        <UIcon name="i-lucide-file-minus" class="w-10 h-10 mb-3" />
                        No Response Body
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UTable>

          <div
            v-if="logs.length === 0"
            class="p-32 flex flex-col items-center justify-center opacity-40 italic text-neutral-500"
          >
            <UIcon name="i-lucide-ban" class="w-12 h-12 mb-4 opacity-20" />
            <p class="text-base uppercase tracking-[0.2em]">
              No network activity recorded yet
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
