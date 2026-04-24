<script setup lang="ts">
const copied = ref(false)
function copyInstall() {
  navigator.clipboard?.writeText('pnpm add -D @bc8-odx/nuxt')
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <section class="cta-section">
    <div class="container">
      <div class="cta">
        <div class="cta-grid" />
        <div class="cta-inner">
          <div class="kicker">One command away</div>
          <h2 class="cta-title">
            Ready to <span class="accent">feel</span> OData again?
          </h2>
          <p class="cta-desc">
            Install the module, point at a service, ship typed UI.
            Everything else is plumbing ODX already handles.
          </p>

          <div class="cta-buttons">
            <UButton
              to="/en/ecosystem/introduction"
              size="lg"
              color="primary"
              trailing-icon="i-lucide-arrow-right"
            >
              Read the docs
            </UButton>
            <UButton
              to="https://github.com/janfrl/odx-js"
              target="_blank"
              size="lg"
              variant="outline"
              color="neutral"
              icon="i-simple-icons-github"
            >
              Star on GitHub
            </UButton>
          </div>

          <!-- Install command -->
          <button class="install-cmd" @click="copyInstall">
            <span class="dollar">$</span>
            <span class="cmd-text">pnpm add -D @bc8-odx/nuxt</span>
            <UIcon
              :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              class="size-3.5"
              :class="copied ? 'text-green-400' : 'text-zinc-500'"
            />
          </button>
          <p v-if="copied" class="copied-msg">Copied!</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-section {
  padding: 0 24px 88px;
}
.container {
  max-width: 1240px;
  margin: 0 auto;
}

.cta {
  position: relative;
  border: 1px solid var(--odx-border);
  border-radius: 16px;
  background:
    radial-gradient(ellipse 800px 400px at 50% 0%, color-mix(in srgb, #22c55e 12%, transparent), transparent 70%),
    var(--odx-bg-elevated);
  padding: 80px 24px;
  text-align: center;
  overflow: hidden;
}

.cta-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right,  color-mix(in srgb, var(--odx-border) 40%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--odx-border) 40%, transparent) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 60% 70% at 50% 30%, #000, transparent 80%);
  opacity: 0.6;
}

.cta-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kicker {
  font-family: var(--odx-font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--odx-fg-muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.kicker::before { content: ''; width: 20px; height: 1px; background: var(--odx-primary); }

.cta-title {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 16px;
  color: var(--odx-fg);
}
.accent { color: var(--odx-primary-fg); }

.cta-desc {
  font-size: 17px;
  color: var(--odx-fg-toned);
  line-height: 1.5;
  max-width: 560px;
  margin: 0 auto 32px;
  text-wrap: balance;
}

.cta-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

/* Install command pill */
.install-cmd {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border: 1px solid var(--odx-border);
  border-radius: 8px;
  background: var(--odx-bg-elevated);
  font-family: var(--odx-font-mono);
  font-size: 13px;
  color: var(--odx-fg-toned);
  cursor: pointer;
  transition: border-color 150ms, background 150ms;
}
.install-cmd:hover {
  border-color: var(--odx-border-strong);
  background: var(--odx-bg-muted);
}
.dollar { color: var(--odx-primary); }

.copied-msg {
  margin-top: 8px;
  font-family: var(--odx-font-mono);
  font-size: 11px;
  color: var(--odx-primary-fg);
  letter-spacing: 0.08em;
}
</style>
