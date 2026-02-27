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

function fitToScreen() {
  fitView({ padding: 0.2, duration: 400 })
}

useEventListener('keydown', (e: KeyboardEvent) => {
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
  if (globalEdges.value.find((e: any) => e.id === edgeId)) {
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

onEdgeClick(({ event, edge }: any) => {
  if (edge.data?.isManual) {
    editingEdgeId.value = edge.id
    editingLabelValue.value = (edge.label as string) || ''

    // Safely cast to MouseEvent or fallback to 0 if it's a TouchEvent
    const clientX = 'clientX' in event ? (event as MouseEvent).clientX : 0
    const clientY = 'clientY' in event ? (event as MouseEvent).clientY : 0

    editingLabelPos.value = {
      x: clientX,
      y: clientY,
    }

    nextTick(() => {
      const el = document.getElementById('edge-label-input')
      el?.focus()
    })
  }
})

function saveEdgeLabel() {
  if (editingEdgeId.value) {
    globalEdges.value = globalEdges.value.map((e: any) =>
      e.id === editingEdgeId.value ? { ...e, label: editingLabelValue.value } : e,
    )
    cancelEdgeEdit()
  }
}

function cancelEdgeEdit() {
  editingEdgeId.value = null
  editingLabelValue.value = ''
}

function deleteEdge() {
  if (editingEdgeId.value) {
    globalEdges.value = globalEdges.value.filter((e: any) => e.id !== editingEdgeId.value)
    cancelEdgeEdit()
  }
}

onEdgesChange((changes: any[]) => {
  changes.forEach((change: any) => {
    if (change.type === 'remove') {
      globalEdges.value = globalEdges.value.filter((e: any) => e.id !== change.id)
    }
  })
})

onViewportChange((viewport) => {
  if (isReady.value) {
    globalViewport.value = { ...viewport }
  }
})

onPaneReady(() => {
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

async function fetchSchema(forceAutoFit = false) {
  if (!selectedService.value) {
    return
  }

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

async function generateGraph(autoFit = false) {
  if (!schemaData.value) {
    return
  }

  const newNodes: any[] = []
  const newEdges: any[] = []
  const manualEdges = globalEdges.value.filter((e: any) => e.data?.isManual)

  if (!schemaData.value.entities) {
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
          if (!newEdges.find((e: any) => e.id === edgeId)) {
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

  manualEdges.forEach((me: any) => {
    if (!newEdges.find((e: any) => e.id === me.id)) {
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
        const elkNode = layoutedGraph.children?.find((c: any) => c.id === node.id)
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

    const connectedNodes = newNodes.filter((n: any) => connectedNodeIds.has(n.id))
    const isolatedNodes = newNodes.filter((n: any) => !connectedNodeIds.has(n.id))

    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 })
    g.setDefaultEdgeLabel(() => ({}))

    connectedNodes.forEach((node: any) => {
      const propCount = node.data.entity.properties.length
      g.setNode(node.id, { width: 250, height: 60 + (propCount * 22) })
    })

    if (layoutMode.value === 'hierarchical') {
      isolatedNodes.forEach((node: any) => {
        g.setNode(node.id, { width: 250, height: 60 + (node.data.entity.properties.length * 22) })
      })
    }

    newEdges.forEach((edge: any) => g.setEdge(edge.source, edge.target))
    dagre.layout(g)

    let maxX = 0
    let maxY = 0

    newNodes.forEach((node: any) => {
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

      isolatedNodes.forEach((node: any, idx: number) => {
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
    if (globalNodes.value.length > 0) {
      isReady.value = true
    }
    loading.value = false
  }
}

function resetGraph() {
  /* eslint-disable-next-line no-alert */
  if (confirm('Reset graph? This will remove all manual connections and restore default layout.')) {
    globalEdges.value = globalEdges.value.filter((e: any) => !e.data?.isManual)
    fetchSchema(true)
  }
}

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
  <div class="h-full flex flex-col overflow-hidden relative bg-neutral-50 dark:bg-neutral-950 font-sans">
    <div class="pt-4 px-4 pb-0 sm:pt-6 sm:px-6 flex-1 flex flex-col min-h-0">
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 rounded-t-2xl bg-white dark:bg-neutral-900 shadow-sm transition-all">
        <div class="shrink-0 flex flex-col bg-white dark:bg-neutral-900 rounded-t-[inherit] overflow-hidden">
          <div class="py-4 px-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0">
            <div class="flex items-center gap-6">
              <div class="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 items-center">
                <UButton
                  label="ELK"
                  :variant="layoutMode === 'elk' ? 'solid' : 'ghost'"
                  :color="layoutMode === 'elk' ? 'primary' : 'neutral'"
                  size="xs"
                  class="font-semibold px-3"
                  @click="layoutMode = 'elk'"
                />
                <UButton
                  label="Dagre (Tree)"
                  :variant="layoutMode === 'hierarchical' ? 'solid' : 'ghost'"
                  :color="layoutMode === 'hierarchical' ? 'primary' : 'neutral'"
                  size="xs"
                  class="font-semibold px-3"
                  @click="layoutMode = 'hierarchical'"
                />
                <UButton
                  label="Dagre (Grid)"
                  :variant="layoutMode === 'compact' ? 'solid' : 'ghost'"
                  :color="layoutMode === 'compact' ? 'primary' : 'neutral'"
                  size="xs"
                  class="font-semibold px-3"
                  @click="layoutMode = 'compact'"
                />
              </div>

              <div v-if="loading" class="animate-pulse text-xs text-neutral-500 font-semibold uppercase tracking-wider ml-4">
                Refining Schema...
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                label="Auto Layout"
                icon="i-heroicons-arrow-path"
                color="primary"
                variant="soft"
                size="sm"
                class="font-semibold"
                title="Recalculate positions"
                @click="fetchSchema(true)"
              />
              <UButton
                label="Reset"
                icon="i-heroicons-arrow-path-rounded-square"
                color="error"
                variant="ghost"
                size="sm"
                class="font-semibold"
                title="Clear manual work"
                @click="resetGraph"
              />
              <div class="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-2" />
              <UButton
                label="Mermaid"
                icon="i-heroicons-clipboard-document"
                color="neutral"
                variant="ghost"
                size="sm"
                class="font-semibold"
                @click="copyMermaid"
              />
            </div>
          </div>
        </div>

        <div class="flex-1 relative bg-transparent h-full">
          <div
            ref="containerRef"
            class="absolute inset-0 transition-opacity duration-500"
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
              <Background pattern-color="#888" :gap="20" />

              <div class="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
                <div class="flex flex-col bg-white/75 dark:bg-neutral-900/75 backdrop-blur shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 rounded-xl overflow-hidden text-neutral-900 dark:text-white">
                  <UButton
                    icon="i-heroicons-plus"
                    color="neutral"
                    variant="ghost"
                    class="w-10 h-10 flex items-center justify-center rounded-none"
                    title="Zoom In (+)"
                    @click="zoomIn()"
                  />
                  <div class="h-px bg-neutral-200 dark:bg-neutral-800" />
                  <UButton
                    icon="i-heroicons-minus"
                    color="neutral"
                    variant="ghost"
                    class="w-10 h-10 flex items-center justify-center rounded-none"
                    title="Zoom Out (-)"
                    @click="zoomOut()"
                  />
                </div>
                <div class="flex flex-col bg-white/75 dark:bg-neutral-900/75 backdrop-blur shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 rounded-xl overflow-hidden text-neutral-900 dark:text-white">
                  <UButton
                    icon="i-heroicons-arrows-pointing-in"
                    color="neutral"
                    variant="ghost"
                    class="w-10 h-10 flex items-center justify-center rounded-none"
                    title="Fit to Screen (R)"
                    @click="fitToScreen"
                  />
                  <div class="h-px bg-neutral-200 dark:bg-neutral-800" />
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

            <template v-if="editingEdgeId">
              <div class="fixed inset-0 z-90" @click="cancelEdgeEdit" />
              <div
                class="fixed z-100 flex flex-col gap-4 p-3 bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 rounded-xl shadow-xl"
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
                    class="w-48 font-medium"
                    @keyup.enter="saveEdgeLabel"
                    @keyup.esc="cancelEdgeEdit"
                    @keydown.ctrl.delete="deleteEdge"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    color="error"
                    variant="soft"
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
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}

.dark .vue-flow__edge-textbg { fill: #111827; }
.vue-flow__controls { display: none; }

.vue-flow {
  background-color: transparent !important;
}
</style>
