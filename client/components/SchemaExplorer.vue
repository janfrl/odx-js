<script setup lang="ts">
import type { NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { useElementSize, useEventListener } from '@vueuse/core'
import * as dagre from 'dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
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

const { fitView, onViewportChange, setViewport, onPaneReady, zoomIn, zoomOut, getViewport, setCenter } = useVueFlow()

const containerRef = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(containerRef)

const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const schemaData = ref<any>(null)
const layoutMode = ref<'hierarchical' | 'compact' | 'elk'>('elk')

const elk = new ELK()

// State to remember the view before resize (width, height, x, y, zoom)
let preTransitionState: { x: number, y: number, zoom: number } | null = null

async function toggleFullscreen() {
  if (!containerRef.value)
    return

  const view = getViewport()
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight

  // Capture current center in project coordinates
  preTransitionState = {
    x: (-view.x + (w / 2)) / view.zoom,
    y: (-view.y + (h / 2)) / view.zoom,
    zoom: view.zoom,
  }

  if (!document.fullscreenElement) {
    await containerRef.value.requestFullscreen().catch(console.error)
  }
  else {
    await document.exitFullscreen().catch(console.error)
  }
}

function fitToScreen() {
  fitView({ padding: 0.2, duration: 400 })
}

// Handle Keyboard Shortcuts
useEventListener('keydown', (e) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
  if (isInput) return

  // Toggle Fullscreen with 'f' key
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen()
  }
  // Fit View with 'r' key
  if (e.key === 'r' || e.key === 'R') {
    fitToScreen()
  }
  // Zoom In with '+' or '=' key
  if (e.key === '+' || e.key === '=') {
    zoomIn()
  }
  // Zoom Out with '-' key
  if (e.key === '-') {
    zoomOut()
  }
})

// Watch for container size changes to adjust the view instantly
watch([width, height], () => {
  if (preTransitionState) {
    // requestAnimationFrame ensures we wait for the browser to paint the new size
    requestAnimationFrame(() => {
      if (!preTransitionState)
        return

      // Restore the focal point instantly
      setCenter(preTransitionState.x, preTransitionState.y, { zoom: preTransitionState.zoom })
      preTransitionState = null
    })
  }
})

// Update fullscreen state
onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

// Define custom node types
const nodeTypes: NodeTypesObject = {
  schema: markRaw(SchemaNode),
}

watch(layoutMode, () => {
  generateGraph(true)
})

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

