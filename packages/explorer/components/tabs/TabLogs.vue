<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, clearLogs } = useSharedODataState()
const toast = useToast()

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns = [
  {
    id: 'expand',
    cell: ({ row }: any) => {
      return h('div', {
        class: 'px-6 py-4 cursor-pointer flex items-center h-full w-full',
        onClick: () => row.toggleExpanded(),
      }, [
        h(UButton, {
          color: 'neutral' as const,
          variant: 'ghost' as const,
          size: 'sm' as const,
          icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
          class: 'pointer-events-none text-neutral-400',
        }),
      ])
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: any) => {
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer flex items-center h-full w-full',
      }, [
        h(UBadge, {
          color: Number(row.original.status || 0) < 400 ? 'success' : 'error',
          variant: 'soft',
          size: 'md',
          class: 'font-black min-w-12 justify-center',
        }, () => row.original.status || '???'),
      ])
    },
  },
  {
    id: 'method',
    header: 'Method',
    accessorKey: 'method',
    cell: ({ row }: any) => {
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer flex items-center h-full w-full',
      }, [
        h('span', {
          class: 'px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-black uppercase tracking-widest opacity-70',
        }, row.original.method),
      ])
    },
  },
  {
    id: 'resource',
    header: 'Resource',
    accessorKey: 'service',
    cell: ({ row }: any) => {
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer text-[14px] font-bold tracking-tight text-neutral-900 dark:text-white flex items-center h-full w-full',
      }, [
        h('span', { class: 'opacity-40 font-normal mr-1' }, row.original.service),
        h('span', { class: 'opacity-20 mx-1 text-neutral-400' }, '/'),
        h('span', { class: 'group-hover:text-primary transition-colors' }, row.original.entitySet || '-'),
      ])
    },
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorKey: 'duration',
    cell: ({ row }: any) => {
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer tabular-nums text-neutral-500 flex items-center justify-end h-full w-full',
      }, [
        h('span', { class: 'font-bold text-sm' }, row.original.duration),
        h('span', { class: 'text-[10px] ml-1 text-neutral-400 dark:text-neutral-600 uppercase font-sans font-black' }, 'ms'),
      ])
    },
  },
]

async function runClear() {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to clear all traffic logs?')) {
    await clearLogs()
    toast.add({
      id: 'purge-history-success',
      title: 'Traffic history purged',
      icon: 'i-lucide-trash-2',
      color: 'success',
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans">
    <TabHeader
      title="Traffic Monitor"
      description="Live request/response logs from the OData proxy."
    >
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
    </TabHeader>

    <div class="flex-1 flex flex-col min-h-0 relative px-6 pt-2 pb-0">
      <div class="flex-1 flex flex-col min-h-0 isolate border-t border-x border-neutral-200 dark:border-neutral-800 rounded-t-2xl bg-white dark:bg-neutral-900/50 shadow-sm">
        <div class="flex-1 overflow-auto custom-scrollbar relative rounded-t-2xl" style="mask-image: radial-gradient(white, black); -webkit-mask-image: -webkit-radial-gradient(white, black);">
          <UTable
            :columns="columns"
            :data="logs"
            class="min-w-max h-full"
            :ui="{
              thead: 'bg-neutral-50/80 dark:bg-neutral-900/80 sticky top-0 z-30 backdrop-blur-sm',
              th: 'text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 py-4 px-6',
              td: 'p-0 font-mono text-neutral-700 dark:text-neutral-300',
              tbody: 'divide-y divide-neutral-200 dark:divide-neutral-800/60 [&>tr:hover]:bg-primary-500/5 [&>tr[data-expanded=true]]:bg-neutral-50 dark:[&>tr[data-expanded=true]]:bg-neutral-900/40 [&>tr]:transition-colors [&>tr]:group',
            }"
          >
            <template #expanded="{ row }">
              <div
                class="px-6 py-8 border-b border-neutral-100 dark:border-neutral-800/50 cursor-default"
                @click.stop
              >
                <div class="space-y-6">
                  <div class="space-y-3">
                    <h3 class="text-[10px] font-bold text-neutral-900 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <UIcon name="i-lucide-globe" class="w-3.5 h-3.5 opacity-70" /> Request URL
                    </h3>
                    <div class="text-[12px] font-mono text-neutral-600 dark:text-neutral-300 break-all bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
                      <span class="font-black" :class="Number(row.original.status || 0) < 400 ? 'text-green-500' : 'text-red-500'">{{ row.original.method }}</span>
                      <span>{{ row.original.targetUrl || 'Internal Mock' }}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <div class="flex flex-col gap-3 h-full">
                      <h3 class="text-[10px] font-bold text-neutral-900 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                        <UIcon name="i-lucide-upload" class="w-3.5 h-3.5 opacity-70" /> Request Payload
                      </h3>

                      <div class="flex flex-col gap-3 flex-1">
                        <div v-if="row.original.requestHeaders && Object.keys(row.original.requestHeaders).length > 0" class="shrink-0 text-[11px] font-mono bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1.5">
                          <div v-for="(val, key) in row.original.requestHeaders" :key="key" class="flex justify-between gap-4">
                            <span class="font-bold text-neutral-700 dark:text-neutral-500 shrink-0">{{ key }}:</span>
                            <span class="text-neutral-500 dark:text-neutral-400 truncate" :title="val">{{ val }}</span>
                          </div>
                        </div>

                        <pre v-if="row.original.requestBody" class="flex-1 text-[11px] font-mono bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-auto max-h-104 custom-scrollbar text-neutral-600 dark:text-neutral-300">{{ JSON.stringify(row.original.requestBody, null, 2) }}</pre>

                        <div v-else class="flex-1 min-h-32 flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-950/40 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800/80 shadow-sm p-6 text-center">
                          <UIcon name="i-lucide-file-x-2" class="w-8 h-8 mb-3 text-neutral-400 dark:text-neutral-600 opacity-50" />
                          <span class="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">No request body</span>
                          <span class="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1">This request was sent without a payload.</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col gap-3 h-full">
                      <h3 class="text-[10px] font-bold text-neutral-900 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                        <UIcon name="i-lucide-download" class="w-3.5 h-3.5 opacity-70" /> Response Payload
                      </h3>

                      <div class="flex flex-col gap-3 flex-1">
                        <pre v-if="row.original.responseBody" class="flex-1 text-[11px] font-mono bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-auto max-h-104 custom-scrollbar text-neutral-600 dark:text-neutral-300">{{ JSON.stringify(row.original.responseBody, null, 2) }}</pre>

                        <div v-else class="flex-1 min-h-32 flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-950/40 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800/80 shadow-sm p-6 text-center">
                          <UIcon name="i-lucide-file-x-2" class="w-8 h-8 mb-3 text-neutral-400 dark:text-neutral-600 opacity-50" />
                          <span class="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">No response body</span>
                          <span class="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1">The server returned an empty response.</span>
                        </div>
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
