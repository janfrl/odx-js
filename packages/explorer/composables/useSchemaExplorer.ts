import type { NodeTypesObject } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import { useEventListener } from '@vueuse/core'
import * as dagre from 'dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
import { markRaw, nextTick, onMounted, ref, watch } from 'vue'
import SchemaNode from '../components/SchemaNode.vue'
import { useSharedODataState } from './useODataState'

const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const schemaData = ref<any>(null)
const layoutMode = ref<'hierarchical' | 'compact' | 'elk'>('elk')

const editingEdgeId = ref<string | null>(null)
const editingLabelValue = ref('')
const editingLabelPos = ref({ x: 0, y: 0 })

let initialized = false

export function useSchemaExplorer(): any {
  const {
    selectedService,
    globalNodes,
    globalEdges,
    globalViewport,
    initializedServices,
    lastSelectedServiceForGraph,
  } = useSharedODataState()

  const {
    fitView,
    onViewportChange,
    setViewport,
    onPaneReady,
    zoomIn,
    zoomOut,
    getViewport,
    setCenter,
    onConnect,
    onEdgesChange,
    onEdgeClick,
  } = useVueFlow()

  const toast = useToast()
  const containerRef = ref<HTMLElement | null>(null)

  const elk = new ELK()

  const nodeTypes: NodeTypesObject = {
    schema: markRaw(SchemaNode),
  }

  // Lifecycle & Watchers that need to run per-instance
  onMounted(() => {
    if (selectedService.value) {
      fetchSchema()
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

  if (!initialized) {
    initialized = true

    // Global Listeners & Watchers (Singleton side-effects)
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

    window.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })

    watch(selectedService, (newSvc) => {
      if (newSvc) {
        fetchSchema()
      }
    })

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
        style: { stroke: '#737373', strokeWidth: 1.5, strokeDasharray: '5,5' },
        labelStyle: { fontWeight: 500, fontSize: '11px' },
        data: { isManual: true },
      }
      globalEdges.value = [...globalEdges.value, newEdge]
    })

    onEdgeClick(({ event, edge }: any) => {
      if (edge.data?.isManual) {
        editingEdgeId.value = edge.id
        editingLabelValue.value = (edge.label as string) || ''

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
  }

  async function toggleFullscreen(): Promise<void> {
    if (!containerRef.value) {
      return
    }

    const view = getViewport()
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight

    const transitionState = {
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

    requestAnimationFrame(() => {
      setCenter(transitionState.x, transitionState.y, { zoom: transitionState.zoom })
    })
  }

  function fitToScreen(): void {
    fitView({ padding: 0.2, duration: 400 })
  }

  async function fetchSchema(forceAutoFit = false): Promise<void> {
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

  async function generateGraph(autoFit = false): Promise<void> {
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
                                                                        labelStyle: { fontWeight: 500, fontSize: '11px' },
                                                                        style: { stroke: '#a3a3a3', strokeWidth: 1.5 },
                                                                      })            }
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

  function resetGraph(): void {
    /* eslint-disable-next-line no-alert */
    if (confirm('Reset graph? This will remove all manual connections and restore default layout.')) {
      globalEdges.value = globalEdges.value.filter((e: any) => !e.data?.isManual)
      fetchSchema(true)
    }
  }

  function copyMermaid(): void {
    if (!schemaData.value) {
      return
    }
    let code = 'erDiagram\\n'
    schemaData.value.entities.forEach((entity: any) => {
      const props = entity.properties.map((p: any) => `    ${p.type.split('.').pop()} ${p.name} ${p.isKey ? 'PK' : ''}`).join('\\n')
      code += `  ${entity.name} {\\n${props}\\n  }\\n`
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
          code += `  ${type1} ${m1}--${m2} ${type2} : "${assoc.name}"\\n`
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

  function saveEdgeLabel(): void {
    if (editingEdgeId.value) {
      globalEdges.value = globalEdges.value.map((e: any) =>
        e.id === editingEdgeId.value ? { ...e, label: editingLabelValue.value } : e,
      )
      cancelEdgeEdit()
    }
  }

  function cancelEdgeEdit(): void {
    editingEdgeId.value = null
    editingLabelValue.value = ''
  }

  function deleteEdge(): void {
    if (editingEdgeId.value) {
      globalEdges.value = globalEdges.value.filter((e: any) => e.id !== editingEdgeId.value)
      cancelEdgeEdit()
    }
  }

  return {
    selectedService,
    globalNodes,
    globalEdges,
    containerRef,
    loading,
    isReady,
    isFullscreen,
    layoutMode,
    editingEdgeId,
    editingLabelValue,
    editingLabelPos,
    nodeTypes,
    fetchSchema,
    generateGraph,
    resetGraph,
    copyMermaid,
    toggleFullscreen,
    fitToScreen,
    saveEdgeLabel,
    cancelEdgeEdit,
    deleteEdge,
  }
}