async function generateGraph(autoFit = false) {
  if (!schemaData.value)
    return

  const newNodes: any[] = []
  const newEdges: any[] = []

  // 1. Create Nodes and Edges
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

  // 2. Decide Layout Strategy
  if (layoutMode.value === 'elk') {
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '100',
        'elk.layered.spacing.nodeNodeBetweenLayers': '150',
        'elk.padding': '[top=50,left=50,bottom=50,right=50]',
      },
      children: newNodes.map(n => ({
        id: n.id,
        width: 250,
        height: 60 + (n.data.entity.properties.length * 22),
      })),
      edges: newEdges.map(e => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    }

    const layoutedGraph = await elk.layout(elkGraph)
    newNodes.forEach((node) => {
      const elkNode = layoutedGraph.children?.find(c => c.id === node.id)
      if (elkNode) {
        node.position = { x: elkNode.x || 0, y: elkNode.y || 0 }
      }
    })
  }
  else {
    const connectedNodeIds = new Set<string>()
    newEdges.forEach((e) => {
      connectedNodeIds.add(e.source)
      connectedNodeIds.add(e.target)
    })

    const connectedNodes = newNodes.filter(n => connectedNodeIds.has(n.id))
    const isolatedNodes = newNodes.filter(n => !connectedNodeIds.has(n.id))

    // 3. Layout Connected Nodes via Dagre
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 })
    g.setDefaultEdgeLabel(() => ({}))

    connectedNodes.forEach((node) => {
      const propCount = node.data.entity.properties.length
      g.setNode(node.id, { width: 250, height: 60 + (propCount * 22) })
    })

    if (layoutMode.value === 'hierarchical') {
      isolatedNodes.forEach((node) => {
        g.setNode(node.id, { width: 250, height: 60 + (node.data.entity.properties.length * 22) })
      })
    }

    newEdges.forEach(edge => g.setEdge(edge.source, edge.target))
    dagre.layout(g)

    // Apply positions from Dagre
    let maxX = 0
    let maxY = 0

    newNodes.forEach((node) => {
      const dNode = g.node(node.id)
      if (dNode) {
        node.position = { x: dNode.x - 125, y: dNode.y - 50 }
        maxX = Math.max(maxX, node.position.x + 250)
        maxY = Math.max(maxY, node.position.y + 100)
      }
    })

    // 4. Layout Isolated Nodes in a Grid (if Compact Mode)
    if (layoutMode.value === 'compact' && isolatedNodes.length > 0) {
      const cols = Math.ceil(Math.sqrt(isolatedNodes.length))
      const startX = 0
      const startY = maxY + 200

      isolatedNodes.forEach((node, idx) => {
        const col = idx % cols
        const row = Math.floor(idx / cols)
        node.position = {
          x: startX + (col * 350),
          y: startY + (row * 400),
        }
      })
    }
  }

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
      <div class="py-2 px-4 flex items-center justify-between bg-surface border-b border-base shrink-0 rounded-t-xl text-base">
        <div class="flex items-center gap-3 text-base">
          <div class="flex bg-zinc-500/10 p-0.5 rounded-lg border border-base items-center">
            <button
              class="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border-none text-base"
              :class="layoutMode === 'elk' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'bg-transparent text-muted hover:text-base'"
              @click="layoutMode = 'elk'"
            >
              ELK
            </button>
            <button
              class="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border-none text-base"
              :class="layoutMode === 'hierarchical' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'bg-transparent text-muted hover:text-base'"
              @click="layoutMode = 'hierarchical'"
            >
              Dagre (Tree)
            </button>
            <button
              class="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border-none text-base"
              :class="layoutMode === 'compact' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'bg-transparent text-muted hover:text-base'"
              @click="layoutMode = 'compact'"
            >
              Dagre (Grid)
            </button>
          </div>

          <div v-if="loading" class="animate-pulse text-[10px] text-primary font-bold uppercase tracking-tight ml-4">
            Refining...
          </div>
        </div>

        <div class="flex items-center gap-2 text-base">
          <button
            class="px-4 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border border-base bg-zinc-500/10 text-muted hover:bg-zinc-500/20 hover:text-base flex items-center gap-1.5 shadow-sm"
            @click="copyMermaid"
          >
            <div class="i-carbon-copy w-3 h-3" />
            Mermaid
          </button>
        </div>
      </div>

      <!-- Graph Area -->
      <div
        ref="containerRef"
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

                              <div class="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
                                <div class="flex flex-col bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg shadow-xl">
                                  <button
                                    class="w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 z-10 rounded-t-lg"
                                    title="Zoom In (+)"
                                    @click="zoomIn"
                                  >
                                    <div class="i-carbon-add w-4 h-4" />
                                  </button>
                                  <div class="h-px bg-zinc-800 mx-2" />
                                  <button
                                    class="w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 z-10 rounded-b-lg"
                                    title="Zoom Out (-)"
                                    @click="zoomOut"
                                  >
                                    <div class="i-carbon-subtract w-4 h-4" />
                                  </button>
                                </div>
                                          <div class="flex flex-col bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg shadow-xl">
                        <button
                          class="w-10 h-10 text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 z-10 rounded-t-lg"
                          title="Recalculate Layout"
                          @click="fetchSchema(true)"
                        >
                          <div class="i-carbon-renew w-5 h-5" />
                        </button>
                        <div class="h-px bg-zinc-800 mx-2" />
                        <button
                          class="w-10 h-10 text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 z-10"
                          title="Fit to Screen (R)"
                          @click="fitToScreen"
                        >
                          <div class="i-carbon-center-to-fit w-5 h-5" />
                        </button>
                        <div class="h-px bg-zinc-800 mx-2" />
                        <button
                          class="w-10 h-10 text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 z-10 rounded-b-lg"
                          :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
                          @click="toggleFullscreen"
                        >
                          <div 
                            class="w-5 h-5" 
                            :class="isFullscreen ? 'i-carbon-minimize' : 'i-carbon-maximize'" 
                          />
                        </button>
                      </div>
                    </div>
          
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
