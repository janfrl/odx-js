import type { NodeTypesObject } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import ELK from 'elkjs/lib/elk.bundled.js'
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import SchemaNode from '../components/SchemaNode.vue'
import { useSharedODataState } from './useODataState'

const elk = new ELK()

// Shared State (Singleton)
const schemaData = ref<any>(null)
const loading = ref(false)
const isReady = ref(false)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const needsInitialFit = ref(false)

export function useSchemaExplorer(): any {
  const { selectedService } = useSharedODataState()
  const { setNodes, setEdges, fitView, onPaneReady, viewport, setViewport } = useVueFlow()

  const nodeTypes: NodeTypesObject = {
    schema: markRaw(SchemaNode),
  }

  // Watch for service changes
  watch(selectedService, (newSvc) => {
    if (newSvc) {
      fetchSchema(newSvc.name)
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
    loading.value = true
    isReady.value = false
    try {
      const res = await fetch(`/__odx__/schema?service=${serviceName}`)
      if (res.ok) {
        schemaData.value = await res.json()
        await generateGraph(true)
      }
    }
    catch (e) {
      console.error('[SchemaExplorer] Failed to fetch schema', e)
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
    schemaData.value.entities.forEach((entity: any) => {
      newNodes.push({
        id: entity.name,
        type: 'schema',
        data: { entity },
        position: { x: 0, y: 0 },
      })
    })

    // 2. Create edges by resolving relationships
    schemaData.value.entities.forEach((entity: any) => {
      entity.navigationProperties?.forEach((nav: any) => {
        const assoc = schemaData.value.associations?.find((a: any) =>
          a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship,
        )

        if (assoc) {
          const targetEnd = assoc.ends.find((e: any) => e.role === nav.toRole)
          const targetTypeName = targetEnd?.type.split('.').pop()

          if (targetTypeName) {
            const targetEntitySet = schemaData.value.entities.find((e: any) => e.type === targetTypeName)

            if (targetEntitySet && targetEntitySet.name !== entity.name) {
              const edgeId = [entity.name, targetEntitySet.name, assoc.name].sort().join('-')
              if (!newEdges.find((e: any) => e.id === edgeId)) {
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
        // Try to fit immediately if visible, otherwise defer to onPaneReady
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
      element.requestFullscreen().then(() => {
        isFullscreen.value = true
        setTimeout(() => {
          const newWidth = element.offsetWidth
          const newHeight = element.offsetHeight
          const dx = (newWidth - oldWidth) / 2
          const dy = (newHeight - oldHeight) / 2
          setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 0 })
        }, 100)
      }).catch((err) => {
        console.error(`Fullscreen failed: ${err.message}`)
      })
    }
    else {
      document.exitFullscreen()
      isFullscreen.value = false
      setTimeout(() => {
        const newWidth = element.offsetWidth
        const newHeight = element.offsetHeight
        const dx = (newWidth - oldWidth) / 2
        const dy = (newHeight - oldHeight) / 2
        setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 0 })
      }, 100)
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
    schemaData.value.entities.forEach((entity: any) => {
      mermaid += `  ${entity.name} {\n`
      entity.properties?.forEach((prop: any) => {
        mermaid += `    ${prop.type} ${prop.name} ${prop.isKey ? 'PK' : ''}\n`
      })
      mermaid += '  }\n'
    })

    navigator.clipboard.writeText(mermaid)
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
