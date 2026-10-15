<template>
  <div class="home-container py-6">
    <conversion-overlay
      :show="status !== 'idle'"
      :status="status"
      :upload-percent="uploadPercent"
      :conversion-percent="wsProgress"
      :status-message="wsMessage"
      :error-message="errorMessage"
      :selected-format="selectedFormat"
      :remaining-seconds="remainingSeconds"
      :is-downloading="isDownloading"
      @download="handleDownload"
      @reset="handleReset"
      @retry="handleReset"
    />

    <div ref="hero" class="home-grid">
      <section class="hero">
        <span data-intro class="hero__eyebrow font-mono">
          <i class="live-dot" /> conversor online · grátis
        </span>
        <h1 class="hero__title font-display">
          <span data-split>Converta qualquer</span>
          <span class="hero__accent">vídeo.</span>
        </h1>
        <p data-intro class="hero__text">
          Solte o arquivo, escolha o formato e acompanhe o upload e a conversão
          em tempo real. Seu arquivo fica disponível por 15 minutos.
        </p>
        <ul data-intro class="hero__stats font-mono">
          <li><strong>9</strong> formatos</li>
          <li><strong>100MB</strong> por arquivo</li>
          <li><strong>15min</strong> de link válido</li>
        </ul>
      </section>

      <conversion-form
        ref="conversionForm"
        :disabled="status !== 'idle'"
        @submit="handleFormSubmit"
        @error="notify($event, 'error')"
      />
    </div>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="4000"
      top
      right
    >
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false"> Fechar </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
/* eslint-disable no-console */
import ConversionForm from '@/components/ConversionForm.vue'
import ConversionOverlay from '@/components/ConversionOverlay.vue'
import { EXPIRATION_TIME_MS } from '@/helpers/constants'
import {
  saveConversionState,
  getSavedConversionState,
  clearSavedConversionState
} from '@/helpers/storage'
import { triggerFileDownload } from '@/helpers/fileDownload'
import { startExpirationTimer } from '@/helpers/timeFormat'
import { WebSocketClient } from '@/helpers/websocket'
import { animate, splitText, stagger, spring } from 'animejs'
import { introTimeline, prefersReducedMotion } from '@/helpers/animations'

