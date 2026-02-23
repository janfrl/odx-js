<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import * as dagre from 'dagre'
import { markRaw, nextTick, onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'
import SchemaNode from './SchemaNode.vue'

// Styles
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const {
  selectedService,
  globalNodes,
  globalEdges,
  globalViewport,
  initializedServices,
  lastSelectedServiceForGraph,
} = useSharedODataState()

const { fitView, onViewportChange, setViewport, onPaneReady } = useVueFlow()

const loading = ref(false)
const isReady = ref(false)
const schemaData = ref<any>(null)

// Define custom node types
const nodeTypes = {
  schema: markRaw(SchemaNode),
}

// Save viewport changes to global state immediately
onViewportChange((viewport) => {
  if (isReady.value) {
    globalViewport.value = { ...viewport }
  }
})

// Ensure fitView works correctly on the first render or restoration
onPaneReady(() => {
  const serviceName = selectedService.value?.name || ''
  if (!initializedServices.value.has(serviceName)) {
    // Instant fit for the very first time to avoid "sliding" animation on entry
    fitView({ padding: 0.2 })
    initializedServices.value.add(serviceName)
    // Slightly longer delay to ensure the browser has painted the correctly positioned nodes
    setTimeout(() => isReady.value = true, 100)
  }
  else {
    // Restore exact viewport from global state
    setViewport(globalViewport.value)
    setTimeout(() => isReady.value = true, 100)
  }
})

async function fetchSchema(forceAutoFit = false) {
  if (!selectedService.value)
    return

  const isNewService = !initializedServices.value.has(selectedService.value.name)

  // ONLY hide the graph for a brand new service entry to hide the "top-left" jump.
  // For manual "Auto Layout" clicks, keep it visible for fast feedback.
  if (isNewService) {
    loading.value = true
    isReady.value = false
  }
  else if (forceAutoFit) {
    loading.value = true
    // isReady remains true here
  }

  try {
    const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
    schemaData.value = await res.json()

    if (isNewService || forceAutoFit) {
      generateGraph(forceAutoFit)
    }
    else {
      await nextTick()
      setViewport(globalViewport.value)
      setTimeout(() => {
        isReady.value = true
        loading.value = false
      }, 100)
    }

    lastSelectedServiceForGraph.value = selectedService.value.name
  }
  catch (e) {
    console.error('Failed to fetch schema', e)
    loading.value = false
  }
}

function generateGraph(autoFit = false) {
  if (!schemaData.value)
    return

  const newNodes: any[] = []
  const newEdges: any[] = []

  schemaData.value.entities.forEach((entity: any) => {
    newNodes.push({
      id: entity.name,
      type: 'schema',
      data: { entity },
      position: { x: 0, y: 0 },
    })

    entity.navigationProperties.forEach((nav: any) => {
      const assoc = schemaData.value.associations.find((a: any) =>
        a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship,
      )

      if (assoc) {
        const targetEnd = assoc.ends.find((e: any) => e.role === nav.toRole)
        const targetEntityName = targetEnd?.type.split('.').pop()

        if (targetEntityName && targetEntityName !== entity.name) {
          const edgeId = [entity.name, targetEntityName, assoc.name].sort().join('-')
          if (!newEdges.find(e => e.id === edgeId)) {
            newEdges.push({
              id: edgeId,
              source: entity.name,
              target: targetEntityName,
              label: targetEnd.multiplicity === '*' ? '1:N' : '1:1',
              animated: true,
              labelStyle: { fill: '#10b981', fontWeight: 700, fontSize: '10px' },
              style: { stroke: '#10b981', strokeWidth: 2 },
            })
          }
        }
      }
    })
  })

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  newNodes.forEach((node) => {
    const propCount = node.data.entity.properties.length
    g.setNode(node.id, { width: 200, height: 40 + (propCount * 22) })
  })
  newEdges.forEach(edge => g.setEdge(edge.source, edge.target))

  dagre.layout(g)

  newNodes.forEach((node) => {
    const nodeWithPos = g.node(node.id)
    node.position = { x: nodeWithPos.x - 100, y: nodeWithPos.y - 50 }
  })

  globalNodes.value = [...newNodes]
  globalEdges.value = [...newEdges]

  if (autoFit) {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 })
      setTimeout(() => {
        isReady.value = true
        loading.value = false
      }, 800)
    }, 50)
  }
  else {
    loading.value = false
  }
}

