<script setup lang="ts">
import { UBadge, UButton, UIcon } from '#components'

const { logs, clearLogs, services, logFilterService, activeTab, selectedTraceLogId } = useSharedODataState()
const toast = useToast()

const activeRowTabs = ref<Record<string, string>>({})

function getRowTab(id: string) {
  return activeRowTabs.value[id] || 'payloads'
}

function getRowTabs(row: any) {
  return [
    { label: 'Payloads', icon: 'i-lucide-box', value: 'payloads' },
    { label: 'Headers', icon: 'i-lucide-list', value: 'headers' },
  ]
}

function viewProxyTrace(id: string) {
  selectedTraceLogId.value = id
  activeTab.value = 'proxy'
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copied to clipboard',
    icon: 'i-lucide-copy',
    color: 'success',
    size: 'xs',
  })
}

const filteredLogs = computed(() => {
  if (!logFilterService.value)
    return logs.value
  const filter = logFilterService.value.toLowerCase()
  return logs.value.filter((l: any) => {
    if (!l.service)
      return false
    return l.service.toLowerCase() === filter
  })
})

const serviceOptions = computed(() => {
  return [
    { label: 'All Services', value: null },
    ...services.value.map((s: any) => ({
      label: s.name,
      value: (s.route || s.name).toLowerCase(),
    })),
  ]
})

function safeStringify(data: any): string {
  if (!data)
    return ''
  try {
    return JSON.stringify(data, null, 2)
  }
  catch (e: any) {
    console.error('[TabLogs] Stringify failed:', e)
    return `[Stringify Failed: ${e.message}]`
  }
}

