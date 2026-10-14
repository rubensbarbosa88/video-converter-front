<template>
  <form ref="form" class="conv-form panel" novalidate @submit.prevent="handleSubmit">
    <!-- Dropzone -->
    <div data-intro class="field">
      <label class="field__label font-mono" for="video-input">01 · arquivo</label>
      <div
        ref="dropzone"
        id="dropzone"
        class="dropzone"
        :class="{ 'is-over': isDragging, 'has-file': !!video, 'is-disabled': disabled }"
        role="button"
        tabindex="0"
        :aria-disabled="disabled ? 'true' : 'false'"
        aria-label="Selecionar arquivo de vídeo"
        @click="openPicker"
        @keydown.enter.prevent="openPicker"
        @keydown.space.prevent="openPicker"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop">
        <input
          ref="input"
          id="video-input"
          type="file"
          accept="video/*"
          class="dropzone__input"
          :disabled="disabled"
          @change="onInputChange">

        <template v-if="!video">
          <span ref="dropIcon" class="dropzone__icon">
            <v-icon size="34" color="primary">mdi-tray-arrow-up</v-icon>
          </span>
          <p class="dropzone__title font-display">
            {{ isDragging ? 'Solte para enviar' : 'Arraste o vídeo ou clique para escolher' }}
          </p>
          <p class="dropzone__hint font-mono">mp4 · mov · mkv · avi · webm … — máx. 100MB</p>
        </template>

        <div v-else ref="fileInfo" class="file-info">
          <span class="file-info__icon"><v-icon color="success">mdi-filmstrip</v-icon></span>
          <div class="file-info__meta">
            <span class="file-info__name">{{ video.name }}</span>
            <span class="file-info__size font-mono">{{ fileSize }}</span>
          </div>
          <button
            id="clear-file-btn"
            type="button"
            class="file-info__clear"
            aria-label="Remover arquivo"
            :disabled="disabled"
            @click.stop="clearFile">
            <v-icon small>mdi-close</v-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Formatos -->
    <fieldset data-intro class="field">
      <legend class="field__label font-mono">02 · formato de saída</legend>
      <div class="formats" role="radiogroup" aria-label="Formato de saída">
        <button
          v-for="opt in formats"
          :id="`format-${opt.value}`"
          :key="opt.value"
          data-chip
          type="button"
          role="radio"
          class="format-chip"
          :class="{ 'is-active': selectedFormat === opt.value }"
          :aria-checked="selectedFormat === opt.value ? 'true' : 'false'"
          :disabled="disabled"
          @click="selectFormat(opt.value, $event)">
          <span class="format-chip__ext font-mono">.{{ opt.value }}</span>
          <span class="format-chip__desc">{{ opt.desc }}</span>
          <span v-if="opt.value === 'mp4'" class="format-chip__badge font-mono">top</span>
        </button>
      </div>
    </fieldset>

    <!-- CTA -->
    <div data-intro class="cta-row">
      <button
        ref="cta"
        id="convert-btn"
        type="submit"
        class="pill-btn pill-btn--red cta"
        :disabled="!isFormValid || disabled">
        <v-icon :color="(!isFormValid || disabled) ? undefined : '#252423'">mdi-play</v-icon>
        Converter para .{{ selectedFormat }}
      </button>
      <span class="cta-row__hint font-mono">{{ isFormValid ? 'pronto ✓' : 'selecione um vídeo' }}</span>
    </div>
  </form>
</template>

<script>
import { MAX_FILE_SIZE, OUTPUT_FORMATS } from '@/helpers/constants'
import { magnetic, pressBounce, popIn, pulse, shake } from '@/helpers/animations'

