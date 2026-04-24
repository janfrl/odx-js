<script setup lang="ts">
function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
  el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
}
</script>

<template>
  <section class="bento-section">
    <div class="container">
      <!-- Header -->
      <div class="section-head">
        <div class="kicker">Built for OData, Opinionated about DX</div>
        <h2 class="section-title">
          Everything you need.<br>
          <span class="accent">Nothing you don't.</span>
        </h2>
      </div>

      <!-- Bento grid -->
      <div class="bento">

        <!-- 1. Universal Compatibility (span 2) -->
        <div class="cell span-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-lucide-globe" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Universal Compatibility</h3>
          <p class="cell-desc">Any compliant OData V2 or V4 endpoint — standard, public, or enterprise.</p>
          <div class="cell-visual">
            <div class="pill-row">
              <span v-for="t in ['V2', 'V4', '$filter', '$select', '$expand', '$orderby', '$top', '$skip', '$count', '$batch']" :key="t" class="pill">{{ t }}</span>
            </div>
          </div>
        </div>

        <!-- 2. SAP Support (span 2) -->
        <div class="cell span-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-simple-icons-sap" class="size-4 text-primary" /></div>
          <h3 class="cell-title">First-Class SAP Support</h3>
          <p class="cell-desc">NetWeaver routing, CSRF-Token pre-fetching, BTP destination auth — out of the box.</p>
          <div class="cell-visual">
            <div class="sap-stack">
              <div class="sap-item">
                <UIcon name="i-lucide-circle-check" class="size-3 text-primary" />
                CSRF · Fetched
              </div>
              <div class="sap-item pulse">
                <UIcon name="i-lucide-shield-check" class="size-3 text-primary" />
                BTP · Destination
              </div>
              <div class="sap-item">
                <UIcon name="i-lucide-circle-check" class="size-3 text-primary" />
                NetWeaver · Routed
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Type-Safe SDK (span 2) -->
        <div class="cell span-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-lucide-shield-check" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Type-Safe SDK</h3>
          <p class="cell-desc">TypeScript models generated from EDMX. Errors at compile time, not at 3am.</p>
          <div class="cell-visual">
            <pre class="type-pre"><span>odata.northwind.Products
  .filter({ <span class="err">Dicontinued</span>: false })
  .top(<span class="str">"10"</span>)
  <span class="cmt">// ↑ TS2322: Dicontinued</span>
  <span class="cmt">//   does not exist on Product</span></span></pre>
          </div>
        </div>

        <!-- 4. Schema Graph (span 3, row 2) -->
        <div class="cell span-3 row-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-lucide-share-2" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Interactive Schema Graph</h3>
          <p class="cell-desc">Visualise entity sets, navigation properties, and cardinality — live from $metadata.</p>
          <div class="cell-visual schema-visual">
            <svg viewBox="0 0 420 240" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--odx-border-strong)" />
                </marker>
              </defs>
              <!-- edges -->
              <path d="M 140 65 Q 220 85 280 65" stroke="var(--odx-border-strong)" stroke-width="1.5" fill="none" stroke-dasharray="3 3" marker-end="url(#arr)" />
              <path d="M 140 125 Q 220 135 280 135" stroke="var(--odx-primary)" stroke-width="1.5" fill="none" marker-end="url(#arr)" />
              <path d="M 140 185 Q 220 195 280 190" stroke="var(--odx-border-strong)" stroke-width="1.5" fill="none" stroke-dasharray="3 3" marker-end="url(#arr)" />
              <!-- left nodes -->
              <g v-for="n in [{x:20,y:45,label:'Categories',sel:false},{x:20,y:105,label:'Products',sel:true},{x:20,y:165,label:'Suppliers',sel:false}]" :key="n.label">
                <rect :x="n.x" :y="n.y" width="120" height="38" rx="6"
                  :fill="n.sel ? 'color-mix(in srgb, var(--odx-primary) 14%, var(--odx-bg-elevated))' : 'var(--odx-bg-muted)'"
                  :stroke="n.sel ? 'var(--odx-primary)' : 'var(--odx-border-strong)'" stroke-width="1" />
                <circle :cx="n.x + 12" :cy="n.y + 19" r="3" :fill="n.sel ? 'var(--odx-primary)' : 'var(--odx-fg-muted)'" />
                <text :x="n.x + 22" :y="n.y + 23" font-family="monospace" font-size="10.5" fill="var(--odx-fg)" font-weight="600">{{ n.label }}</text>
              </g>
              <!-- right nodes -->
              <g v-for="n in [{x:280,y:45,label:'Category'},{x:280,y:115,label:'Order_Detail'},{x:280,y:172,label:'Supplier'}]" :key="n.label">
                <rect :x="n.x" :y="n.y" width="120" height="38" rx="6"
                  fill="var(--odx-bg-muted)" stroke="var(--odx-border-strong)" stroke-width="1" />
                <circle :cx="n.x + 12" :cy="n.y + 19" r="3" fill="var(--odx-fg-muted)" />
                <text :x="n.x + 22" :y="n.y + 23" font-family="monospace" font-size="10.5" fill="var(--odx-fg)" font-weight="600">{{ n.label }}</text>
              </g>
              <!-- label -->
              <text x="210" y="126" font-family="monospace" font-size="9" fill="var(--odx-primary-fg)" text-anchor="middle">1 : n</text>
            </svg>
          </div>
        </div>

        <!-- 5. Live Traffic (span 3, row 2) -->
        <div class="cell span-3 row-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-lucide-activity" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Deep Introspection</h3>
          <p class="cell-desc">Every OData request, response, and $metadata fetch — streamed live into Nuxt DevTools.</p>
          <div class="cell-visual traffic">
            <div
              v-for="r in [
                { m: 'GET',   u: '/Products?$top=5',   st: '200', t: '87 ms'  },
                { m: 'GET',   u: '/Categories(4)',      st: '200', t: '42 ms'  },
                { m: 'POST',  u: '/Orders',             st: '201', t: '132 ms' },
                { m: 'PATCH', u: '/Products(38)',       st: '204', t: '58 ms'  },
                { m: 'GET',   u: '/$metadata',          st: '200', t: '12 ms'  },
              ]"
              :key="r.u"
              class="traffic-row"
            >
              <span class="tr-m" :class="r.m.toLowerCase()">{{ r.m }}</span>
              <span class="tr-url">{{ r.u }}</span>
              <span class="tr-st">{{ r.st }}</span>
              <span class="tr-t">{{ r.t }}</span>
            </div>
          </div>
        </div>

        <!-- 6. Nuxt DX (span 2) -->
        <div class="cell span-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-simple-icons-nuxtdotjs" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Nuxt-First DX</h3>
          <p class="cell-desc">Auto-imports, SSR-safe fetching, zero-config DevTools integration.</p>
        </div>

        <!-- 7. Offline Ready (span 2) -->
        <div class="cell span-2" @mousemove="onMove">
          <div class="cell-icon"><UIcon name="i-lucide-database" class="size-4 text-primary" /></div>
          <h3 class="cell-title">Offline-Ready</h3>
          <p class="cell-desc">Mock any OData backend from local JSON. Ship UI before the backend exists.</p>
          <div class="cell-visual">
            <div class="file-tree">
              <div><span class="dir">mocks/</span></div>
              <div><span class="ind">├─</span> <span class="json-file">Products.json</span></div>
              <div><span class="ind">├─</span> <span class="json-file">Categories.json</span></div>
              <div><span class="ind">└─</span> <span class="json-file">$metadata.xml</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.bento-section {
  padding: 88px 24px;
  border-top: 1px solid var(--odx-border);
}
.container {
  max-width: 1240px;
  margin: 0 auto;
}

