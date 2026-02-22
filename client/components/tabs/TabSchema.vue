<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { selectedService } = useSharedODataState()

const loading = ref(false)
const schemaData = ref<any>(null)
const mermaidSvg = ref<string>('')
const container = ref<HTMLElement | null>(null)

// Load mermaid and svg-pan-zoom from CDN
async function loadScripts() {
  if (typeof window === 'undefined') return
  
  const scripts = [
    'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
    'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js'
  ]

  for (const src of scripts) {
    if (!document.querySelector(`script[src="${src}"]`)) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }
  }
}

async function fetchSchema() {
  if (!selectedService.value) return
  loading.value = true
  try {
    const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
    schemaData.value = await res.json()
    await renderDiagram()
  } catch (e) {
    console.error('Failed to fetch schema', e)
  } finally {
    loading.value = false
  }
}

function generateMermaidCode() {
  if (!schemaData.value) return ''
  
  let code = 'erDiagram\n'
  
  // Entities and Properties
  schemaData.value.entities.forEach((entity: any) => {
    const props = entity.properties.map((p: any) => {
      const type = p.type.split('.').pop()
      const key = p.isKey ? 'PK' : ''
      return `    ${type} ${p.name} ${key}`
    }).join('\n')
    
    code += `  ${entity.name} {\n${props}\n  }\n`
  })

  // Relationships
  const addedAssocs = new Set()
  schemaData.value.entities.forEach((entity: any) => {
    entity.navigationProperties.forEach((nav: any) => {
      const assoc = schemaData.value.associations.find((a: any) => 
        a.name === nav.relationship || `${schemaData.value.namespace}.${a.name}` === nav.relationship
      )
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
  
  return code
}

let panZoomInstance: any = null

async function renderDiagram() {
  if (!schemaData.value || typeof window === 'undefined') return
  
  const code = generateMermaidCode()
  const mermaid = (window as any).mermaid
  
  if (!mermaid) return

  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    securityLevel: 'loose',
    er: {
      useMaxWidth: false,
    }
  })

  const { svg } = await mermaid.render('mermaid-svg-' + Math.random().toString(36).substr(2, 9), code)
  mermaidSvg.value = svg

  // Setup pan-zoom after rendering
  setTimeout(() => {
    if (container.value) {
      const svgElement = container.value.querySelector('svg')
      if (svgElement) {
        svgElement.style.width = '100%'
        svgElement.style.height = '100%'
        
        if (panZoomInstance) {
          panZoomInstance.destroy()
        }
        
        panZoomInstance = (window as any).svgPanZoom(svgElement, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.1,
          maxZoom: 10
        })
      }
    }
  }, 50)
}

function copyMermaid() {
  const code = generateMermaidCode()
  if (!code) return
  navigator.clipboard.writeText(code)
  alert('Mermaid diagram code copied to clipboard!')
}

onMounted(async () => {
  await loadScripts()
  if (selectedService.value) {
    await fetchSchema()
  }
})

watch(selectedService, async () => {
  if (selectedService.value) {
    await fetchSchema()
  }
})

// Update theme when dark mode changes
watch(() => document.documentElement.classList.contains('dark'), () => {
  renderDiagram()
})
</script>

<template>
  <div class="h-full flex flex-col bg-base overflow-hidden relative text-base">
    <div class="p-4 border-b border-base bg-surface flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3 text-base">
        <h2 class="text-sm font-bold uppercase tracking-wider opacity-70">Entity Relationship Diagram (Mermaid)</h2>
        <div v-if="loading" class="animate-pulse text-xs text-muted">Parsing EDMX...</div>
      </div>
      <div class="flex items-center gap-2 text-base">
        <button 
          class="px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-md hover:bg-zinc-500/20 transition-all border-none cursor-pointer"
          @click="copyMermaid"
        >
          Copy Mermaid Code
        </button>
      </div>
    </div>

    <div 
      ref="container"
      class="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950/20 p-4 flex items-center justify-center text-base"
      v-html="mermaidSvg"
    />

    <div class="absolute bottom-4 left-4 p-3 bg-surface border border-base rounded-lg shadow-xl z-10 opacity-80 pointer-events-none">
      <h4 class="text-[10px] font-black uppercase mb-1 tracking-widest text-primary">Instructions</h4>
      <p class="text-[9px] font-bold opacity-70">Use mouse wheel to zoom, click and drag to pan.</p>
    </div>
  </div>
</template>

<style>
/* Mermaid Diagram Styles */
.mermaid svg {
  max-width: none !important;
}
.dark .er.entityBox {
  fill: #18181b !important;
  stroke: #3f3f46 !important;
}
.dark .er.entityLabel {
  fill: #e4e4e7 !important;
}
.dark .er.relationshipLabel {
  fill: #a1a1aa !important;
}
.dark .er.relationshipLine {
  stroke: #52525b !important;
}
</style>
