<template>
  <v-card elevation="3" class="pa-6 rounded-lg">
    <v-card-title class="headline font-weight-bold primary--text pb-2">
      <v-icon left color="primary" size="32">mdi-video-switch</v-icon>
      Conversor de Vídeos
    </v-card-title>
    <v-card-subtitle class="body-1 pb-4">
      Selecione um arquivo de vídeo e escolha o formato desejado para a conversão.
    </v-card-subtitle>

    <v-divider class="mb-6"></v-divider>

    <v-form ref="form" @submit.prevent="handleSubmit">
      <v-file-input
        v-model="video"
        accept="video/*"
        show-size
        outlined
        dense
        prepend-icon="mdi-video"
        label="Selecione o arquivo de vídeo"
        placeholder="Clique para procurar o arquivo..."
        :rules="fileRules"
        clearable
      />

      <v-select
        v-model="selectedFormat"
        :items="formatOptions"
        item-text="text"
        item-value="value"
        outlined
        dense
        prepend-icon="mdi-format-list-bulleted-type"
        label="Formato de saída desejado"
        placeholder="Escolha o formato de saída..."
        :rules="[v => !!v || 'Por favor, selecione o formato de saída']"
      />

      <v-card-actions class="px-0 pt-4">
        <v-btn
          type="submit"
          rounded
          large
          color="primary"
          class="px-8 font-weight-bold white--text"
          :disabled="!isFormValid || disabled">
          <v-icon left>mdi-play-circle-outline</v-icon>
          Converter
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { MAX_FILE_SIZE, OUTPUT_FORMATS } from '@/helpers/constants'

export default {
  name: 'ConversionForm',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    video: null,
    selectedFormat: 'mp4',
    formatOptions: OUTPUT_FORMATS
  }),
  computed: {
    isFormValid () {
      return !!this.video && !!this.selectedFormat && (!this.video.size || this.video.size <= MAX_FILE_SIZE)
    },
    fileRules () {
      return [
        v => !!v || 'Por favor, selecione um arquivo de vídeo',
        v => !v || v.size <= MAX_FILE_SIZE || 'O arquivo excede o limite máximo permitido de 200MB.'
      ]
    }
  },
  methods: {
    handleSubmit () {
      if (!this.video) {
        this.$emit('error', 'Selecione um arquivo de vídeo primeiro')
        return
      }

      if (this.video.size > MAX_FILE_SIZE) {
        this.$emit('error', 'O arquivo excede o limite máximo permitido de 200MB.')
        return
      }

      if (!this.selectedFormat) {
        this.$emit('error', 'Selecione o formato de saída desejado')
        return
      }

      this.$emit('submit', {
        file: this.video,
        format: this.selectedFormat
      })
    },
    reset () {
      this.video = null
      if (this.$refs.form) {
        this.$refs.form.resetValidation()
      }
    }
  }
}
</script>
