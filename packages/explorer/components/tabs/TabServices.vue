<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity, globalViewMode } = useSharedODataState()
const toast = useToast()

/**
 * Regenerates the SDK for a given service.
 * @param name The name of the service to regenerate.
 */
async function runGenerate(name: string) {
  await generateService(name)
  toast.add({
    title: `SDK for ${name} regenerated successfully`,
    icon: 'i-heroicons-check-circle',
    color: 'success',
  })
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      v-if="!selectedService"
      class="p-8 space-y-8 overflow-y-auto custom-scrollbar"
    >
      <div class="flex items-center justify-between px-2">
        <h2 class="text-sm font-bold opacity-70 uppercase tracking-wider">
          Available Services
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="svc in services"
          :key="svc.name"
          class="p-6 border rounded-2xl transition-all duration-200 cursor-pointer group bg-gray-50/50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-primary-500/50 dark:hover:border-primary-400/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 relative"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-all shadow-sm text-gray-400 group-hover:text-primary-500">
              <UIcon
                name="i-heroicons-circle-stack"
                class="w-6 h-6"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold truncate text-gray-900 dark:text-white leading-tight">{{ svc.name }}</span>
                <div class="flex items-center gap-1.5">
                  <UBadge
                    v-if="svc.version"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="text-[8px] px-1 py-0 font-black uppercase tracking-tighter"
                  >
                    {{ svc.version }}
                  </UBadge>
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="svc.isGenerated ? 'bg-success-500 shadow-[0_0_8px_rgba(0,220,130,0.3)]' : 'bg-warning-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]'"
                  />
                </div>
              </div>
              <div class="text-[11px] font-mono truncate text-gray-500 dark:text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
                {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
              </div>
            </div>
            <div class="opacity-0 group-hover:opacity-30 transition-opacity text-gray-400">
              <UIcon
                name="i-heroicons-chevron-right"
                class="w-5 h-5"
              />
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest relative z-10">
            <span class="opacity-40 group-hover:opacity-60 transition-opacity">SDK Generation</span>
            <span
              :class="svc.isGenerated ? 'text-success-500' : 'text-warning-500'"
              class="opacity-60 group-hover:opacity-80 transition-opacity"
            >
              {{ svc.isGenerated ? 'Completed' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="h-full flex flex-col pt-8 overflow-hidden"
    >
      <div class="px-6 flex items-center gap-4 mb-6 shrink-0 font-sans">
        <UButton
          icon="i-heroicons-chevron-left"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="selectedService = null; selectedEntity = null"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-lg font-bold leading-none text-gray-900 dark:text-white">
              {{ selectedService.name }}
            </h2>
            <UButton
              icon="i-heroicons-arrow-path"
              color="neutral"
              variant="ghost"
              size="xs"
              :loading="generatingStatus[selectedService.name]"
              @click="runGenerate(selectedService.name)"
            />
          </div>
          <div class="text-[11px] font-mono text-gray-500 dark:text-gray-400 opacity-90 tracking-tight">
            {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
          </div>
        </div>

        <div class="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700 items-center">
          <UButton
            label="Data"
            :variant="globalViewMode === 'explorer' ? 'solid' : 'ghost'"
            :color="globalViewMode === 'explorer' ? 'primary' : 'neutral'"
            size="xs"
            class="text-[9px] uppercase font-black tracking-widest"
            @click="globalViewMode = 'explorer'"
          />
          <UButton
            label="Schema"
            :variant="globalViewMode === 'schema' ? 'solid' : 'ghost'"
            :color="globalViewMode === 'schema' ? 'primary' : 'neutral'"
            size="xs"
            class="text-[9px] uppercase font-black tracking-widest"
            @click="globalViewMode = 'schema'"
          />
        </div>
      </div>

      <EntityExplorer v-show="globalViewMode === 'explorer'" />
      <SchemaExplorer v-show="globalViewMode === 'schema'" />
    </div>
  </div>
</template>
