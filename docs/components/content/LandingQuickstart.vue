<script setup lang="ts">
const STEPS = [
  {
    title: 'Install the Nuxt module',
    desc: 'One package, wires in DevTools, types, composables, and the proxy.',
    code: `
\`\`\`bash [terminal]
$ pnpm add -D @bc8-odx/nuxt

  ✓ Installed @bc8-odx/nuxt    ^0.4.2
  ✓ Installed @bc8-odx/core    ^0.4.2
  ✓ Installed @bc8-odx/proxy   ^0.4.2
  ✓ Installed @bc8-odx/explorer ^0.4.2

Done in 2.1s
\`\`\`
`
  },
  {
    title: 'Declare your service',
    desc: 'Register an OData endpoint in your Nuxt config — ODX discovers the schema.',
    code: `
\`\`\`ts [nuxt.config.ts] {3-11}
export default defineNuxtConfig({
  modules: ['@bc8-odx/nuxt'],
  odx: {
    services: {
      sap: {
        url: process.env.SAP_URL,
        version: 'v2',
        csrf: true,
      }
    }
  }
})
\`\`\`
`
  },
  {
    title: 'Query from a component',
    desc: 'Typed, auto-imported, SSR-safe. Your editor knows every entity and navigation property.',
    code: `
\`\`\`vue [OrdersList.vue] {4-7}
<script setup lang="ts">
const { data: orders } = await useAsyncData(
  'recent-orders',
  () => odata.sap.SalesOrderSet
    .expand('Items')
    .orderBy('CreatedAt', 'desc')
    .top(20).get()
)
<\/script>
\`\`\`
`
  },
]

const active = ref(0)
</script>

<template>
  <section class="qs-section">
    <div class="container">
      <!-- Header -->
      <div class="section-head">
        <div class="kicker">From Zero to Typed in 60 seconds</div>
        <h2 class="section-title">Quick start.</h2>
      </div>

      <div class="qs-layout">
        <!-- Step list -->
        <div class="steps">
          <button
            v-for="(s, i) in STEPS"
            :key="i"
            class="step"
            :class="{ 'is-active': i === active }"
            @click="active = i"
          >
            <div class="step-num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-body">
              <div class="step-title">{{ s.title }}</div>
              <div class="step-desc">{{ s.desc }}</div>
            </div>
          </button>
        </div>

        <!-- Code panel -->
        <div class="mdc-wrapper">
          <MDC :value="STEPS[active]!.code" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.qs-section {
  padding: 88px 24px;
  border-top: 1px solid var(--odx-border);
  border-bottom: 1px solid var(--odx-border);
  background: color-mix(in srgb, var(--odx-bg-muted) 40%, transparent);
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

/* Layout */
.qs-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 40px;
  align-items: start;
}
@media (max-width: 1000px) {
  .qs-layout { grid-template-columns: 1fr; }
}

/* Steps */
.steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--odx-border);
  border-radius: 10px;
  cursor: pointer;
  background: var(--odx-bg-elevated);
  text-align: left;
  transition: border-color 150ms, background 150ms, box-shadow 150ms;
  width: 100%;
}
.step:hover { border-color: var(--odx-border-strong); }
.step.is-active {
  border-color: var(--odx-primary);
  background: color-mix(in srgb, var(--odx-primary) 5%, var(--odx-bg-elevated));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--odx-primary) 10%, transparent);
}
.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--odx-bg-muted);
  border: 1px solid var(--odx-border);
  display: grid;
  place-items: center;
  font-family: var(--odx-font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--odx-fg-toned);
  transition: background 150ms, color 150ms, border-color 150ms;
}
.step.is-active .step-num {
  background: var(--odx-primary);
  color: white;
  border-color: var(--odx-primary);
}
.step-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--odx-fg);
  margin-bottom: 4px;
}
.step-desc {
  font-size: 12.5px;
  color: var(--odx-fg-muted);
  line-height: 1.45;
}

.mdc-wrapper :deep(.prose-pre) {
  margin: 0;
}
</style>