export default {
  name: 'Home',
  components: {
    ConversionForm,
    ConversionOverlay
  },
  data: () => ({
    status: 'idle', // 'idle' | 'uploading' | 'converting' | 'done' | 'error'
    uploadPercent: 0,
    wsProgress: 0,
    wsMessage: '',
    errorMessage: '',
    videoUploaded: null,
    videoConverted: null,
    selectedFormat: 'mp4',
    isDownloading: false,
    expiresAt: null,
    remainingSeconds: 0,
    expirationTimer: null,
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'info'
  }),
  methods: {
    notify (text, color = 'info') {
      this.snackbarText = text
      this.snackbarColor = color
      this.snackbar = true
    },
    initWebSocket () {
      this.wsClient = new WebSocketClient({
        onMessage: (msg) => {
          this.wsMessage = msg
        },
        onProgress: (percent) => {
          this.status = 'converting'
          this.wsProgress = Math.min(100, Math.max(0, Math.round(percent)))
        },
        onData: (convertedFilename) => {
          this.videoConverted = convertedFilename
          this.wsProgress = 100
          this.status = 'done'
          this.wsMessage = 'Conversão concluída!'
          this.expiresAt = Date.now() + EXPIRATION_TIME_MS
          saveConversionState({
            videoConverted: this.videoConverted,
            selectedFormat: this.selectedFormat,
            expiresAt: this.expiresAt
          })
          this.startCountdown()
        },
        onError: (errMsg) => {
          this.status = 'error'
          this.errorMessage = errMsg
          this.notify(errMsg, 'error')
        },
        onDisconnect: (disconnectMsg) => {
          this.status = 'error'
          this.errorMessage = disconnectMsg
          this.notify(disconnectMsg, 'error')
        }
      })
      this.wsClient.connect()
    },
    startCountdown () {
      if (this.expirationTimer) clearInterval(this.expirationTimer)
      this.expirationTimer = startExpirationTimer(
        () => this.expiresAt,
        (diff) => {
          this.remainingSeconds = diff
        },
        () => {
          if (this.expirationTimer) clearInterval(this.expirationTimer)
          this.expirationTimer = null
          clearSavedConversionState()
          if (this.status === 'done') {
            this.status = 'error'
            this.errorMessage =
              'O prazo de 15 minutos para download do arquivo expirou no servidor.'
            this.notify(this.errorMessage, 'warning')
          }
        }
      )
    },
    restoreSavedState () {
      const saved = getSavedConversionState()
      if (saved) {
        this.videoConverted = saved.videoConverted
        this.selectedFormat = saved.selectedFormat || 'mp4'
        this.expiresAt = saved.expiresAt
        this.uploadPercent = 100
        this.wsProgress = 100
        this.status = 'done'
        this.wsMessage = 'Conversão concluída!'
        this.startCountdown()
        const mins = Math.max(
          1,
          Math.ceil((saved.expiresAt - Date.now()) / 60000)
        )
        this.notify(
          `Conversão anterior recuperada! Disponível por mais aprox. ${mins} min.`,
          'info'
        )
      }
    },
    handleReset () {
      clearSavedConversionState()
      if (this.expirationTimer) {
        clearInterval(this.expirationTimer)
        this.expirationTimer = null
      }
      this.expiresAt = null
      this.remainingSeconds = 0
      this.status = 'idle'
      this.uploadPercent = 0
      this.wsProgress = 0
      this.wsMessage = ''
      this.videoConverted = null
      this.videoUploaded = null
      this.errorMessage = ''
      this.isDownloading = false
      if (this.$refs.conversionForm) {
        this.$refs.conversionForm.reset()
      }
    },
    async handleFormSubmit ({ file, format }) {
      this.handleReset()
      this.selectedFormat = format
      this.status = 'uploading'
      this.wsClient.setConverting(true)

      try {
        const formData = new FormData()
        formData.append('video', file)

        const responseData = await this.$store.dispatch('upload', {
          data: formData,
          progress: (event) => {
            if (event.total) {
              const p = Math.round((event.loaded * 100) / event.total)
              this.uploadPercent = p >= 100 ? 99 : p
            }
          }
        })

        if (!responseData || !responseData.video) {
          throw new Error('Servidor não retornou o identificador do vídeo.')
        }

        this.uploadPercent = 100
        this.videoUploaded = responseData.video
        this.status = 'converting'
        this.wsMessage = 'Iniciando processamento...'

        await this.wsClient.send({
          video: this.videoUploaded,
          format: this.selectedFormat
        })
      } catch (err) {
        this.status = 'error'
        this.errorMessage = err.message || 'Falha ao enviar arquivo'
        this.notify(this.errorMessage, 'error')
      }
    },
    async handleDownload () {
      if (!this.videoConverted) {
        this.notify('Nenhum vídeo disponível para download.', 'warning')
        return
      }

      this.isDownloading = true
      try {
        const data = await this.$store.dispatch('getVideo', {
          data: this.videoConverted
        })
        triggerFileDownload(data, this.videoConverted, this.selectedFormat)
        this.notify('Download concluído com sucesso!', 'success')
      } catch (err) {
        const msg = err.message || 'Erro ao baixar o vídeo.'
        this.notify(msg, 'error')
        if (msg.includes('expirado') || msg.includes('não encontrado')) {
          clearSavedConversionState()
          this.status = 'error'
          this.errorMessage = msg
        }
      } finally {
        this.isDownloading = false
      }
    }
  },
  created () {
    this.initWebSocket()
    this.restoreSavedState()
  },
  mounted () {
    // Animações puramente visuais (não interferem na lógica)
    this.intro = introTimeline(this.$refs.hero)
    const accent = this.$el.querySelector('.hero__accent')
    if (accent && !prefersReducedMotion()) {
      this.accentSplit = splitText(accent, { chars: true })
      const chars = this.accentSplit.chars
      animate(chars, {
        y: { from: -120 },
        opacity: { from: 0 },
        rotate: { from: -30 },
        ease: spring({ bounce: 0.55, duration: 1100 }),
        delay: stagger(70, { start: 650 })
      })
      this.onAccentEnter = () =>
        animate(chars, {
          y: [0, -22, 0],
          scale: [1, 1.15, 1],
          duration: 650,
          ease: 'outElastic(1, .5)',
          delay: stagger(45)
        })
      accent.addEventListener('mouseenter', this.onAccentEnter)
      this.accentEl = accent
    }
  },
  beforeDestroy () {
    if (this.intro) this.intro.revert()
    if (this.accentEl) {
      this.accentEl.removeEventListener('mouseenter', this.onAccentEnter)
    }
    if (this.accentSplit) this.accentSplit.revert()
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer)
    }
    if (this.wsClient) {
      this.wsClient.close()
    }
  }
}
</script>

<style lang="scss" scoped>
.home-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 56px;
  align-items: center;
  min-height: calc(100vh - 140px);
  padding: 32px 0 48px;
}

.hero {
  &__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 14px;
    background: var(--surface);
  }

  &__title {
    font-size: clamp(2.6rem, 6vw, 4.6rem);
    font-weight: 700;
    line-height: 1.02;
    letter-spacing: -0.04em;
    margin: 22px 0 18px;

    > span {
      display: block;
    }
  }

  &__accent {
    cursor: default;
    display: inline-block !important;
    padding-bottom: 0.08em;
  }

  &__text {
    color: var(--text-muted);
    font-size: 1.05rem;
    line-height: 1.6;
    max-width: 440px;
    margin: 0 0 28px;
  }

  &__stats {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    li {
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 10px;
      background: var(--surface);
      border: 1px solid var(--border);
    }

    li:nth-child(1) strong {
      color: var(--red);
    }
    li:nth-child(2) strong {
      color: var(--yellow);
    }
    li:nth-child(3) strong {
      color: var(--green);
    }
  }
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 0 rgba(141, 255, 85, 0.6);
  animation: live 1.8s infinite;
}

@keyframes live {
  0% {
    box-shadow: 0 0 0 0 rgba(141, 255, 85, 0.6);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(141, 255, 85, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(141, 255, 85, 0);
  }
}

@media (max-width: 960px) {
  .home-grid {
    grid-template-columns: 1fr;
    gap: 32px;
    min-height: 0;
    padding-top: 16px;
  }
}
</style>
