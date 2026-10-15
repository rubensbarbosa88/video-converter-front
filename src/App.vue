<template>
  <v-app class="grid-bg">
    <!-- <Analytics /> -->

    <!-- Formas decorativas (arraste-as!) -->
    <div class="shapes-layer" aria-hidden="true">
      <div class="shape-wrap shape-wrap--1" title="Arraste-me"><span class="shape shape--circle" /></div>
      <div class="shape-wrap shape-wrap--2" title="Arraste-me"><span class="shape shape--square" /></div>
      <div class="shape-wrap shape-wrap--3" title="Arraste-me"><span class="shape shape--triangle" /></div>
      <div class="shape-wrap shape-wrap--4" title="Arraste-me"><span class="shape shape--ring" /></div>
    </div>

    <header ref="topbar" class="topbar">
      <div class="topbar__inner">
        <a href="/" class="brand" aria-label="Conversor de vídeos — início">
          <span class="brand__dots">
            <i class="dot dot--red" /><i class="dot dot--yellow" /><i class="dot dot--green" />
          </span>
          <span class="brand__name font-display">rbs<span class="text-muted">.video-converter</span></span>
        </a>
        <span class="topbar__tag font-mono">ffmpeg · ws</span>
      </div>
    </header>

    <v-main>
      <v-container class="app-container">
        <router-view/>
      </v-container>

      <v-divider style="opacity: 0.2;" />
      <v-footer dark padless class="white--text justify-center py-3" style="opacity: 0.2;">
        <div class="white--text caption">
          © {{ new Date().getFullYear() }} Rubens Barbosa. Todos os direitos reservados.
        </div>
    </v-footer>
    </v-main>
  </v-app>
</template>

<script>
// import { Analytics } from '@vercel/analytics/vue'

import { animate, stagger, spring } from 'animejs'
import { floatShapes, prefersReducedMotion } from '@/helpers/animations'

export default {
  name: 'App',
  // components: { Analytics },
  mounted () {
    const wraps = this.$el.querySelectorAll('.shape-wrap')
    this.cleanupShapes = floatShapes(wraps)

    if (!prefersReducedMotion()) {
      this.introAnims = [
        animate(this.$refs.topbar, { y: { from: -80 }, opacity: { from: 0 }, duration: 800, ease: 'outExpo' }),
        animate(this.$el.querySelectorAll('.brand .dot'), {
          scale: { from: 0 },
          ease: spring({ bounce: 0.7, duration: 900 }),
          delay: stagger(110, { start: 300 })
        }),
        animate(wraps, {
          opacity: { from: 0 },
          scale: { from: 0 },
          ease: spring({ bounce: 0.5, duration: 1200 }),
          delay: stagger(150, { start: 500 })
        })
      ]
    }
  },
  beforeDestroy () {
    if (this.cleanupShapes) this.cleanupShapes()
    if (this.introAnims) this.introAnims.forEach(a => a.revert())
  }
}
</script>

<style lang="scss">
.app-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  backdrop-filter: blur(10px);
  background: rgba(37, 36, 35, 0.72);
  border-bottom: 1px solid var(--bg-grid);

  &__inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__tag {
    font-size: 0.75rem;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px 12px;
  }
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text) !important;

  &__dots { display: inline-flex; gap: 5px; }
  &__name { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    &--red { background: var(--red); }
    &--yellow { background: var(--yellow); }
    &--green { background: var(--green); }
  }

  &:hover .dot { transform: translateY(-2px); transition: transform .2s; }
}

.shapes-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.shape-wrap {
  position: absolute;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  padding: 12px;

  &.is-dragging { cursor: grabbing; }

  &--1 { top: 18%; left: 6%; }
  &--2 { top: 62%; left: 10%; }
  &--3 { top: 24%; right: 7%; }
  &--4 { top: 70%; right: 9%; }
}

.shape {
  display: block;
  width: 56px;
  height: 56px;

  &--circle { background: var(--red); border-radius: 50%; box-shadow: 0 0 40px rgba(255, 75, 75, .35); }
  &--square { background: var(--yellow); border-radius: 10px; width: 44px; height: 44px; box-shadow: 0 0 40px rgba(255, 204, 42, .3); }
  &--triangle {
    background: var(--green);
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
    filter: drop-shadow(0 0 20px rgba(141, 255, 85, .35));
  }
  &--ring { border: 8px solid var(--cyan); border-radius: 50%; width: 48px; height: 48px; }
}

@media (max-width: 960px) {
  .shape-wrap { opacity: .35; }
  .shape { width: 36px; height: 36px; }
  .shape--ring { border-width: 5px; }
}
</style>
