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

    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <conversion-form
          ref="conversionForm"
          :disabled="status !== 'idle'"
          @submit="handleFormSubmit"
          @error="notify($event, 'error')"
        />
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="4000"
      top
      right>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">
          Fechar
        </v-btn>
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
        onMessage: msg => { this.wsMessage = msg },
        onProgress: percent => {
          this.status = 'converting'
          this.wsProgress = Math.min(100, Math.max(0, Math.round(percent)))
        },
        onData: convertedFilename => {
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
        onError: errMsg => {
          this.status = 'error'
          this.errorMessage = errMsg
          this.notify(errMsg, 'error')
        },
        onDisconnect: disconnectMsg => {
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
        diff => { this.remainingSeconds = diff },
        () => {
          if (this.expirationTimer) clearInterval(this.expirationTimer)
          this.expirationTimer = null
          clearSavedConversionState()
          if (this.status === 'done') {
            this.status = 'error'
            this.errorMessage = 'O prazo de 30 minutos para download do arquivo expirou no servidor.'
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
        const mins = Math.max(1, Math.ceil((saved.expiresAt - Date.now()) / 60000))
        this.notify(`Conversão anterior recuperada! Disponível por mais aprox. ${mins} min.`, 'info')
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
          progress: event => {
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
  beforeDestroy () {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer)
    }
    if (this.wsClient) {
      this.wsClient.close()
    }
  }
}
</script>
