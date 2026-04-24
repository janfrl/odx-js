<template>
  <section class="arch-section">
    <div class="container">
      <!-- Header -->
      <div class="section-head">
        <div class="kicker">How it fits together</div>
        <h2 class="section-title">One pipeline, end-to-end typed.</h2>
        <p class="section-lede">
          Your component calls a typed method. ODX composes the OData URL, the proxy handles auth and CSRF,
          the response streams back through schema-aware parsers, and DevTools sees every hop.
        </p>
      </div>

      <!-- Diagram -->
      <div class="arch-frame">
        <div class="arch-grid" />
        <svg viewBox="0 0 1100 360" preserveAspectRatio="xMidYMid meet" class="arch-svg">
          <defs>
            <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
            </marker>
          </defs>

          <!-- Lane labels -->
          <text x="90"  y="26" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="2">CLIENT</text>
          <text x="420" y="26" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="2">ODX RUNTIME</text>
          <text x="810" y="26" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="2">BACKEND</text>

          <!-- Lane separators -->
          <line x1="360" y1="40" x2="360" y2="330" stroke="var(--odx-border)" stroke-dasharray="3 4" />
          <line x1="740" y1="40" x2="740" y2="330" stroke="var(--odx-border)" stroke-dasharray="3 4" />

          <!-- CLIENT nodes -->
          <g v-for="n in clientNodes" :key="n.title">
            <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="8"
              fill="var(--odx-bg-elevated)" stroke="var(--odx-border-strong)" stroke-width="1" />
            <text :x="n.x + n.w/2" :y="n.y + 26" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="var(--odx-fg)">{{ n.title }}</text>
            <text :x="n.x + n.w/2" :y="n.y + 44" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="0.5">{{ n.sub }}</text>
          </g>

          <!-- ODX RUNTIME nodes (accent) -->
          <g v-for="n in runtimeNodes" :key="n.title">
            <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="8"
              fill="color-mix(in srgb, #22c55e 10%, var(--odx-bg-elevated))"
              stroke="#22c55e" stroke-width="1" />
            <text :x="n.x + n.w/2" :y="n.y + 26" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="var(--odx-fg)">{{ n.title }}</text>
            <text :x="n.x + n.w/2" :y="n.y + 44" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="0.5">{{ n.sub }}</text>
          </g>

          <!-- Type Gen node -->
          <g>
            <rect x="614" y="170" width="110" height="60" rx="8"
              fill="var(--odx-bg-elevated)" stroke="var(--odx-border-strong)" stroke-width="1" />
            <text x="669" y="196" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="var(--odx-fg)">Type Gen</text>
            <text x="669" y="214" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="0.5">EDMX → .d.ts</text>
          </g>

          <!-- BACKEND nodes -->
          <g v-for="n in backendNodes" :key="n.title">
            <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="8"
              fill="var(--odx-bg-elevated)" stroke="var(--odx-border-strong)" stroke-width="1" />
            <text :x="n.x + n.w/2" :y="n.y + 26" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="var(--odx-fg)">{{ n.title }}</text>
            <text :x="n.x + n.w/2" :y="n.y + 44" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--odx-fg-muted)" letter-spacing="0.5">{{ n.sub }}</text>
          </g>

          <!-- Arrows -->
          <path d="M 210 160 L 390 120" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />
          <path d="M 210 230 L 390 210" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />
          <path d="M 560 115 L 614 195" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />
          <path d="M 560 210 L 740 125" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />
          <path d="M 560 210 L 740 210" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />
          <path d="M 560 290 L 740 290" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arw)" opacity="0.85" />

          <!-- Arrow labels -->
          <text x="300" y="130" font-family="monospace" font-size="9" fill="#22c55e" text-anchor="middle">typed</text>
          <text x="680" y="188" font-family="monospace" font-size="9" fill="#22c55e" text-anchor="middle">.d.ts</text>
          <text x="660" y="168" font-family="monospace" font-size="9" fill="#22c55e" text-anchor="middle">CSRF ✓</text>
        </svg>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const clientNodes = [
  { x: 30,  y: 130, w: 175, h: 60, title: 'Vue / Nuxt app',   sub: 'typed composables' },
  { x: 30,  y: 210, w: 175, h: 60, title: 'Explorer UI',       sub: 'DevTools' },
]
const runtimeNodes = [
  { x: 390, y: 85,  w: 170, h: 60, title: 'Core SDK',         sub: '@bc8-odx/core' },
  { x: 390, y: 165, w: 170, h: 60, title: 'Nuxt Module',      sub: '@bc8-odx/nuxt' },
  { x: 390, y: 260, w: 170, h: 60, title: 'Proxy (Nitro)',    sub: '@bc8-odx/proxy' },
]
const backendNodes = [
  { x: 740, y: 85,  w: 170, h: 60, title: 'SAP Gateway',      sub: 'OData V2 · CSRF' },
  { x: 740, y: 180, w: 170, h: 60, title: 'Public OData',     sub: 'V2 / V4' },
  { x: 740, y: 260, w: 170, h: 60, title: 'Mock Backend',     sub: 'JSON fixtures' },
]
</script>

<style scoped>
.arch-section {
  padding: 88px 24px;
}
.container {
  max-width: 1240px;
  margin: 0 auto;
}

/* Header */
.section-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 48px;
}
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
  margin: 0 0 16px;
  color: var(--odx-fg);
}
.section-lede {
  font-size: 17px;
  line-height: 1.55;
  color: var(--odx-fg-toned);
  max-width: 620px;
  margin: 0 auto;
  text-wrap: balance;
}

/* Diagram frame */
.arch-frame {
  border: 1px solid var(--odx-border);
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, #22c55e 6%, transparent), transparent 60%),
    var(--odx-bg-elevated);
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
}
.arch-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right,  color-mix(in srgb, var(--odx-border) 50%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--odx-border) 50%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%);
  opacity: 0.5;
  pointer-events: none;
}
.arch-svg {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
}
</style>
