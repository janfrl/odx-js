import type { NodeTypesObject } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import ELK from 'elkjs/lib/elk.bundled.js'
import { markRaw, nextTick, onMounted, ref, watch } from 'vue'
import SchemaNode from '../components/SchemaNode.vue'
import { useSharedODataState } from './useODataState'

const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const schemaData = ref<any>(null)

const containerRef = ref<HTMLElement | null>(null)

export function useSchemaExplorer(): any {
  const {
    selectedService,
    globalNodes,
    globalEdges,
    globalViewport,
    globalViewMode,
    initializedServices,
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
  } = useVueFlow()

  const toast = useToast()

  const elk = new ELK()

  const nodeTypes: NodeTypesObject = {
    schema: markRaw(SchemaNode),
  }

  function performInitialFocus() {
    const serviceName = selectedService.value?.name
    if (serviceName && !schemaFocusedServices.value.has(serviceName) && globalViewMode.value === 'schema' && isReady.value) {
      fitView({ padding: 0.2 })
      schemaFocusedServices.value.add(serviceName)
    }
  }

  // Lifecycle & Watchers
  onMounted(() => {
    if (selectedService.value) {
      fetchSchema()
    }
  })

  onPaneReady(() => {
    const serviceName = selectedService.value?.name || ''
    if (!initializedServices.value.has(serviceName)) {
      initializedServices.value.add(serviceName)
      // Wait for nodes to be present before focusing
      setTimeout(() => {
        isReady.value = true
        if (globalNodes.value.length > 0) {
          performInitialFocus()
        }
      }, 150)
    }
    else {
      setViewport(globalViewport.value)
      setTimeout(() => isReady.value = true, 100)
    }
  })

  // Per-instance watchers
  watch(selectedService, async (newSvc) => {
    if (newSvc) {
      isReady.value = false
      schemaData.value = null
      globalNodes.value = []
      globalEdges.value = []
      await fetchSchema()
    }
  })

  watch(globalViewMode, (newMode) => {
    if (newMode === 'schema') {
      nextTick(() => {
        setTimeout(() => {
          performInitialFocus()
        }, 100)
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
      globalNodes.value = []
      globalEdges.value = []
    }
    else if (forceAutoFit) {
      loading.value = true
    }

    try {
      const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
      schemaData.value = await res.json()

      if (isNewService || forceAutoFit) {
        await generateGraph(forceAutoFit || isNewService)
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
    fetchSchema(true)
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
    globalNodes,
    globalEdges,
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
