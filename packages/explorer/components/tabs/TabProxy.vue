<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'
import TabHeader from '../TabHeader.vue'

const { logs, useCORSBridge } = useSharedODataState()

// Fetch current identity data
const { data: me } = await useFetch<any>('/__odx__/me')

// Get the trace of the absolute latest request that went through the proxy
const latestTrace = computed(() => {
  const latestWithTrace = logs.value.find(l => l.proxyTrace && l.proxyTrace.length > 0)
  return latestWithTrace?.proxyTrace || []
})

const identityFields = computed(() => {
  if (!me.value) return []
  return [
    { label: 'Email', value: me.value.Usermail, icon: 'i-lucide-mail' },
    { label: 'User ID', value: me.value.Userid, icon: 'i-lucide-user' },
    { label: 'Company', value: me.value.Usercompany, icon: 'i-lucide-building-2' },
  ]
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans">
    <TabHeader
      title="Proxy Engine"
      description="Introspect the active security context and request lifecycle."
    />

    <div class="flex-1 overflow-hidden p-6 pt-0 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <!-- Identity Card -->
        <div class="lg:col-span-1 flex flex-col gap-6 overflow-auto custom-scrollbar pr-2">
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
                <UBadge color="primary" variant="soft" size="sm">XSUAA / BTP</UBadge>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span class="text-xs text-neutral-500">Transport</span>
                <UBadge color="neutral" variant="soft" size="sm">Nitro / H3</UBadge>
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
              <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                Live Proxy Telemetry
              </h3>
            </div>
            <span class="text-[10px] font-mono text-neutral-400">Showing trace for latest request</span>
          </div>

          <div class="flex-1 overflow-auto custom-scrollbar p-6">
            <div v-if="!latestTrace.length" class="h-full flex flex-col items-center justify-center opacity-40 italic text-neutral-500">
              <UIcon name="i-lucide-activity" class="w-12 h-12 mb-4 opacity-20" />
              <p>No telemetry data recorded yet.</p>
              <p class="text-[10px] mt-1 uppercase tracking-widest">Execute a request to see the lifecycle trace.</p>
            </div>

            <div v-else class="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
              <div v-for="(entry, idx) in latestTrace" :key="idx" class="relative flex items-start gap-6 group">
                <!-- Dot -->
                <div class="absolute left-5 -translate-x-1/2 mt-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-black bg-neutral-300 dark:bg-neutral-700 group-last:bg-primary-500 group-last:ring-primary-100 dark:group-last:ring-primary-900/30" />
                
                <div class="ml-10 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <UBadge color="neutral" variant="soft" size="sm" class="text-[9px] uppercase font-black tracking-tighter px-1.5">
                      {{ entry.label }}
                    </UBadge>
                    <span class="text-[10px] font-mono text-neutral-400">{{ new Date(entry.timestamp).toLocaleTimeString() }}</span>
                  </div>
                  <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-semibold">
                    {{ entry.message }}
                  </p>
                  <div v-if="entry.details" class="mt-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-3 border border-neutral-200/50 dark:border-neutral-800/50">
                    <pre class="text-[11px] font-mono text-neutral-500 overflow-auto">{{ JSON.stringify(entry.details, null, 2) }}</pre>
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