/* Header */
.section-head { margin-bottom: 48px; }
.kicker {
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--odx-fg-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.kicker::before { content: ''; width: 20px; height: 1px; background: var(--odx-primary); }
.section-title {
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0;
  color: var(--odx-fg);
}
.accent { color: var(--odx-primary-fg); }

/* Grid */
.bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
@media (max-width: 960px) {
  .bento { grid-template-columns: 1fr; }
  .span-2, .span-3 { grid-column: span 1; }
  .row-2 { grid-row: span 1; }
}

/* Cell */
.cell {
  position: relative;
  border: 1px solid var(--odx-border);
  border-radius: 12px;
  background: var(--odx-bg-elevated);
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 150ms;
}
.cell:hover { border-color: var(--odx-border-strong); }

/* Cursor spotlight */
.cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(280px 180px at var(--mx, 50%) var(--my, 0%),
    color-mix(in srgb, var(--odx-primary) 10%, transparent), transparent 70%);
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.cell:hover::after { opacity: 1; }

.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.row-2  { grid-row: span 2; }

/* Cell parts */
.cell-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--odx-bg-muted);
  border: 1px solid var(--odx-border);
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}
.cell-title {
  font-weight: 600;
  font-size: 17px;
  color: var(--odx-fg);
  margin: 0 0 6px;
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
}
.cell-desc {
  font-size: 14px;
  line-height: 1.5;
  color: var(--odx-fg-muted);
  margin: 0;
  position: relative;
  z-index: 1;
}
.cell-visual {
  flex: 1;
  margin-top: 16px;
  position: relative;
  z-index: 1;
  min-height: 0;
}

