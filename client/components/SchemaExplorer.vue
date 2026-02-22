<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import * as dagre from 'dagre'
import { markRaw, onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'
import SchemaNode from './SchemaNode.vue'

// Styles
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { selectedService } = useSharedODataState()
const { nodes, edges, setNodes, setEdges, fitView, addNodes, onNodeClick } = useVueFlow()

const loading = ref(false)
const schemaData = ref<any>(null)

// Define custom node types
const nodeTypes = {
  schema: markRaw(SchemaNode),
}

async function fetchSchema() {
  if (!selectedService.value) return
  loading.value = true
  try {
    const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
    schemaData.value = await res.json()
    generateGraph()
  } catch (e) {
    console.error('Failed to fetch schema', e)
  } finally {
    loading.value = false
  }
}

function generateGraph() {
  if (!schemaData.value) return

  const newNodes: any[] = []
  const newEdges: any[] = []

  // Create Nodes
  schemaData.value.entities.forEach((entity: any) => {
    newNodes.push({
      id: entity.name,
      type: 'schema',
      data: { entity },
      position: { x: 0, y: 0 }, // Will be set by dagre
    })

    // Create Edges from Navigation Properties
    entity.navigationProperties.forEach((nav: any) => {
      const assoc = schemaData.value.associations.find((a: any) => 
        a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship
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
              style: { stroke: '#10b981', strokeWidth: 2 }
            })
          }
        }
      }
    })
  })

  // Apply Auto Layout with Dagre
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 150 })
  g.setDefaultEdgeLabel(() => ({}))

  // Estimate dimensions for dagre
  newNodes.forEach(node => {
    const propCount = node.data.entity.properties.length
    g.setNode(node.id, { width: 200, height: 40 + (propCount * 22) })
  })
  newEdges.forEach(edge => g.setEdge(edge.source, edge.target))

  dagre.layout(g)

  // Map dagre positions back to VueFlow nodes
  newNodes.forEach(node => {
    const nodeWithPos = g.node(node.id)
    node.position = { x: nodeWithPos.x - 100, y: nodeWithPos.y - 50 }
  })

  setNodes(newNodes)
  setEdges(newEdges)
  
  // Wait for DOM then fit
  setTimeout(() => fitView({ padding: 0.2 }), 100)
}

function generateMermaidCode() {
  if (!schemaData.value) return ''
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
        const end1 = assoc.ends[0]; const end2 = assoc.ends[1]
        const type1 = end1.type.split('.').pop(); const type2 = end2.type.split('.').pop()
        const m1 = end1.multiplicity === '*' ? '}o' : '||'; const m2 = end2.multiplicity === '*' ? 'o{' : '||'
        code += `  ${type1} ${m1}--${m2} ${type2} : "${assoc.name}"\n`
        addedAssocs.add(assoc.name)
      }
    })
  })
  return code
}

function copyMermaid() {
  const code = generateMermaidCode()
  if (!code) return
  navigator.clipboard.writeText(code)
  alert('Mermaid diagram code copied to clipboard!')
}

onMounted(() => {
  if (selectedService.value) fetchSchema()
})

watch(selectedService, () => {
  if (selectedService.value) fetchSchema()
})
</script>

<template>
  <div class="h-full flex flex-col bg-base overflow-hidden relative">
    <div class="p-4 border-b border-base bg-surface flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
          <div class="i-carbon-flow-connection" />
          Entity Relationship Explorer
        </h2>
        <div v-if="loading" class="animate-pulse text-xs text-primary font-bold">Refining Schema...</div>
      </div>
      <div class="flex items-center gap-2">
        <button 
          class="px-3 py-1.5 text-[10px] font-bold uppercase bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-all border-none cursor-pointer flex items-center gap-1.5"
          @click="generateGraph"
        >
          <div class="i-carbon-center-to-fit" />
          Auto Layout
        </button>
        <button 
          class="px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-md hover:bg-zinc-500/20 transition-all border-none cursor-pointer flex items-center gap-1.5"
          @click="copyMermaid"
        >
          <div class="i-carbon-copy" />
          Copy Mermaid
        </button>
      </div>
    </div>

    <div class="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-[#050505]">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        :class="{ 'dark': true }"
        :min-zoom="0.2"
        :max-zoom="4"
      >
        <Background pattern-color="#333" :gap="20" />
      </VueFlow>
    </div>

    <!-- Instructions Overlay -->
    <div class="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
      <div class="p-3 bg-surface border border-base rounded-xl shadow-2xl opacity-90 backdrop-blur-md">
        <h4 class="text-[10px] font-black uppercase mb-2 tracking-widest text-primary flex items-center gap-2">
          <div class="i-carbon-information" />
          Explorer Controls
        </h4>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-[9px] font-bold opacity-70">
            <kbd class="px-1.5 py-0.5 bg-base border border-base rounded text-[8px]">Scroll</kbd>
            <span>to Zoom</span>
          </div>
          <div class="flex items-center gap-2 text-[9px] font-bold opacity-70">
            <kbd class="px-1.5 py-0.5 bg-base border border-base rounded text-[8px]">Drag</kbd>
            <span>to Pan / Move Entities</span>
          </div>
        </div>
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
  from {
    stroke-dashoffset: 10;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.vue-flow__edge-label {
  background: #10b981;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.dark .vue-flow__edge-textbg {
  fill: #050505;
}

.vue-flow__controls {
  display: none;
}
</style>