const columns = [
  {
    id: 'expand',
    cell: ({ row }: any) => {
      return h('div', {
        class: 'px-6 py-4 cursor-pointer flex items-center h-full w-full',
        onClick: () => row.toggleExpanded(),
      }, [
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          size: 'sm',
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
      const isPending = row.original.isPending
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer flex items-center h-full w-full',
      }, [
        isPending
          ? h(UIcon, { name: 'i-lucide-loader-2', class: 'animate-spin w-5 h-5 text-primary opacity-50' })
          : h(UBadge, {
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
          class: 'px-3 py-1 rounded-lg bg-muted text-[11px] font-black uppercase tracking-widest opacity-70',
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
        class: 'px-6 py-4 cursor-pointer text-[14px] font-bold tracking-tight text-highlighted flex items-center h-full w-full',
      }, [
        h('span', { class: 'opacity-40 font-normal mr-1' }, row.original.service),
        h('span', { class: 'opacity-20 mx-1 text-muted' }, '/'),
        h('span', { class: 'group-hover:text-primary transition-colors' }, row.original.entitySet || '-'),
      ])
    },
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorKey: 'duration',
    cell: ({ row }: any) => {
      const isPending = row.original.isPending
      return h('div', {
        onClick: () => row.toggleExpanded(),
        class: 'px-6 py-4 cursor-pointer tabular-nums text-muted flex items-center justify-end h-full w-full',
      }, [
        isPending
          ? h('span', { class: 'animate-pulse font-bold' }, '...')
          : h('div', { class: 'flex items-center' }, [
              h('span', { class: 'font-bold text-sm' }, row.original.duration),
              h('span', { class: 'text-[10px] ml-1 text-muted/50 uppercase font-sans font-black' }, 'ms'),
            ]),
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
      <USelect
        v-model="logFilterService"
        :items="serviceOptions"
        size="sm"
        variant="subtle"
        class="w-40 font-bold"
        icon="i-lucide-filter"
      />
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
      <div
        class="flex-1 flex flex-col min-h-0 border-t border-x border-default rounded-t-2xl bg-default/50 shadow-sm overflow-hidden isolate"
        style="transform: translateZ(0);"
      >
        <div class="flex-1 overflow-auto custom-scrollbar relative">
          <UTable
            :columns="columns"
            :data="filteredLogs"
            row-id="id"
            class="w-full"
            :ui="{
              thead: 'bg-default/10 sticky top-0 z-30',
              th: 'text-[11px] font-bold uppercase tracking-widest text-muted border-b border-default py-4 px-6',
              td: 'p-0 font-mono text-toned',
              tbody: 'divide-y divide-default [&>tr:hover]:bg-primary-500/5 [&>tr[data-expanded=true]]:bg-muted [&>tr]:transition-colors [&>tr]:group',
            }"
          >
            <template #empty>
              <div class="flex flex-col items-center justify-center py-24 text-center">
                <div class="w-16 h-16 rounded-2xl bg-default border border-default flex items-center justify-center mb-6 shadow-sm">
                  <UIcon name="i-lucide-activity" class="text-muted w-8 h-8" />
                </div>
                <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-highlighted">
                  No network activity
                </h3>
                <p class="text-[12px] text-muted max-w-70 leading-relaxed">
                  Recorded OData request and response logs will appear here in real-time.
                </p>
              </div>
            </template>

            <template #expanded="{ row }">
              <div
                class="px-6 py-6 border-b border-default cursor-default bg-muted/20"
                @click.stop
              >
                <div class="space-y-6">
                  <!-- URL & Quick Actions -->
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 flex items-center gap-3 bg-default px-4 py-2.5 rounded-xl border border-default shadow-sm min-w-0">
                      <UBadge
                        :color="Number(row.original.status || 0) < 400 ? 'success' : 'error'"
                        variant="soft"
                        size="sm"
                        class="font-black font-mono shrink-0"
                      >
                        {{ row.original.status || '???' }}
                      </UBadge>
                      <span class="font-black px-2 py-0.5 rounded bg-muted text-[11px] font-mono shrink-0 uppercase tracking-widest opacity-70">{{ row.original.method }}</span>
                      <span class="text-[12px] font-mono text-toned truncate">{{ row.original.targetUrl || 'Internal Mock' }}</span>
                      <UButton
                        icon="i-lucide-copy"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        class="ml-auto"
                        @click="copyToClipboard(row.original.targetUrl || '')"
                      />
                    </div>

                    <div class="flex items-center gap-4 shrink-0">
                      <span class="text-[10px] font-black uppercase tracking-widest text-muted tabular-nums">{{ new Date(row.original.timestamp).toLocaleString() }}</span>
                      <UButton
                        v-if="row.original.proxyTrace?.length"
                        label="Proxy Trace"
                        icon="i-lucide-cable"
                        size="sm"
                        variant="subtle"
                        color="primary"
                        class="font-bold"
                        @click="viewProxyTrace(row.original.id)"
                      />
                    </div>
                  </div>

                  <!-- Tabbed Details -->
                  <div class="bg-default rounded-2xl border border-default shadow-sm overflow-hidden flex flex-col">
                    <div class="px-4 py-2 border-b border-default bg-default/50 flex items-center justify-between">
                      <UTabs
                        :model-value="getRowTab(row.original.id)"
                        :items="getRowTabs(row.original)"
                        size="sm"
                        variant="subtle"
                        class="w-fit"
                        @update:model-value="v => activeRowTabs[row.original.id] = v"
                      />
                    </div>

                    <div class="p-6">
                      <!-- Payloads Tab (Side-by-side) -->
                      <div v-if="getRowTab(row.original.id) === 'payloads'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Request Column -->
                        <div class="flex flex-col gap-3 min-w-0">
                          <div class="flex items-center justify-between h-8">
                            <h3 class="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                              <UIcon name="i-lucide-upload" class="w-3.5 h-3.5" /> Request Body
                            </h3>
                            <UButton
                              v-if="row.original.requestBody && Object.keys(row.original.requestBody).length > 0"
                              icon="i-lucide-copy"
                              variant="ghost"
                              color="neutral"
                              size="xs"
                              label="Copy JSON"
                              class="font-bold opacity-50 hover:opacity-100"
                              @click="copyToClipboard(safeStringify(row.original.requestBody))"
                            />
                          </div>
                          <pre v-if="row.original.requestBody && Object.keys(row.original.requestBody).length > 0" class="flex-1 text-[11px] font-mono bg-muted/30 p-4 rounded-xl border border-default overflow-auto max-h-120 custom-scrollbar text-toned whitespace-pre">{{ safeStringify(row.original.requestBody) }}</pre>
                          <div v-else class="flex-1 min-h-32 flex flex-col items-center justify-center bg-muted/20 rounded-xl border border-dashed border-default p-6 text-center">
                            <UIcon name="i-lucide-file-x-2" class="w-6 h-6 mb-2 text-muted opacity-30" />
                            <span class="text-[10px] font-medium text-muted uppercase">No body</span>
                          </div>
                        </div>

                        <!-- Response Column -->
                        <div class="flex flex-col gap-3 min-w-0">
                          <div class="flex items-center justify-between h-8">
                            <h3 class="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                              <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Response Body
                            </h3>
                            <UButton
                              v-if="row.original.responseBody && row.original.responseBody !== '[Streamed Response]'"
                              icon="i-lucide-copy"
                              variant="ghost"
                              color="neutral"
                              size="xs"
                              label="Copy JSON"
                              class="font-bold opacity-50 hover:opacity-100"
                              @click="copyToClipboard(safeStringify(row.original.responseBody))"
                            />
                          </div>
                          <pre v-if="row.original.responseBody && row.original.responseBody !== '[Streamed Response]'" class="flex-1 text-[11px] font-mono bg-muted/30 p-4 rounded-xl border border-default overflow-auto max-h-120 custom-scrollbar text-toned whitespace-pre">{{ safeStringify(row.original.responseBody) }}</pre>
                          <div v-else-if="row.original.responseBody === '[Streamed Response]'" class="flex-1 min-h-32 flex flex-col items-center justify-center bg-muted/20 rounded-xl border border-dashed border-default p-6 text-center">
                            <UIcon name="i-lucide-radio" class="w-6 h-6 mb-2 text-primary opacity-50 animate-pulse" />
                            <span class="text-[10px] font-medium text-muted uppercase">Streamed Content</span>
                          </div>
                          <div v-else class="flex-1 min-h-32 flex flex-col items-center justify-center bg-muted/20 rounded-xl border border-dashed border-default p-6 text-center">
                            <UIcon name="i-lucide-file-x-2" class="w-6 h-6 mb-2 text-muted opacity-30" />
                            <span class="text-[10px] font-medium text-muted uppercase">No body</span>
                          </div>
                        </div>
                      </div>

                      <!-- Headers Tab -->
                      <div v-if="getRowTab(row.original.id) === 'headers'" class="space-y-6">
                        <div class="space-y-3">
                          <h3 class="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                            <UIcon name="i-lucide-upload" class="w-3.5 h-3.5" /> Request Headers
                          </h3>
                          <div v-if="row.original.requestHeaders && Object.keys(row.original.requestHeaders).length > 0" class="text-[11px] font-mono bg-muted/30 p-4 rounded-xl border border-default space-y-2">
                            <div v-for="(val, key) in row.original.requestHeaders" :key="key" class="flex items-start gap-4">
                              <span class="font-bold text-toned shrink-0 min-w-32">{{ key }}:</span>
                              <span class="text-muted break-all">{{ val }}</span>
                            </div>
                          </div>
                          <p v-else class="text-xs text-muted italic p-4 bg-muted/20 rounded-xl border border-dashed border-default">No request headers recorded</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </div>
  </div>
</template>
