<template>
  <transition :css="false" @enter="onEnter" @leave="onLeave">
    <div v-if="show" class="sheet-root">
      <div ref="backdrop" class="sheet-backdrop" />

      <section
        ref="sheet"
        class="sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="dialogLabel">
        <span class="sheet__handle" aria-hidden="true" />
        <div ref="burst" class="sheet__burst" aria-hidden="true" />

        <div ref="content" :key="contentKey" class="sheet__content">
          <!-- Estado de Erro -->
          <template v-if="status === 'error'">
            <span ref="stateIcon" data-sheet-item class="state-icon state-icon--error">
              <v-icon size="44" color="#252423">mdi-alert-octagon</v-icon>
            </span>
            <h2 data-sheet-item class="sheet__title font-display">Falha no processamento</h2>
            <p data-sheet-item class="sheet__text">{{ errorMessage }}</p>
            <div data-sheet-item class="sheet__actions">
              <button id="retry-btn" type="button" class="pill-btn pill-btn--outline" @click="$emit('retry')">
                <v-icon color="primary">mdi-refresh</v-icon>
                Tentar novamente
              </button>
            </div>
          </template>

          <!-- Estado de Progresso ou Conclusão -->
          <template v-else>
            <span
              v-if="status === 'done'"
              ref="stateIcon"
              data-sheet-item
              class="state-icon state-icon--done">
              <v-icon size="44" color="#252423">mdi-check-bold</v-icon>
            </span>

            <conversion-progress
              v-else
              :upload-percent="uploadPercent"
              :conversion-percent="conversionPercent"
              :status="status"
              :format-title="formatTitle"
            />

            <!-- Mensagem de Status -->
            <div data-sheet-item class="sheet__status">
              <h2 class="sheet__title font-display" v-html="textProgress"></h2>
              <p v-if="status === 'converting'" class="sheet__text">
                O vídeo está sendo transcodificado com FFmpeg no servidor.
              </p>
            </div>

            <!-- Ações pós-conversão -->
            <div v-if="status === 'done'" data-sheet-item class="sheet__actions sheet__actions--column">
              <button
                ref="downloadBtn"
                id="download-btn"
                type="button"
                class="pill-btn pill-btn--green download-btn"
                :disabled="isDownloading"
                @click="onDownload">
                <v-progress-circular v-if="isDownloading" indeterminate size="20" width="2" color="#252423" />
                <v-icon v-else color="#252423">mdi-download</v-icon>
                Baixar arquivo ({{ displayFormat }})
              </button>

              <span v-if="timeRemainingText" class="expire font-mono">
                <v-icon x-small color="warning">mdi-clock-outline</v-icon>
                {{ timeRemainingText }}
              </span>

              <button id="reset-btn" type="button" class="pill-btn pill-btn--ghost" @click="$emit('reset')">
                <v-icon small>mdi-plus</v-icon>
                Converter outro vídeo
              </button>
            </div>
          </template>
        </div>
      </section>
    </div>
  </transition>
</template>

<script>
import { animate, stagger } from 'animejs'
import ConversionProgress from '@/components/ConversionProgress.vue'
import { formatRemainingTime } from '@/helpers/timeFormat'
import { sheetIn, popIn, confetti, shake, pressBounce, magnetic, prefersReducedMotion } from '@/helpers/animations'

