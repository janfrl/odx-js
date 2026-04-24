<template>
  <section class="hero">
    <!-- Background effects -->
    <div class="hero-bg" aria-hidden="true">
      <div class="hero-grid" />
      <div class="hero-glow" />
    </div>

    <!-- Decorative floating brackets -->
    <span class="hero-bracket left" aria-hidden="true">[</span>
    <span class="hero-bracket right" aria-hidden="true">]</span>

    <div class="hero-inner">
      <!-- Badge -->
      <NuxtLink to="/en/ecosystem/introduction" class="hero-badge">
        <span class="hero-badge-tag">NEW</span>
        <span>Explorer 0.4 — schema graph, live proxy tap</span>
        <UIcon name="i-lucide-arrow-right" class="text-zinc-400 size-3" />
      </NuxtLink>

      <!-- Title -->
      <h1 class="hero-title">
        Modern <span class="hero-accent">OData</span><br>
        Developer Experience.
      </h1>

      <!-- Lede -->
      <p class="hero-lede">
        ODX is a modular, framework-agnostic toolkit that bridges modern TypeScript web apps
        and OData V2 / V4 services — with first-class support for SAP.
      </p>

      <!-- CTAs -->
      <div class="hero-cta">
        <UButton
          to="/en/ecosystem/introduction"
          size="lg"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="hero-btn-primary"
        >
          Get Started
        </UButton>
        <UButton
          to="https://github.com/janfrl/odx-js"
          target="_blank"
          size="lg"
          variant="outline"
          color="neutral"
          icon="i-simple-icons-github"
        >
          github.com/janfrl/odx-js
        </UButton>
      </div>

      <!-- Meta strip -->
      <div class="hero-meta">
        <span><i class="hero-dot" />OData V2 + V4</span>
        <span>SAP · BTP · NetWeaver</span>
        <span>TypeScript · Zero-Config</span>
        <span>MIT Licensed</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Layout ── */
.hero {
  position: relative;
  padding: 88px 24px 72px;
  overflow: hidden;
  isolation: isolate;
}

/* ── Background ── */
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right,  color-mix(in srgb, var(--odx-border) 70%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--odx-border) 70%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 20%, transparent 80%);
  opacity: 0.65;
}
.hero-glow {
  position: absolute;
  left: 50%;
  top: 5%;
  transform: translateX(-50%);
  width: 900px;
  height: 520px;
  background: radial-gradient(ellipse at center,
    color-mix(in srgb, #22c55e 20%, transparent) 0%,
    transparent 60%
  );
  filter: blur(48px);
  opacity: 0.45;
}
:root:is(.dark) .hero-glow {
  opacity: 0.65;
}

/* ── Brackets ── */
.hero-bracket {
  position: absolute;
  font-family: var(--odx-font-mono);
  font-size: 180px;
  line-height: 1;
  color: color-mix(in srgb, #22c55e 16%, transparent);
  font-weight: 300;
  user-select: none;
  pointer-events: none;
  top: 46%;
  transform: translateY(-50%);
}
.hero-bracket.left  { left: 5%; }
.hero-bracket.right { right: 5%; }
@media (max-width: 900px) { .hero-bracket { display: none; } }

/* ── Inner ── */
.hero-inner {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Badge ── */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  border: 1px solid var(--odx-border);
  border-radius: 100px;
  background: color-mix(in srgb, var(--odx-bg-elevated) 70%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--odx-fg-toned);
  margin-bottom: 28px;
  text-decoration: none;
  transition: border-color 150ms;
}
.hero-badge:hover { border-color: var(--odx-border-strong); }
.hero-badge-tag {
  background: var(--odx-primary-soft);
  color: var(--odx-primary-fg);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  letter-spacing: 0.1em;
  font-size: 10px;
}

/* ── Title ── */
.hero-title {
  font-size: clamp(44px, 7vw, 88px);
  line-height: 0.98;
  letter-spacing: -0.035em;
  font-weight: 600;
  margin: 0 0 28px;
  color: var(--odx-fg);
}
.hero-accent {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
:root:is(.dark) .hero-accent {
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ── Lede ── */
.hero-lede {
  font-size: clamp(17px, 1.4vw, 20px);
  line-height: 1.52;
  color: var(--odx-fg-toned);
  max-width: 680px;
  margin: 0 auto 36px;
  text-wrap: balance;
}

/* ── CTAs ── */
.hero-cta {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.hero-btn-primary {
  box-shadow: 0 2px 8px color-mix(in srgb, #22c55e 35%, transparent);
}
.hero-btn-primary:hover {
  box-shadow: 0 4px 16px color-mix(in srgb, #22c55e 45%, transparent);
}

/* ── Meta ── */
.hero-meta {
  display: flex;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--odx-fg-muted);
}
.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.hero-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: odx-pulse 2.2s ease-in-out infinite;
  font-style: normal;
}
</style>
