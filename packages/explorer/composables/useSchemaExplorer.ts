import type { NodeTypesObject } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import ELK from 'elkjs/lib/elk.bundled.js'
import { markRaw, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import SchemaNode from '../components/SchemaNode.vue'
import { useSharedODataState } from './useODataState'

interface Viewport {
  x: number
  y: number
  zoom: number
}

interface GraphState {
  nodes: any[]
  edges: any[]
  viewport?: Viewport
}

// Per-service cache for graph data and viewport
const serviceGraphCache = ref<Record<string, GraphState>>({})

const containerRef = ref<HTMLElement | null>(null)

export function useSchemaExplorer(): {
  selectedService: any
  containerRef: typeof containerRef
  loading: globalThis.Ref<boolean>
  isReady: globalThis.Ref<boolean>
  isFullscreen: globalThis.Ref<boolean>
  nodeTypes: NodeTypesObject
  fetchSchema: (forceAutoFit?: boolean) => Promise<void>
  generateGraph: (autoFit?: boolean) => Promise<void>
  resetGraph: () => void
  copyMermaid: () => void
  toggleFullscreen: () => Promise<void>
  fitToScreen: () => void
} {
  const {
    selectedService,
    globalViewMode,
    schemaFocusedServices,
    lastSelectedServiceForGraph,
  } = useSharedODataState()

  const {
    fitView,
    onViewportChange,
    setViewport,
    onPaneReady,
    getViewport,
    setCenter,
    onEdgesChange,
    nodes,
    edges,
    setNodes,
    setEdges,
  } = useVueFlow()

  const toast = useToast()
  const elk = new ELK()

  const loading = ref(false)
  const isReady = ref(false)
  const isFullscreen = ref(false)
  const schemaData = ref<any>(null)

  const nodeTypes: NodeTypesObject = {
    schema: markRaw(SchemaNode),
  }

  function onFullscreenChange(): void {
    isFullscreen.value = !!document.fullscreenElement
  }

  function performInitialFocus(): void {
    const serviceName = selectedService.value?.name
    // Only focus if in schema mode and not yet focused for THIS service
    if (serviceName && !schemaFocusedServices.value.has(serviceName) && globalViewMode.value === 'schema') {
      // Mark as focused immediately to prevent double calls
      schemaFocusedServices.value.add(serviceName)

      // Wait for layout stability
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            fitView({ padding: 0.2, duration: 0 })
          }
          catch (e) {
            console.warn('[SchemaExplorer] fitView failed: ', e)
            schemaFocusedServices.value.delete(serviceName) // Allow retry
          }
        })
      })
    }
  }

  async function restoreServiceState(serviceName: string): Promise<boolean> {
    const cache = serviceGraphCache.value[serviceName]
    if (cache) {
      isReady.value = false
      // Atomic update: nodes then edges to prevent "source undefined" errors
      setNodes([...cache.nodes])
      await nextTick()
      setEdges([...cache.edges])

      if (cache.viewport) {
        await nextTick()
        setViewport(cache.viewport)
      }

      setTimeout(() => {
        isReady.value = true
        loading.value = false
        performInitialFocus() // Just in case it wasn't focused before
      }, 50)
      return true
    }
    return false
  }

  // Lifecycle & Watchers
  onMounted(() => {
    window.addEventListener('fullscreenchange', onFullscreenChange)

    if (selectedService.value) {
      restoreServiceState(selectedService.value.name).then((restored) => {
        if (!restored) {
          fetchSchema()
        }
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('fullscreenchange', onFullscreenChange)
  })

  onPaneReady(() => {
    const serviceName = selectedService.value?.name || ''
    const cache = serviceGraphCache.value[serviceName]

    if (cache?.viewport) {
      setViewport(cache.viewport)
      setTimeout(() => isReady.value = true, 50)
    }
    else {
      // First time: Wait for layout, fit instantly, then show
      setTimeout(() => {
        performInitialFocus()
        setTimeout(() => {
          isReady.value = true
        }, 100)
      }, 100)
    }
  })

  // Watch for service changes
  watch(selectedService, async (newSvc) => {
    if (newSvc && newSvc.name !== lastSelectedServiceForGraph.value) {
      const restored = await restoreServiceState(newSvc.name)
      if (!restored) {
        isReady.value = false
        schemaData.value = null
        setNodes([])
        setEdges([])
        await fetchSchema()
      }
      lastSelectedServiceForGraph.value = newSvc.name
    }
  })

  watch(globalViewMode, (newMode) => {
    if (newMode === 'schema') {
      nextTick(() => {
        performInitialFocus()
        // If we just switched and have nodes but not ready, show it
        if (nodes.value.length > 0 && !isReady.value) {
          isReady.value = true
        }
      })
    }
  })

  onEdgesChange((changes: any[]) => {
    const serviceName = selectedService.value?.name
    if (serviceName && serviceGraphCache.value[serviceName]) {
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          const cache = serviceGraphCache.value[serviceName]
          if (cache) {
            cache.edges = cache.edges.filter((e: any) => e.id !== change.id)
          }
        }
      })
    }
  })

  onViewportChange((viewport) => {
    if (isReady.value && selectedService.value) {
      const serviceName = selectedService.value.name
      if (!serviceGraphCache.value[serviceName]) {
        serviceGraphCache.value[serviceName] = { nodes: [...nodes.value], edges: [...edges.value] }
      }
      const cache = serviceGraphCache.value[serviceName]
      if (cache) {
        cache.viewport = { ...viewport }
      }
    }
  })

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

    const serviceName = selectedService.value.name
    loading.value = true

    try {
      const res = await fetch(`/__sap_odata__/schema?service=${serviceName}`)
      schemaData.value = (await res.json())
      // If we are fetching, autoFit if not in cache or forced
      const shouldAutoFit = forceAutoFit || !serviceGraphCache.value[serviceName]
      await generateGraph(shouldAutoFit)
    }
    catch (e) {
      console.error('[SchemaExplorer] Failed to fetch schema', e)
      loading.value = false
    }
  }

  async function generateGraph(autoFit = false): Promise<void> {
    if (!schemaData.value || !selectedService.value) {
      return
    }

    const newNodes: any[] = []
    const newEdges: any[] = []

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
              // Determine overall association multiplicity
              const isMany1 = (assoc.ends[0]?.multiplicity || '').toLowerCase().includes('*')
              const isMany2 = (assoc.ends[1]?.multiplicity || '').toLowerCase().includes('*')

              let label = '1:1'
              if (isMany1 && isMany2) {
                label = 'N:M'
              }
              else if (isMany1 || isMany2) {
                label = '1:N'
              }

              newEdges.push({
                id: edgeId,
                source: entity.name,
                target: targetEntityName,
                label,
                animated: true,
                labelStyle: { fontWeight: 500, fontSize: '11px' },
                style: { stroke: '#10b981', strokeWidth: 1.5, opacity: 0.8 },
              })
            }
          }
        }
      })
    })

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

    // Atomic update: nodes then edges
    setNodes([...newNodes])
    await nextTick()
    setEdges([...newEdges])

    // Update cache
    serviceGraphCache.value[selectedService.value.name] = {
      nodes: [...newNodes],
      edges: [...newEdges],
    }

    if (autoFit) {
      // Wait for layout stability, then fit and show
      setTimeout(() => {
        performInitialFocus()
        setTimeout(() => {
          isReady.value = true
          loading.value = false
        }, 100)
      }, 50)
    }
    else {
      if (nodes.value.length > 0) {
        isReady.value = true
      }
      loading.value = false
    }
  }

  function resetGraph(): void {
    const serviceName = selectedService.value?.name
    if (serviceName) {
      schemaFocusedServices.value.delete(serviceName)
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
          const m1 = (end1.multiplicity || '').includes('*') ? '}o' : '||'
          const m2 = (end2.multiplicity || '').includes('*') ? 'o{' : '||'
          code += `  ${type1} ${m1}--${m2} ${type2} : "${assoc.name}"\\n`
          addedAssocs.add(assoc.name)
        }
      })
    })
    navigator.clipboard.writeText(code)
    toast.add({
      id: 'copy-mermaid-success',
      title: 'Mermaid diagram code copied to clipboard!',
      icon: 'i-lucide-clipboard-check',
      color: 'success',
    })
  }

  return {
    selectedService,
    containerRef,
    loading,
    isReady,
    isFullscreen,
    nodeTypes,
    fetchSchema,
    generateGraph,
    resetGraph,
    copyMermaid,
    toggleFullscreen,
    fitToScreen,
  }
}