export default {
  name: 'ConversionOverlay',
  components: {
    ConversionProgress
  },
  props: {
    show: { type: Boolean, default: false },
    status: { type: String, default: 'idle' },
    uploadPercent: { type: Number, default: 0 },
    conversionPercent: { type: Number, default: 0 },
    statusMessage: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    selectedFormat: { type: String, default: 'mp4' },
    remainingSeconds: { type: Number, default: 0 },
    isDownloading: { type: Boolean, default: false }
  },
  computed: {
    displayFormat () {
      return `.${(this.selectedFormat || 'mp4').toLowerCase()}`
    },
    formatTitle () {
      return (this.selectedFormat || 'vídeo').toUpperCase()
    },
    timeRemainingText () {
      return formatRemainingTime(this.remainingSeconds)
    },
    // Recria o conteúdo (e reanima) só quando muda de "família" de estado
    contentKey () {
      if (this.status === 'error') return 'error'
      if (this.status === 'done') return 'done'
      return 'progress'
    },
    dialogLabel () {
      if (this.status === 'error') return 'Falha no processamento'
      if (this.status === 'done') return 'Conversão concluída'
      return 'Progresso da conversão'
    },
    textProgress () {
      if (this.status === 'uploading') {
        return `Enviando vídeo (${this.uploadPercent}%)`
      }
      if (this.status === 'converting') {
        return this.statusMessage || 'Processando conversão...'
      }
      if (this.status === 'done') {
        return 'Conversão finalizada com sucesso!'
      }
      if (this.status === 'error') {
        return 'Ocorreu um erro'
      }
      return 'Processando'
    }
  },
  watch: {
    contentKey () {
      this.$nextTick(this.animateState)
    }
  },
  beforeDestroy () {
    if (this.cleanupMagnetic) this.cleanupMagnetic()
  },
  methods: {
    onEnter (el, done) {
      this.$nextTick(() => {
        const tl = sheetIn(this.$refs.sheet, this.$refs.backdrop)
        this.animateState(true)
        if (tl && tl.then) tl.then(done)
        else done()
      })
    },
    onLeave (el, done) {
      if (prefersReducedMotion()) return done()
      if (this.cleanupMagnetic) { this.cleanupMagnetic(); this.cleanupMagnetic = null }
      animate(el.querySelector('.sheet'), { y: '110%', duration: 450, ease: 'inBack(1.4)' })
      animate(el.querySelector('.sheet-backdrop'), { opacity: 0, duration: 450, ease: 'inQuad', onComplete: done })
    },
    animateState (skipItems) {
      if (!this.$refs.content) return
      if (!skipItems && !prefersReducedMotion()) {
        animate(this.$refs.content.querySelectorAll('[data-sheet-item]'), {
          opacity: { from: 0 },
          y: { from: 24 },
          delay: stagger(70),
          duration: 700,
          ease: 'outExpo'
        })
      }

      if (this.cleanupMagnetic) { this.cleanupMagnetic(); this.cleanupMagnetic = null }

      if (this.status === 'done') {
        popIn(this.$refs.stateIcon, 150)
        confetti(this.$refs.burst, 42)
        this.cleanupMagnetic = magnetic(this.$refs.downloadBtn, 0.2)
      } else if (this.status === 'error') {
        popIn(this.$refs.stateIcon, 100)
        shake(this.$refs.sheet)
      }
    },
    onDownload () {
      pressBounce(this.$refs.downloadBtn)
      this.$emit('download')
    }
  }
}
</script>

<style lang="scss" scoped>
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 19, 18, 0.72);
  backdrop-filter: blur(6px);
}

.sheet {
  position: relative;
  width: 100%;
  max-width: 580px;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-bottom: 0;
  border-radius: 24px 24px 0 0;
  padding: 14px 28px 36px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.45);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--red), var(--orange), var(--yellow), var(--green));
  }

  &__handle {
    display: block;
    width: 44px;
    height: 5px;
    border-radius: 5px;
    background: var(--border);
    margin: 0 auto 22px;
  }

  &__burst {
    position: absolute;
    left: 50%;
    top: 90px;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 2;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 18px;
  }

  &__status { max-width: 460px; }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin: 0 0 6px;
  }

  &__text {
    color: var(--text-muted);
    font-size: .92rem;
    margin: 0;
    max-width: 460px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 6px;

    &--column { flex-direction: column; align-items: center; width: 100%; }
  }
}

.state-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: grid;
  place-items: center;

  &--done { background: var(--green); box-shadow: 0 0 0 10px rgba(141, 255, 85, .12), 0 0 50px rgba(141, 255, 85, .45); }
  &--error { background: var(--red); box-shadow: 0 0 0 10px rgba(255, 75, 75, .12), 0 0 50px rgba(255, 75, 75, .45); }
}

.download-btn { min-width: 280px; font-size: 1.1rem; padding: 18px 36px; }

.expire {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: .75rem;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 14px;
}

@media (min-width: 600px) {
  .sheet-root { padding: 0 16px; }
}

@media (max-width: 480px) {
  .sheet { padding: 12px 18px 28px; }
  .download-btn { min-width: 0; width: 100%; }
}
</style>
