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

const { fitView, onViewportChange, setViewport, onPaneReady, zoomIn, zoomOut, getViewport, setCenter, onConnect, onEdgesChange, onEdgeClick } = useVueFlow()
const toast = useToast()

const containerRef = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(containerRef)

const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const schemaData = ref<any>(null)
const layoutMode = ref<'hierarchical' | 'compact' | 'elk'>('elk')

const editingEdgeId = ref<string | null>(null)
const editingLabelValue = ref('')
const editingLabelPos = ref({ x: 0, y: 0 })

const elk = new ELK()

let preTransitionState: { x: number, y: number, zoom: number } | null = null

/**
 * Toggles the fullscreen mode for the graph container.
 */
async function toggleFullscreen() {
  if (!containerRef.value) {
    return
  }

  const view = getViewport()
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight

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

/**
 * Fits the graph view to the available container size.
 */
function fitToScreen() {
  fitView({ padding: 0.2, duration: 400 })
}

useEventListener('keydown', (e) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
  if (isInput) {
    return
  }

  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen()
  }
  if (e.key === 'r' || e.key === 'R') {
    fitToScreen()
  }
  if (e.key === '+' || e.key === '=') {
    zoomIn()
  }
  if (e.key === '-') {
    zoomOut()
  }
})

watch([width, height], () => {
  if (preTransitionState) {
    requestAnimationFrame(() => {
      if (!preTransitionState) {
        return
      }
      setCenter(preTransitionState.x, preTransitionState.y, { zoom: preTransitionState.zoom })
      preTransitionState = null
    })
  }
})

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

const nodeTypes: NodeTypesObject = {
  schema: markRaw(SchemaNode),
}

watch(layoutMode, () => {
  generateGraph(true)
})

onConnect((params) => {
  const edgeId = `manual-${params.source}-${params.target}`
  if (globalEdges.value.find(e => e.id === edgeId)) {
    return
  }

  const newEdge = {
    ...params,
    id: edgeId,
    label: '',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' },
    labelStyle: { fill: '#10b981', fontWeight: 700, fontSize: '10px' },
    data: { isManual: true },
  }
  globalEdges.value = [...globalEdges.value, newEdge]
})

onEdgeClick(({ event, edge }) => {
  if (edge.data?.isManual) {
    editingEdgeId.value = edge.id
    editingLabelValue.value = (edge.label as string) || ''
    editingLabelPos.value = {
      x: event.clientX,
      y: event.clientY,
    }

    nextTick(() => {
      const el = document.getElementById('edge-label-input')
      el?.focus()
    })
  }
})

/**
 * Saves the current label for the editing edge.
 */
function saveEdgeLabel() {
  if (editingEdgeId.value) {
    globalEdges.value = globalEdges.value.map(e =>
      e.id === editingEdgeId.value ? { ...e, label: editingLabelValue.value } : e,
    )
    cancelEdgeEdit()
  }
}

/**
 * Cancels the edge label editing process.
 */
function cancelEdgeEdit() {
  editingEdgeId.value = null
  editingLabelValue.value = ''
}

/**
 * Deletes the currently selected edge.
 */
function deleteEdge() {
  if (editingEdgeId.value) {
    globalEdges.value = globalEdges.value.filter(e => e.id !== editingEdgeId.value)
    cancelEdgeEdit()
  }
}

onEdgesChange((changes) => {
  changes.forEach((change) => {
    if (change.type === 'remove') {
      globalEdges.value = globalEdges.value.filter(e => e.id !== change.id)
    }
  })
})

onViewportChange((viewport) => {
  if (isReady.value) {
    globalViewport.value = { ...viewport }
  }
})

onPaneReady(() => {
  console.log('[SchemaExplorer] Pane ready')
  const serviceName = selectedService.value?.name || ''
  if (!initializedServices.value.has(serviceName)) {
    fitView({ padding: 0.2 })
    initializedServices.value.add(serviceName)
    setTimeout(() => isReady.value = true, 100)
  }
  else {
    setViewport(globalViewport.value)
    setTimeout(() => isReady.value = true, 100)
  }
})

/**
 * Fetches the schema and updates the graph visualization.
 * @param forceAutoFit Whether to force a re-layout and re-fit.
 */