const SIZE_ERROR = 'O arquivo excede o limite máximo permitido de 100MB.'

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
    isDragging: false,
    dragDepth: 0
  }),
  computed: {
    formats () {
      return OUTPUT_FORMATS.map(f => {
        const desc = (f.text.split(' - ')[1] || '').replace(/\s*\(.*\)\s*/, '')
        return { value: f.value, desc }
      })
    },
    isFormValid () {
      return !!this.video && !!this.selectedFormat && (!this.video.size || this.video.size <= MAX_FILE_SIZE)
    },
    fileSize () {
      if (!this.video) return ''
      const mb = this.video.size / (1024 * 1024)
      return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(this.video.size / 1024).toFixed(0)} KB`
    }
  },
  watch: {
    isDragging (over) {
      if (over) {
        this.dropPulse = pulse(this.$refs.dropIcon, 1.25)
      } else if (this.dropPulse) {
        this.dropPulse.revert()
        this.dropPulse = null
      }
    }
  },
  mounted () {
    this.cleanupMagnetic = magnetic(this.$refs.cta, 0.25)
  },
  beforeDestroy () {
    if (this.cleanupMagnetic) this.cleanupMagnetic()
    if (this.dropPulse) this.dropPulse.revert()
  },
  methods: {
    openPicker () {
      if (this.disabled) return
      this.$refs.input.click()
    },
    onDragEnter () {
      if (this.disabled) return
      this.dragDepth++
      this.isDragging = true
    },
    onDragLeave () {
      this.dragDepth = Math.max(0, this.dragDepth - 1)
      if (this.dragDepth === 0) this.isDragging = false
    },
    onDrop (e) {
      this.dragDepth = 0
      this.isDragging = false
      if (this.disabled) return
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      this.setFile(file)
    },
    onInputChange (e) {
      this.setFile(e.target.files && e.target.files[0])
      e.target.value = ''
    },
    setFile (file) {
      if (!file) return
      if (file.type && !/^video\//.test(file.type)) {
        this.$emit('error', 'Por favor, selecione um arquivo de vídeo')
        shake(this.$refs.dropzone)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        this.$emit('error', SIZE_ERROR)
        shake(this.$refs.dropzone)
        return
      }
      this.video = file
      this.$nextTick(() => popIn(this.$refs.fileInfo))
    },
    clearFile () {
      this.video = null
      pressBounce(this.$refs.dropzone)
    },
    selectFormat (value, event) {
      this.selectedFormat = value
      pressBounce(event.currentTarget)
    },
    handleSubmit () {
      pressBounce(this.$refs.cta)

      if (!this.video) {
        this.$emit('error', 'Selecione um arquivo de vídeo primeiro')
        shake(this.$refs.dropzone)
        return
      }

      if (this.video.size > MAX_FILE_SIZE) {
        this.$emit('error', SIZE_ERROR)
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
      this.isDragging = false
      this.dragDepth = 0
    }
  }
}
</script>

<style lang="scss" scoped>
.conv-form {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.field {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;

  &__label {
    display: block;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 12px;
    padding: 0;
  }
}

.dropzone {
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 75, 75, 0.08), transparent 60%),
    var(--bg);
  cursor: pointer;
  transition: border-color .25s, background-color .25s, box-shadow .25s;

  &:hover, &:focus-visible {
    border-color: var(--red);
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 75, 75, 0.12);
  }

  &.is-over {
    border-color: var(--yellow);
    border-style: solid;
    box-shadow: 0 0 40px rgba(255, 204, 42, 0.2);
  }

  &.has-file {
    border-style: solid;
    border-color: rgba(141, 255, 85, 0.5);
    min-height: 0;
  }

  &.is-disabled { cursor: not-allowed; opacity: .6; }

  &__input { display: none; }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(255, 75, 75, 0.12);
    margin-bottom: 6px;
  }

  &__title { font-size: 1.05rem; font-weight: 500; margin: 0; }
  &__hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
}

.file-info {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;

  &__icon {
    flex: none;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(141, 255, 85, 0.12);
  }

  &__meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  &__name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__size { font-size: 0.8rem; color: var(--green); }

  &__clear {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--surface-2);
    display: grid;
    place-items: center;
    transition: background .2s;
    &:hover { background: var(--red); }
  }
}

.formats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.format-chip {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-2);
  border: 1px solid transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: background .2s, border-color .2s, box-shadow .25s, color .2s;
  will-change: transform;

  &:hover:not(:disabled) { border-color: var(--border); background: #43413e; }
  &:focus-visible { outline: 2px solid var(--yellow); outline-offset: 2px; }
  &:disabled { opacity: .5; cursor: not-allowed; }

  &__ext { font-size: 1rem; font-weight: 700; }
  &__desc { font-size: 0.72rem; color: var(--text-muted); line-height: 1.2; }

  &__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 0.6rem;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--green);
    color: var(--bg);
  }

  &.is-active {
    background: var(--red);
    color: var(--bg);
    box-shadow: 0 0 28px rgba(255, 75, 75, 0.4);
    .format-chip__desc { color: rgba(37, 36, 35, 0.75); }
  }
}

.cta-row {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;

  &__hint { font-size: 0.78rem; color: var(--text-muted); }
}

@media (max-width: 600px) {
  .conv-form { padding: 20px; }
  .formats { grid-template-columns: repeat(2, 1fr); }
  .cta { width: 100%; }
}
</style>
