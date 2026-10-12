<template>
  <div class="d-flex align-center justify-center flex-wrap progress-wrapper">
    <!-- Etapa 1: Upload -->
    <div class="d-flex flex-column align-center mx-4 my-2">
      <v-progress-circular
        :value="uploadPercent"
        :rotate="-90"
        size="160"
        width="12"
        :color="uploadPercent === 100 ? 'teal' : 'primary'">
        <div class="text-center">
          <v-icon v-if="uploadPercent === 100" color="teal" size="36">
            mdi-check
          </v-icon>
          <span class="d-block title font-weight-light black--text">
            Upload
          </span>
          <span class="d-block headline font-weight-bold black--text">
            {{ uploadPercent }}%
          </span>
        </div>
      </v-progress-circular>
    </div>

    <!-- Divisor / Linha conectora -->
    <div class="connector-line mx-2 d-none d-sm-block">
      <v-progress-linear
        :value="uploadPercent === 100 ? (conversionPercent > 0 ? 100 : 50) : 0"
        :color="uploadPercent === 100 ? 'teal' : 'primary'"
        height="6"
        rounded
      />
    </div>

    <!-- Etapa 2: Conversão -->
    <div class="d-flex flex-column align-center mx-4 my-2">
      <v-progress-circular
        :style="isConvertingOrDone ? 'opacity: 1' : 'opacity: 0.35'"
        :value="conversionPercent"
        :rotate="-90"
        size="160"
        width="12"
        :color="status === 'done' ? 'teal' : 'deep-purple accent-4'">
        <div class="text-center">
          <v-icon v-if="status === 'done'" color="teal" size="36">
            mdi-check-all
          </v-icon>
          <span class="d-block title font-weight-light black--text">
            Conversão {{ formatTitle }}
          </span>
          <span class="d-block headline font-weight-bold black--text">
            {{ conversionPercent }}%
          </span>
        </div>
      </v-progress-circular>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConversionProgress',
  props: {
    uploadPercent: {
      type: Number,
      default: 0
    },
    conversionPercent: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: 'idle'
    },
    formatTitle: {
      type: String,
      default: 'VÍDEO'
    }
  },
  computed: {
    isConvertingOrDone () {
      return this.status === 'converting' || this.status === 'done'
    }
  }
}
</script>

<style scoped>
.connector-line {
  width: 80px;
}

.progress-wrapper {
  gap: 12px;
}
</style>
