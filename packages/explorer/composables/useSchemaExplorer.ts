import type { Association, AssociationEnd, EntityMapping, NavigationProperty } from '@bc8-odx/core'
import type { NodeTypesObject } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import ELK from 'elkjs/lib/elk.bundled.js'
import SchemaNode from '../components/SchemaNode.vue'
import { buildSchemaEndpointUrl } from './useODataState'

const elk = new ELK()

// Shared State (Singleton)
const schemaData = ref<any>(null)
const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const needsInitialFit = ref(false)

if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
}

export interface SchemaExplorer {
  selectedService: Ref<any>
  containerRef: Ref<HTMLElement | null>
  loading: Ref<boolean>
  isReady: Ref<boolean>
  isFullscreen: Ref<boolean>
  nodeTypes: NodeTypesObject
  fetchSchema: (serviceName: string) => Promise<void>
  generateGraph: (autoFit?: boolean) => Promise<void>
  resetGraph: () => void
  copyMermaid: () => void
  toggleFullscreen: () => void
  fitToScreen: () => void
}

export function useSchemaExplorer(): SchemaExplorer {
  const { selectedService } = useSharedODataState()
  const { setNodes, setEdges, fitView, onPaneReady, viewport, setViewport, edges } = useVueFlow()
  const toast = useToast()

  const nodeTypes: NodeTypesObject = {
    schema: markRaw(SchemaNode),
  }

  // Watch for service changes
  watch(selectedService, (newSvc, oldSvc) => {
    if (newSvc) {
      // Only fetch if the actual service changed, not just its health status
      if (newSvc.name !== oldSvc?.name) {
        fetchSchema(newSvc.name)
      }
    }
    else {
      schemaData.value = null
      isReady.value = false
      needsInitialFit.value = false
      setNodes([])
      setEdges([])
    }
  }, { immediate: true })

  // Triggered when the Schema tab is opened and Vue Flow is ready
  onPaneReady(() => {
    if (needsInitialFit.value) {
      performInitialFit()
    }
  })

  async function performInitialFit(): Promise<void> {
    // Only perform fit if the container is actually visible (not hidden via v-show/v-if)
    if (!containerRef.value || !containerRef.value.offsetParent) {
      return
    }

    await nextTick()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          fitView({ padding: 0.2, duration: 0 })
          isReady.value = true
          needsInitialFit.value = false
        }
        catch {
          // Viewport still not ready, will be handled by onPaneReady later
        }
      })
    })
  }

  async function fetchSchema(serviceName: string): Promise<void> {
    if (loading.value)
      return

    const { updateServiceHealth } = useSharedODataState()

    loading.value = true
    isReady.value = false
    try {
      const res = await fetch(buildSchemaEndpointUrl(serviceName))
      if (res.ok) {
        schemaData.value = await res.json()
        updateServiceHealth(serviceName, schemaData.value?.metadata?.stale ? 'degraded' : 'online')
        await generateGraph(true)
      }
      else {
        updateServiceHealth(serviceName, 'offline')
      }
    }
    catch (e) {
      console.error('[SchemaExplorer] Failed to fetch schema', e)
      updateServiceHealth(serviceName, 'offline')
    }
    finally {
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

    // 1. Create nodes for each EntitySet
    schemaData.value.entities.forEach((entity: EntityMapping) => {
      newNodes.push({
        id: entity.name,
        type: 'schema',
        data: { entity },
        position: { x: 0, y: 0 },
      })
    })

    // 2. Create edges by resolving relationships
    schemaData.value.entities.forEach((entity: EntityMapping) => {
      entity.navigationProperties?.forEach((nav: NavigationProperty) => {
        const assoc = schemaData.value.associations?.find((a: Association) =>
          a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship,
        )

        if (assoc) {
          const targetEnd = assoc.ends.find((e: AssociationEnd) => e.role === nav.toRole)
          const targetTypeName = targetEnd?.type.split('.').pop()

          if (targetTypeName) {
            const targetEntitySet = schemaData.value.entities.find((e: EntityMapping) => e.type === targetTypeName)

            if (targetEntitySet && targetEntitySet.name !== entity.name) {
              const edgeId = [entity.name, targetEntitySet.name, assoc.name].sort().join('-')
              if (!newEdges.some((e: any) => e.id === edgeId)) {
                const isMany1 = (assoc.ends[0]?.multiplicity || '').includes('*')
                const isMany2 = (assoc.ends[1]?.multiplicity || '').includes('*')

                let label = '1:1'
                if (isMany1 && isMany2)
                  label = 'N:M'
                else if (isMany1 || isMany2)
                  label = '1:N'

                newEdges.push({
                  id: edgeId,
                  source: entity.name,
                  target: targetEntitySet.name,
                  label,
                  data: {
                    assocName: assoc.name,
                    multiplicity: { m1: assoc.ends[0]?.multiplicity, m2: assoc.ends[1]?.multiplicity },
                  },
                  animated: true,
                  labelStyle: { fontWeight: 500, fontSize: '11px' },
                  style: { stroke: '#10b981', strokeWidth: 1.5, opacity: 0.8 },
                })
              }
            }
          }
        }
      })
    })

    // 3. Apply ELK Layout
    try {
      const elkGraph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.spacing.nodeNode': '100',
          'elk.layered.spacing.nodeNodeBetweenLayers': '150',
        },
        children: newNodes.map(n => ({
          id: n.id,
          width: 250,
          height: 60 + ((n.data.entity.properties?.length || 0) * 22),
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

      setNodes(newNodes)
      setEdges(newEdges)

      if (autoFit) {
        needsInitialFit.value = true
        performInitialFit()
      }
      else {
        isReady.value = true
      }
    }
    catch (err) {
      console.error('[SchemaExplorer] ELK layout failed', err)
      setNodes(newNodes)
      setEdges(newEdges)
      isReady.value = true
    }
  }

  function resetGraph(): void {
    generateGraph(true)
  }

  function toggleFullscreen(): void {
    const element = containerRef.value
    if (!element)
      return

    const oldWidth = element.offsetWidth
    const oldHeight = element.offsetHeight
    const { x, y, zoom } = viewport.value

    if (!document.fullscreenElement) {
      const isSchemaVisible = !!element.offsetParent

      if (isSchemaVisible) {
        // Smart schema-only fullscreen with viewport centering
        element.requestFullscreen().then(() => {
          isFullscreen.value = true
          setTimeout(() => {
            const newWidth = element.offsetWidth
            const newHeight = element.offsetHeight
            const dx = (newWidth - oldWidth) / 2
            const dy = (newHeight - oldHeight) / 2
            setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 0 })
          }, 100)
        }).catch((err: any) => {
          console.error(`Fullscreen failed: ${err.message}`)
        })
      }
      else {
        // Global app fallback for other tabs (user liked the global shortcut)
        document.documentElement.requestFullscreen().then(() => {
          isFullscreen.value = true
        }).catch((err: any) => {
          console.error(`Global fullscreen failed: ${err.message}`)
        })
      }
    }
    else {
      // Logic for exiting fullscreen
      const wasSchemaFullscreen = document.fullscreenElement === element
      document.exitFullscreen()
      isFullscreen.value = false

      if (wasSchemaFullscreen) {
        setTimeout(() => {
          const newWidth = element.offsetWidth
          const newHeight = element.offsetHeight
          const dx = (newWidth - oldWidth) / 2
          const dy = (newHeight - oldHeight) / 2
          setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 0 })
        }, 100)
      }
    }
  }

  function fitToScreen(): void {
    try {
      fitView({ padding: 0.2, duration: 600 })
    }
    catch {}
  }

  function copyMermaid(): void {
    if (!schemaData.value)
      return

    let mermaid = 'erDiagram\n'

    const nameMap: Record<string, string> = {}
    schemaData.value.entities.forEach((entity: EntityMapping) => {
      nameMap[entity.name] = entity.type
    })

    // 1. Relationships first (to guide Mermaid layout engine)
    const sortedEdges = edges.value.toSorted((a: any, b: any) => {
      const s1 = nameMap[a.source] || a.source
      const s2 = nameMap[b.source] || b.source
      return s1.localeCompare(s2) || (nameMap[a.target] || a.target).localeCompare(nameMap[b.target] || b.target)
    })

    sortedEdges.forEach((edge: any) => {
      const source = nameMap[edge.source] || edge.source
      const target = nameMap[edge.target] || edge.target

      let rel = '||--||'
      if (edge.label === '1:N') {
        rel = '||--o{'
      }
      else if (edge.label === 'N:M') {
        rel = '}o--o{'
      }

      const label = edge.data?.assocName || edge.id.split('-').pop()
      mermaid += `  ${source} ${rel} ${target} : "${label}"\n`
    })

    // 2. Entities second
    const sortedEntities = schemaData.value.entities.toSorted((a: EntityMapping, b: EntityMapping) => a.type.localeCompare(b.type))

    sortedEntities.forEach((entity: EntityMapping) => {
      mermaid += `  ${entity.type} {\n`
      entity.properties?.forEach((prop: any) => {
        let type = prop.type.split('.').pop() || prop.type
        if (type === 'DateTimeOffset')
          type = 'DateTime'
        mermaid += `    ${type} ${prop.name} ${prop.isKey ? 'PK' : ''}\n`
      })
      mermaid += '  }\n'
    })

    navigator.clipboard.writeText(mermaid)

    toast.add({
      id: 'copy-mermaid-success',
      title: 'Copied to clipboard',
      description: 'The Mermaid diagram is ready to be pasted.',
      icon: 'i-lucide-check-circle',
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