/* Pill row */
.pill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.pill {
  font-family: var(--odx-font-mono);
  font-size: 11px;
  padding: 4px 9px;
  border-radius: 5px;
  background: var(--odx-bg-muted);
  color: var(--odx-fg-toned);
  border: 1px solid var(--odx-border);
}

/* SAP stack */
.sap-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--odx-font-mono);
  font-size: 11px;
  color: var(--odx-fg-muted);
  letter-spacing: 0.1em;
  margin-top: 8px;
}
.sap-item {
  padding: 7px 10px;
  border: 1px solid var(--odx-border);
  border-radius: 6px;
  background: var(--odx-bg-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}
.sap-item.pulse {
  border-color: color-mix(in srgb, var(--odx-primary) 40%, var(--odx-border));
  background: color-mix(in srgb, var(--odx-primary) 8%, var(--odx-bg-muted));
}

/* Type-safe code */
.type-pre {
  font-family: var(--odx-font-mono);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--odx-fg-toned);
  white-space: pre;
  overflow: hidden;
  margin: 8px 0 0;
}
.err {
  text-decoration: underline wavy var(--odx-error);
  text-decoration-skip-ink: none;
  text-underline-offset: 3px;
}
.str { color: #c084fc; }
.cmt { color: var(--odx-primary-fg); }

/* Schema visual */
.schema-visual {
  width: 100%;
  min-height: 120px;
}
.schema-visual svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Traffic */
.traffic {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.traffic-row {
  display: grid;
  grid-template-columns: 46px 1fr 46px 44px;
  gap: 10px;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: var(--odx-font-mono);
  font-size: 11px;
  color: var(--odx-fg-toned);
  border: 1px solid transparent;
  transition: background 150ms, border-color 150ms;
}
.traffic-row:hover {
  background: var(--odx-bg-muted);
  border-color: var(--odx-border);
}
.tr-m { font-weight: 600; }
.tr-m.get   { color: var(--odx-primary-fg); }
.tr-m.post  { color: #3b82f6; }
.tr-m.patch { color: #f59e0b; }
.tr-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--odx-fg); }
.tr-st  { color: var(--odx-primary-fg); text-align: right; }
.tr-t   { color: var(--odx-fg-muted); text-align: right; }

/* File tree */
.file-tree {
  font-family: var(--odx-font-mono);
  font-size: 11.5px;
  line-height: 1.75;
  color: var(--odx-fg-toned);
  margin-top: 8px;
}
.dir   { color: var(--odx-fg); font-weight: 600; }
.json-file { color: var(--odx-primary-fg); }
.ind   { color: var(--odx-fg-muted); }
</style>