async function fetchSchema(forceAutoFit = false) {
  if (!selectedService.value) {
    return
  }

  console.log('[SchemaExplorer] Fetching schema for', selectedService.value.name)
  const isNewService = !initializedServices.value.has(selectedService.value.name)

  if (isNewService) {
    loading.value = true
    isReady.value = false
  }
  else if (forceAutoFit) {
    loading.value = true
  }

  try {
    const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
    schemaData.value = await res.json()
    console.log('[SchemaExplorer] Schema data received:', schemaData.value)

    if (isNewService || forceAutoFit) {
      await generateGraph(forceAutoFit)
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
    console.error('[SchemaExplorer] Failed to fetch schema', e)
    loading.value = false
  }
}

/**
 * Generates the nodes and edges for the graph based on the current schema data.
 * @param autoFit Whether to automatically fit the view after generation.
 */
async function generateGraph(autoFit = false) {
  if (!schemaData.value) {
    console.warn('[SchemaExplorer] No schema data to generate graph')
    return
  }

  console.log('[SchemaExplorer] Generating graph, mode:', layoutMode.value)
  const newNodes: any[] = []
  const newEdges: any[] = []
  const manualEdges = globalEdges.value.filter(e => e.data?.isManual)

  if (!schemaData.value.entities) {
    console.error('[SchemaExplorer] No entities in schema data')
    return
  }

  schemaData.value.entities.forEach((entity: any) => {
    newNodes.push({
      id: entity.name,
      type: 'schema',
      data: { entity },
      position: { x: 0, y: 0 },
    })

    entity.navigationProperties?.forEach((nav: any) => {
      const assoc = schemaData.value.associations?.find((a: any) =>
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

  manualEdges.forEach((me) => {
    if (!newEdges.find(e => e.id === me.id)) {
      newEdges.push(me)
    }
  })

  if (layoutMode.value === 'elk') {
    try {
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
    catch (e) {
      console.error('[SchemaExplorer] ELK layout failed', e)
    }
  }
  else {
    const connectedNodeIds = new Set<string>()
    newEdges.forEach((e) => {
      connectedNodeIds.add(e.source)
      connectedNodeIds.add(e.target)
    })

    const connectedNodes = newNodes.filter(n => connectedNodeIds.has(n.id))
    const isolatedNodes = newNodes.filter(n => !connectedNodeIds.has(n.id))

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
  console.log('[SchemaExplorer] Graph generated with', globalNodes.value.length, 'nodes and', globalEdges.value.length, 'edges')

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
    // If not auto-fitting, we still want to show the graph if we have nodes
    if (globalNodes.value.length > 0) {
      isReady.value = true
    }
    loading.value = false
  }
}

/**
 * Resets the graph visualization to its default state.
 */
function resetGraph() {
  /* eslint-disable no-alert */
  if (confirm('Reset graph? This will remove all manual connections and restore default layout.')) {
    globalEdges.value = globalEdges.value.filter(e => !e.data?.isManual)
    fetchSchema(true)
  }
}

/**
 * Copies the ER diagram code in Mermaid format to the clipboard.
 */
function copyMermaid() {
  if (!schemaData.value) {
    return
  }
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
        const m2 = end1.multiplicity === '*' ? 'o{' : '||'
        code += `  ${type1} ${m1}--${m2} ${type2} : "${assoc.name}"\n`
        addedAssocs.add(assoc.name)
      }
    })
  })
  navigator.clipboard.writeText(code)
  toast.add({
    title: 'Mermaid diagram code copied to clipboard!',
    icon: 'i-heroicons-clipboard-document-check',
    color: 'success',
  })
}

onMounted(() => {
  if (selectedService.value) {
    fetchSchema()
  }
})

watch(selectedService, (newSvc) => {
  if (newSvc) {
    fetchSchema()
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden px-6 relative h-full">
    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 rounded-t-xl overflow-hidden border-t border-x border-gray-200 dark:border-zinc-800 shadow-sm">
      <!-- Toolbar -->
      <div class="py-2 px-4 flex items-center justify-between bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0 rounded-t-xl">
        <div class="flex items-center gap-3">
          <div class="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700 items-center">
            <UButton
              label="ELK"
              :variant="layoutMode === 'elk' ? 'solid' : 'ghost'"
              :color="layoutMode === 'elk' ? 'primary' : 'neutral'"
              size="xs"
              class="text-[9px] uppercase font-black tracking-widest px-3"
              @click="layoutMode = 'elk'"
            />
            <UButton
              label="Dagre (Tree)"
              :variant="layoutMode === 'hierarchical' ? 'solid' : 'ghost'"
              :color="layoutMode === 'hierarchical' ? 'primary' : 'neutral'"
              size="xs"
              class="text-[9px] uppercase font-black tracking-widest px-3"
              @click="layoutMode = 'hierarchical'"
            />
            <UButton
              label="Dagre (Grid)"
              :variant="layoutMode === 'compact' ? 'solid' : 'ghost'"
              :color="layoutMode === 'compact' ? 'primary' : 'neutral'"
              size="xs"
              class="text-[9px] uppercase font-black tracking-widest px-3"
              @click="layoutMode = 'compact'"
            />
          </div>

          <div v-if="loading" class="animate-pulse text-[10px] text-primary font-bold uppercase tracking-tight ml-4">
            Refining...
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            label="Auto Layout"
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="ghost"
            size="xs"
            class="text-[10px] uppercase font-bold"
            title="Recalculate positions"
            @click="fetchSchema(true)"
          />
          <UButton
            label="Reset"
            icon="i-heroicons-arrow-path-rounded-square"
            color="error"
            variant="ghost"
            size="xs"
            class="text-[10px] uppercase font-bold"
            title="Clear manual work"
            @click="resetGraph"
          />
          <div class="w-px h-4 bg-gray-200 dark:bg-zinc-800 mx-1 opacity-50" />
          <UButton
            label="Mermaid"
            icon="i-heroicons-clipboard-document"
            color="neutral"
            variant="subtle"
            size="xs"
            class="text-[9px] uppercase font-black tracking-widest"
            @click="copyMermaid"
          />
        </div>
      </div>

      <!-- Graph Container -->
      <div
        ref="containerRef"
        class="flex-1 relative overflow-hidden bg-white dark:bg-zinc-950 transition-opacity duration-500"
        :class="{ 'opacity-0': !isReady, 'opacity-100': isReady }"
      >
        <VueFlow
          v-model:nodes="globalNodes"
          v-model:edges="globalEdges"
          :node-types="nodeTypes"
          :min-zoom="0.05"
          :max-zoom="4"
          class="h-full w-full"
        >
          <Background pattern-color="#333" :gap="20" />

          <!-- Custom Controls -->
          <div class="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
            <div class="flex flex-col bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden">
              <UButton
                icon="i-heroicons-plus"
                color="neutral"
                variant="ghost"
                class="w-10 h-10 flex items-center justify-center rounded-none"
                title="Zoom In (+)"
                @click="zoomIn"
              />
              <div class="h-px bg-gray-200 dark:bg-zinc-800 mx-2" />
              <UButton
                icon="i-heroicons-minus"
                color="neutral"
                variant="ghost"
                class="w-10 h-10 flex items-center justify-center rounded-none"
                title="Zoom Out (-)"
                @click="zoomOut"
              />
            </div>
            <div class="flex flex-col bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden">
              <UButton
                icon="i-heroicons-arrows-pointing-in"
                color="neutral"
                variant="ghost"
                class="w-10 h-10 flex items-center justify-center rounded-none"
                title="Fit to Screen (R)"
                @click="fitToScreen"
              />
              <div class="h-px bg-gray-200 dark:bg-zinc-800 mx-2" />
              <UButton
                :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
                color="neutral"
                variant="ghost"
                class="w-10 h-10 flex items-center justify-center rounded-none"
                :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
                @click="toggleFullscreen"
              />
            </div>
          </div>
        </VueFlow>

        <!-- Edge Editing Popup -->
        <template v-if="editingEdgeId">
          <div class="fixed inset-0 z-[90]" @click="cancelEdgeEdit" />

          <div
            class="fixed z-[100] flex flex-col gap-3 p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl"
            :style="{
              left: `${editingLabelPos.x}px`,
              top: `${editingLabelPos.y}px`,
              transform: 'translate(-50%, -120%)',
            }"
          >
            <div class="flex items-center gap-2">
              <UInput
                id="edge-label-input"
                v-model="editingLabelValue"
                placeholder="Label... (Enter to save)"
                size="sm"
                color="neutral"
                variant="outline"
                class="w-48 font-bold"
                @keyup.enter="saveEdgeLabel"
                @keyup.esc="cancelEdgeEdit"
                @keydown.ctrl.delete="deleteEdge"
              />

              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="subtle"
                size="sm"
                class="shrink-0"
                title="Delete connection (Ctrl + Del)"
                @click="deleteEdge"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
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

.dark .vue-flow__edge-textbg { fill: #09090b; }
.vue-flow__controls { display: none; }

/* Ensure VueFlow takes full height */
.vue-flow {
  background-color: transparent !important;
}
</style>
