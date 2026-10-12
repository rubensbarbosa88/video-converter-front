<template>
  <v-overlay
    :value="show"
    color="white"
    opacity="0.95"
    z-index="100">
    <div class="d-flex flex-column align-center justify-center text-center px-4 overlay-box">
      <!-- Estado de Erro -->
      <template v-if="status === 'error'">
        <v-icon color="red darken-1" size="80" class="mb-4">
          mdi-alert-circle-outline
        </v-icon>
        <h2 class="display-1 red--text text--darken-1 mb-2 font-weight-medium">
          Falha no Processamento
        </h2>
        <p class="body-1 grey--text text--darken-2 mb-6" style="max-width: 500px;">
          {{ errorMessage }}
        </p>
        <v-btn
          color="primary"
          rounded
          large
          elevation="2"
          @click="$emit('retry')">
          Tentar Novamente
        </v-btn>
      </template>

      <!-- Estado de Progresso ou Conclusão -->
      <template v-else>
        <conversion-progress
          :upload-percent="uploadPercent"
          :conversion-percent="conversionPercent"
          :status="status"
          :format-title="formatTitle"
          class="mb-6"
        />

        <!-- Mensagem de Status -->
        <div class="status-text my-4">
          <h2 class="headline font-weight-medium black--text mb-1" v-html="textProgress"></h2>
          <p v-if="status === 'converting'" class="caption grey--text text--darken-1">
            O vídeo está sendo transcodificado com FFmpeg no servidor.
          </p>
        </div>

        <!-- Ações pós-conversão -->
        <div v-if="status === 'done'" class="d-flex flex-column align-center mt-4">
          <div v-if="timeRemainingText" class="caption grey--text text--darken-2 mb-3 d-flex align-center">
            <v-icon x-small color="grey darken-2" class="mr-1">mdi-clock-outline</v-icon>
            <span>{{ timeRemainingText }}</span>
          </div>

          <v-btn
            class="headline font-weight-medium white--text px-8 py-6 mb-3"
            rounded
            elevation="4"
            color="teal darken-1"
            :loading="isDownloading"
            @click="$emit('download')">
            <v-icon left size="28">mdi-download</v-icon>
            Baixar Arquivo ({{ displayFormat }})
          </v-btn>

          <v-btn
            text
            rounded
            color="grey darken-2"
            class="subtitle-2"
            @click="$emit('reset')">
            Converter outro vídeo
          </v-btn>
        </div>
      </template>
    </div>
  </v-overlay>
</template>

<script>
import ConversionProgress from '@/components/ConversionProgress.vue'
import { formatRemainingTime } from '@/helpers/timeFormat'

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
  }
}
</script>

<style scoped>
.overlay-box {
  max-width: 650px;
  margin: 0 auto;
}
</style>
