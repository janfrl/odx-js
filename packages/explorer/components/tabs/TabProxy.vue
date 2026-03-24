<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { logs, useCORSBridge, selectedTraceLogId } = useSharedODataState()

// Fetch current identity data
const { data: me } = await useFetch<any>('/__odx__/me')

// Get the trace of the absolute latest request that went through the proxy
const latestLiveRequest = computed(() => {
  return logs.value.find(l => l.proxyTrace && l.proxyTrace.length > 0)
})

// Current request being viewed (either selected or latest live)
const activeRequest = computed(() => {
  if (selectedTraceLogId.value) {
    return logs.value.find(l => l.id === selectedTraceLogId.value) || latestLiveRequest.value
  }
  return latestLiveRequest.value
})

const isViewingHistorical = computed(() => {
  return selectedTraceLogId.value && activeRequest.value?.id === selectedTraceLogId.value
})

const latestTrace = computed(() => {
  const trace = activeRequest.value?.proxyTrace || []
  return trace.map((entry, idx) => {
    const prev = trace[idx - 1]
    const delta = prev ? entry.duration - prev.duration : entry.duration
    return { ...entry, delta }
  })
})

const expandedEntries = ref<Set<number>>(new Set())

function toggleEntry(idx: number) {
  if (expandedEntries.value.has(idx))
    expandedEntries.value.delete(idx)
  else
    expandedEntries.value.add(idx)
}

const labelColors: Record<string, any> = {
  Request: 'neutral',
  Security: 'amber',
  Auth: 'orange',
  BTP: 'purple',
  Hooks: 'indigo',
  Proxy: 'primary',
  Data: 'teal',
  Rules: 'blue',
  Response: 'success',
}

