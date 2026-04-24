<template>
  <section class="stats-section">
    <div class="container">
      <div class="stats">
        <div class="stat">
          <div class="stat-num">4<span class="unit">pkg</span></div>
          <div class="stat-label">Core · Proxy · Nuxt · Explorer</div>
        </div>
        <div class="stat">
          <div class="stat-num">V2 · V4</div>
          <div class="stat-label">Fully Compliant</div>
        </div>
        <div class="stat">
          <div class="stat-num">0<span class="unit">kb</span></div>
          <div class="stat-label">Runtime overhead · tree-shaken</div>
        </div>
        <div class="stat">
          <div class="stat-num">100<span class="unit">%</span></div>
          <div class="stat-label">TypeScript · EDMX-inferred</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  padding: 0 24px 88px;
}
.container {
  max-width: 1240px;
  margin: 0 auto;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--odx-border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--odx-bg-elevated);
}
@media (max-width: 800px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat { border-right: none !important; border-bottom: 1px solid var(--odx-border); }
  .stat:nth-child(even) { border-left: 1px solid var(--odx-border); }
  .stat:last-child, .stat:nth-last-child(2) { border-bottom: none; }
}

.stat {
  padding: 28px 24px;
  border-right: 1px solid var(--odx-border);
}
.stat:last-child { border-right: none; }

.stat-num {
  font-family: var(--odx-font-mono);
  font-weight: 600;
  font-size: clamp(28px, 3.2vw, 40px);
  color: var(--odx-fg);
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 10px;
}
.unit {
  color: var(--odx-primary-fg);
  font-size: 0.6em;
  margin-left: 2px;
}
.stat-label {
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--odx-fg-muted);
}
</style>
