<script setup lang="ts">
const rawMarkdown = `
::code-tree{v-model="activeTab"}

\`\`\`ts [composables/products.ts] {4-10}
import { odata } from '@bc8-odx/nuxt'

// Fully typed from your EDMX schema
const products = await odata.northwind
  .Products
  .select('ProductID', 'ProductName', 'UnitPrice')
  .filter({ Discontinued: false })
  .orderBy('UnitPrice', 'desc')
  .top(5)
  .get()

// products: Product[] — types inferred from EDMX
\`\`\`

\`\`\`ts [nuxt.config.ts] {4-11}
export default defineNuxtConfig({
  modules: ['@bc8-odx/nuxt'],

  odx: {
    services: {
      northwind: {
        url: 'https://services.odata.org/V4/Northwind/Northwind.svc',
        version: 'v4',
      },
    },
  },
})
\`\`\`

\`\`\`ts [.odx/northwind.d.ts]
// Auto-generated from EDMX — do not edit
export interface Product {
  ProductID: number
  ProductName: string
  UnitPrice?: number
  UnitsInStock?: number
  Discontinued: boolean
  Category?: Category
  Supplier?: Supplier
}
\`\`\`

::
`

const activeTab = ref('composables/products.ts')
</script>

<template>
  <section class="demo">
    <div class="container">
      <!-- Section header -->
      <div class="section-head">
        <div class="kicker">Live Demo · V4</div>
        <h2 class="section-title">
          Query any OData service<br>
          like it's a <span class="accent">local object.</span>
        </h2>
        <p class="section-lede">
          Point ODX at a metadata URL and the SDK auto-generates typed collections, entities,
          and navigation properties. Chain
          <code class="odx-code">.filter()</code>,
          <code class="odx-code">.select()</code>, and
          <code class="odx-code">.expand()</code> against a fully inferred schema.
        </p>
      </div>

      <!-- Split: code + response -->
      <div class="demo-split">
        <!-- Code window using standard MDC -->
        <div class="mdc-wrapper">
          <MDC :value="rawMarkdown" />
        </div>

        <!-- JSON response panel -->
        <div class="panel">
          <div class="panel-head">
            <span class="method">GET</span>
            <span class="panel-path">/Products?$top=5&amp;$filter=…</span>
            <span class="panel-status">200 · 87 ms</span>
          </div>
          <div class="panel-body">
            <pre class="json-view"><span class="j-punc">{</span>
  <span class="j-key">"@odata.context"</span><span class="j-punc">:</span> <span class="j-str">"$metadata#Products"</span><span class="j-punc">,</span>
  <span class="j-key">"value"</span><span class="j-punc">:</span> <span class="j-punc">[</span>
    <span class="j-punc">{</span>
      <span class="j-key">"ProductID"</span><span class="j-punc">:</span> <span class="j-num">38</span><span class="j-punc">,</span>
      <span class="j-key">"ProductName"</span><span class="j-punc">:</span> <span class="j-str">"Côte de Blaye"</span><span class="j-punc">,</span>
      <span class="j-key">"UnitPrice"</span><span class="j-punc">:</span> <span class="j-num">263.50</span><span class="j-punc">,</span>
      <span class="j-key">"Discontinued"</span><span class="j-punc">:</span> <span class="j-bool">false</span>
    <span class="j-punc">},</span>
    <span class="j-punc">{</span>
      <span class="j-key">"ProductID"</span><span class="j-punc">:</span> <span class="j-num">29</span><span class="j-punc">,</span>
      <span class="j-key">"ProductName"</span><span class="j-punc">:</span> <span class="j-str">"Thüringer Rostbratwurst"</span><span class="j-punc">,</span>
      <span class="j-key">"UnitPrice"</span><span class="j-punc">:</span> <span class="j-num">123.79</span><span class="j-punc">,</span>
      <span class="j-key">"Discontinued"</span><span class="j-punc">:</span> <span class="j-bool">true</span>
    <span class="j-punc">},</span>
    <span class="j-punc">{</span>
      <span class="j-key">"ProductID"</span><span class="j-punc">:</span> <span class="j-num">9</span><span class="j-punc">,</span>
      <span class="j-key">"ProductName"</span><span class="j-punc">:</span> <span class="j-str">"Mishi Kobe Niku"</span><span class="j-punc">,</span>
      <span class="j-key">"UnitPrice"</span><span class="j-punc">:</span> <span class="j-num">97.00</span><span class="j-punc">,</span>
      <span class="j-key">"Discontinued"</span><span class="j-punc">:</span> <span class="j-bool">true</span>
    <span class="j-punc">}</span>
    <span class="j-cmt">// … 2 more</span>
  <span class="j-punc">]</span>
<span class="j-punc">}</span></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo {
  padding: 88px 24px;
  position: relative;
}
.container {
  max-width: 1240px;
  margin: 0 auto;
}

/* Section head */
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
.kicker::before {
  content: '';
  width: 20px;
  height: 1px;
  background: var(--odx-primary);
}
.section-title {
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 16px;
  color: var(--odx-fg);
  text-wrap: balance;
}
.accent { color: var(--odx-primary-fg); }
.section-lede {
  font-size: 17px;
  line-height: 1.55;
  color: var(--odx-fg-toned);
  max-width: 620px;
  margin: 0;
  text-wrap: balance;
}
.odx-code {
  font-family: var(--odx-font-mono);
  font-size: 12px;
  color: var(--odx-fg);
  background: var(--odx-bg-muted);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--odx-border);
}

/* Split layout */
.demo-split {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  align-items: stretch;
}
@media (max-width: 1024px) {
  .demo-split { grid-template-columns: 1fr; }
}

.mdc-wrapper :deep(.prose-code-tree) {
  margin: 0;
  height: 100%;
}

/* Response panel */
.panel {
  border: 1px solid var(--odx-border);
  border-radius: 12px;
  background: var(--odx-bg-elevated);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.panel-head {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--odx-border);
  background: var(--odx-bg-muted);
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--odx-fg-muted);
}
.method { color: var(--odx-primary-fg); font-weight: 600; }
.panel-path {
  color: var(--odx-fg-toned);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  flex: 1;
}
.panel-status { color: var(--odx-primary-fg); margin-left: auto; }
.panel-body { padding: 18px; flex: 1; overflow: auto; }

/* JSON viewer */
.json-view {
  font-family: var(--odx-font-mono);
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--odx-fg);
  margin: 0;
  white-space: pre;
}
.j-key  { color: var(--odx-primary-fg); }
.j-str  { color: #c084fc; }
.j-num  { color: #f59e0b; }
.j-bool { color: #3b82f6; }
.j-cmt  { color: var(--odx-fg-muted); }
.j-punc { color: var(--odx-fg-muted); }
</style>