function getLabelColor(label: string, status?: string) {
  if (status === 'error')
    return 'error'
  if (status === 'success')
    return 'success'
  return labelColors[label] || 'neutral'
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.toLocaleTimeString([], { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

const identityFields = computed(() => {
  if (!me.value)
    return []
  return [
    { label: 'Email', value: me.value.Usermail, icon: 'i-lucide-mail' },
    { label: 'User ID', value: me.value.Userid, icon: 'i-lucide-user' },
    { label: 'Company', value: me.value.Usercompany, icon: 'i-lucide-building-2' },
  ]
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans">
    <div class="flex-1 overflow-hidden p-6 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <!-- Sidebar Info & Settings -->
        <div class="lg:col-span-1 flex flex-col gap-8 overflow-auto custom-scrollbar pr-2">
          <!-- Integrated Header -->
          <header class="flex flex-col gap-1.5 px-1 shrink-0">
            <h1 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Proxy Engine
            </h1>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Introspect the active security context and request lifecycle.
            </p>
          </header>

          <!-- Identity Card -->
          <UPageCard
            title="Active Identity"
            description="The current security principal resolved by the proxy."
            icon="i-lucide-fingerprint"
          >
            <div class="space-y-4 mt-4">
              <div v-for="field in identityFields" :key="field.label" class="flex flex-col gap-1">
                <span class="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <UIcon :name="field.icon" class="w-3 h-3" />
                  {{ field.label }}
                </span>
                <span class="text-sm font-mono text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded truncate">
                  {{ field.value || 'N/A' }}
                </span>
              </div>

              <!-- Companies -->
              <div v-if="me?.Usercompanies?.length" class="space-y-2 pt-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <UIcon name="i-lucide-briefcase" class="w-3 h-3" />
                  Authorized Companies
                </span>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="c in me.Usercompanies"
                    :key="c.id"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="font-mono"
                  >
                    {{ c.id }} - {{ c.name }}
                  </UBadge>
                </div>
              </div>
            </div>
          </UPageCard>

          <UPageCard
            title="Strategy"
            description="Active proxy and authentication drivers."
            icon="i-lucide-cpu"
          >
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span class="text-xs text-neutral-500">Auth Driver</span>
                <UBadge color="primary" variant="soft" size="sm">
                  XSUAA / BTP
                </UBadge>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span class="text-xs text-neutral-500">Transport</span>
                <UBadge color="neutral" variant="soft" size="sm">
                  Nitro / H3
                </UBadge>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span class="text-xs text-neutral-500">Mock Mode</span>
                <UBadge :color="me?._synthetic ? 'warning' : 'neutral'" variant="soft" size="sm">
                  {{ me?._synthetic ? 'Active' : 'Disabled' }}
                </UBadge>
              </div>
            </div>
          </UPageCard>

          <UPageCard
            title="Developer Settings"
            description="Control how the explorer interacts with services."
            icon="i-lucide-settings-2"
          >
            <div class="mt-4 space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-neutral-900 dark:text-neutral-100 italic">CORS Bridge Mode</span>
                  <p class="text-[10px] text-neutral-500 leading-tight">
                    Route "Direct" services through the proxy to bypass CORS during development.
                  </p>
                </div>
                <USwitch v-model="useCORSBridge" size="sm" />
              </div>

              <div class="p-3 bg-primary-50 dark:bg-primary-950/20 rounded-lg border border-primary-100 dark:border-primary-900/30">
                <p class="text-[10px] text-primary-700 dark:text-primary-400 leading-relaxed italic">
                  <span class="font-bold uppercase">Pro Tip:</span>
                  Turn this OFF to verify if your OData server correctly allows direct requests from your production domain.
                </p>
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Telemetry Feed -->
        <div class="lg:col-span-2 flex flex-col min-h-0 bg-white dark:bg-black border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full transition-colors duration-500"
                :class="[isViewingHistorical ? 'bg-amber-500' : 'bg-primary-500 animate-pulse']"
              />
              <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                {{ isViewingHistorical ? 'Historical Trace' : 'Live Proxy Telemetry' }}
              </h3>
            </div>

            <div class="flex items-center gap-4">
              <UButton
                v-if="isViewingHistorical"
                label="Return to Live"
                icon="i-lucide-zap"
                size="xs"
                variant="ghost"
                color="primary"
                class="font-bold uppercase tracking-tighter"
                @click="selectedTraceLogId = null"
              />
              <span class="text-[10px] font-mono text-neutral-400">
                {{ isViewingHistorical ? `Log ID: ${selectedTraceLogId}` : 'Showing latest request' }}
              </span>
            </div>
          </div>

          <div class="flex-1 overflow-auto custom-scrollbar p-6">
            <div v-if="!latestTrace.length" class="h-full flex flex-col items-center justify-center text-center">
              <div class="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 shadow-sm">
                <UIcon name="i-lucide-activity" class="text-neutral-400 w-8 h-8" />
              </div>
              <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-neutral-900 dark:text-neutral-100">
                No telemetry data
              </h3>
              <p class="text-[12px] text-neutral-500 dark:text-neutral-400 max-w-64 leading-relaxed">
                Execute an OData request to see the internal proxy lifecycle trace.
              </p>
            </div>

            <div v-else class="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
              <div
                v-for="(entry, idx) in latestTrace"
                :key="idx"
                class="relative flex items-start gap-6 group cursor-pointer"
                @click="toggleEntry(idx)"
              >
                <!-- Dot -->
                <div
                  class="absolute left-5 -translate-x-1/2 mt-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-black transition-colors duration-500 z-10"
                  :class="[
                    entry.status === 'success' ? 'bg-success-500 ring-success-50 dark:ring-success-950/30'
                    : entry.status === 'error' ? 'bg-error-500 ring-error-50 dark:ring-error-950/30'
                      : 'bg-neutral-300 dark:bg-neutral-700 ring-white dark:ring-black',
                  ]"
                />

                <div class="ml-10 flex-1 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-900/50 -my-2 py-2 px-3 rounded-xl transition-colors">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="getLabelColor(entry.label, entry.status)"
                        variant="soft"
                        size="sm"
                        class="text-[9px] uppercase font-black tracking-tighter px-1.5"
                      >
                        {{ entry.label }}
                      </UBadge>
                      <span class="text-[10px] font-mono text-neutral-400">
                        {{ formatTime(entry.timestamp) }}
                        <span v-if="idx > 0 && entry.delta > 0" class="ml-1 text-primary-500 font-bold">(+{{ entry.delta }}ms)</span>
                      </span>
                    </div>
                    <UIcon
                      v-if="entry.details"
                      name="i-lucide-chevron-down"
                      class="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200"
                      :class="[expandedEntries.has(idx) ? 'rotate-180' : '']"
                    />
                  </div>
                  <p
                    class="text-sm leading-relaxed font-semibold"
                    :class="[
                      entry.status === 'error' ? 'text-error-600 dark:text-error-400'
                      : entry.status === 'success' ? 'text-success-600 dark:text-success-400'
                        : 'text-neutral-700 dark:text-neutral-300',
                    ]"
                  >
                    {{ entry.message }}
                  </p>

                  <div
                    v-if="entry.details && expandedEntries.has(idx)"
                    class="mt-3 bg-white dark:bg-neutral-950 rounded-lg p-3 border border-neutral-200/50 dark:border-neutral-800 shadow-inner overflow-hidden"
                    @click.stop
                  >
                    <pre class="text-[11px] font-mono text-neutral-500 overflow-auto custom-scrollbar">{{ JSON.stringify(entry.details, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