function copyMermaid() {
  if (!schemaData.value)
    return
  let code = 'erDiagram\n'
  schemaData.value.entities.forEach((entity: any) => {
    const props = entity.properties.map((p: any) => `    ${p.type.split('.').pop()} ${p.name} ${p.isKey ? 'PK' : ''}`).join('\n')
    code += `  ${entity.name} {\n${props}\n  }\n`
  })
  const addedAssocs = new Set()
  schemaData.value.entities.forEach((entity: any) => {
    entity.navigationProperties.forEach((nav: any) => {
      const assoc = schemaData.value.associations.find((a: any) => a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship)
      if (assoc && !addedAssocs.has(assoc.name)) {
        const end1 = assoc.ends[0]
        const end2 = assoc.ends[1]
        const type1 = end1.type.split('.').pop()
        const type2 = end2.type.split('.').pop()
        const m1 = end1.multiplicity === '*' ? '}o' : '||'
        const m2 = end2.multiplicity === '*' ? 'o{' : '||'
        code += `  ${type1} ${m1}--${m2} ${type2} : "${assoc.name}"\n`
        addedAssocs.add(assoc.name)
      }
    })
  })
  navigator.clipboard.writeText(code)
  devtoolsUiShowNotification({
    message: 'Mermaid diagram code copied to clipboard!',
    icon: 'i-carbon-copy',
    position: 'bottom-right',
    classes: 'text-base border-base',
  })
}

onMounted(() => {
  if (selectedService.value) {
    fetchSchema()
  }
})

watch(selectedService, () => {
  if (selectedService.value) {
    fetchSchema()
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden px-6 text-base relative">
    <div class="flex-1 flex flex-col min-h-0 bg-content rounded-t-xl overflow-hidden border-t border-x border-base shadow-sm text-base">
      <!-- Action Toolbar: Balanced style like Data view -->
      <div class="py-2 pl-4 pr-2 flex items-center justify-between bg-surface border-b border-base shrink-0 rounded-t-xl text-base">
        <div class="flex items-center gap-3 text-base">
          <span class="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 text-base">
            <div class="i-carbon-flow-connection text-primary" />
            Architecture Overview
          </span>
          <div v-if="loading" class="animate-pulse text-[10px] text-primary font-bold uppercase tracking-tight text-base">
            Refining...
          </div>
        </div>
        <div class="flex items-center gap-2 text-base">
          <NButton
            class="px-3 h-7 transition-all text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-500/10 ring-1 ring-inset ring-zinc-500/25 hover:bg-zinc-500/20 active:bg-zinc-500/25 border-none shadow-none font-bold uppercase text-[10px]"
            icon="i-carbon-center-to-fit"
            @click="fetchSchema(true)"
          >
            Auto Layout
          </NButton>
          <NButton
            class="px-3 h-7 transition-all text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-500/10 ring-1 ring-inset ring-zinc-500/25 hover:bg-zinc-500/20 active:bg-zinc-500/25 border-none shadow-none font-bold uppercase text-[10px]"
            icon="i-carbon-copy"
            @click="copyMermaid"
          >
            Mermaid
          </NButton>
        </div>
      </div>

      <!-- Graph Area -->
      <div
        class="flex-1 relative overflow-hidden bg-white dark:bg-[#050505] transition-opacity duration-300 text-base"
        :style="{ opacity: isReady ? 1 : 0 }"
      >
        <VueFlow
          v-model:nodes="globalNodes"
          v-model:edges="globalEdges"
          :node-types="nodeTypes"
          class="dark"
          :min-zoom="0.05"
          :max-zoom="4"
        >
          <Background pattern-color="#333" :gap="20" />
        </VueFlow>
      </div>
    </div>
  </div>
</template>

<style>
/* VueFlow custom overrides to match Nuxt DevTools */
.vue-flow__edge-path {
  stroke-dasharray: 5;
  stroke-dashoffset: 10;
  animation: dashdraw 0.5s linear infinite;
}

@keyframes dashdraw {
  from { stroke-dashoffset: 10; }
  to { stroke-dashoffset: 0; }
}

.vue-flow__edge-label {
  background: #10b981;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.dark .vue-flow__edge-textbg { fill: #050505; }
.vue-flow__controls { display: none; }
</style>
