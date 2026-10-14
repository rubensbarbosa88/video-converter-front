<template>
  <div class="progress" :class="`is-${stage}`">
    <!-- Stepper -->
    <ol class="stepper" data-sheet-item>
      <li class="step" :class="{ 'is-active': stage === 'upload', 'is-done': uploadDone }">
        <span class="step__dot">
          <v-icon v-if="uploadDone" ref="uploadCheck" x-small color="#252423">mdi-check-bold</v-icon>
          <span v-else class="font-mono">1</span>
        </span>
        <span class="step__label">
          <strong>Upload</strong>
          <span class="font-mono">{{ uploadPercent }}%</span>
        </span>
      </li>
      <li class="stepper__line" aria-hidden="true">
        <span class="stepper__fill" :style="{ transform: `scaleX(${lineFill})` }" />
      </li>
      <li class="step" :class="{ 'is-active': stage === 'convert', 'is-done': status === 'done' }">
        <span class="step__dot">
          <v-icon v-if="status === 'done'" ref="convertCheck" x-small color="#252423">mdi-check-bold</v-icon>
          <span v-else class="font-mono">2</span>
        </span>
        <span class="step__label">
          <strong>Conversão {{ formatTitle }}</strong>
          <span class="font-mono">{{ conversionPercent }}%</span>
        </span>
      </li>
    </ol>

    <!-- Anel principal -->
    <div class="ring" data-sheet-item>
      <svg class="ring__svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle class="ring__track" cx="100" cy="100" :r="radius" />
        <circle
          class="ring__bar"
          cx="100"
          cy="100"
          :r="radius"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset" />
      </svg>
      <div
        class="ring__center"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="activePercent"
        :aria-label="stage === 'upload' ? 'Progresso do upload' : 'Progresso da conversão'">
        <span class="ring__value font-mono">{{ displayValue }}<small>%</small></span>
        <span class="ring__caption font-mono">{{ caption }}</span>
      </div>
    </div>

    <!-- Equalizer durante conversão -->
    <div v-show="status === 'converting'" ref="eq" class="eq" aria-hidden="true">
      <span v-for="n in 14" :key="n" class="eq__bar" />
    </div>
  </div>
</template>

<script>
import { countUp, equalizer, popIn } from '@/helpers/animations'

const RADIUS = 86

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
  data: () => ({
    displayValue: 0,
    radius: RADIUS,
    circumference: 2 * Math.PI * RADIUS
  }),
  computed: {
    uploadDone () {
      return this.uploadPercent === 100
    },
    stage () {
      if (this.status === 'done') return 'done'
      if (this.status === 'converting' || this.uploadDone) return 'convert'
      return 'upload'
    },
    activePercent () {
      return this.stage === 'upload' ? this.uploadPercent : this.conversionPercent
    },
    lineFill () {
      if (!this.uploadDone) return 0
      return this.conversionPercent > 0 || this.status === 'done' ? 1 : 0.5
    },
    dashOffset () {
      return this.circumference * (1 - this.displayValue / 100)
    },
    caption () {
      if (this.stage === 'upload') return 'enviando'
      if (this.stage === 'done') return 'concluído'
      return 'convertendo'
    }
  },
  watch: {
    activePercent (val) {
      this.animateTo(val)
    },
    stage (val, old) {
      // Reinicia o anel ao trocar de etapa
      if (old === 'upload' && val === 'convert') {
        this.counter.value = 0
        this.displayValue = 0
        this.animateTo(this.activePercent)
      }
    },
    uploadDone (done) {
      if (done) this.$nextTick(() => popIn(this.refEl('uploadCheck')))
    },
    status (val) {
      if (val === 'done') this.$nextTick(() => popIn(this.refEl('convertCheck')))
      this.toggleEqualizer()
    }
  },
  created () {
    this.counter = { value: 0 }
  },
  mounted () {
    this.animateTo(this.activePercent)
    this.toggleEqualizer()
  },
  beforeDestroy () {
    if (this.counterAnim) this.counterAnim.pause()
    if (this.eqAnim) this.eqAnim.revert()
  },
  methods: {
    refEl (name) {
      const r = this.$refs[name]
      return r && (r.$el || r)
    },
    animateTo (val) {
      if (this.counterAnim) this.counterAnim.pause()
      this.counterAnim = countUp(this.counter, val, v => { this.displayValue = v })
    },
    toggleEqualizer () {
      if (this.status === 'converting' && !this.eqAnim) {
        this.$nextTick(() => {
          this.eqAnim = equalizer(this.$refs.eq.querySelectorAll('.eq__bar'))
        })
      } else if (this.status !== 'converting' && this.eqAnim) {
        this.eqAnim.revert()
        this.eqAnim = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.progress {
  --stage: var(--red);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;

  &.is-convert { --stage: var(--yellow); }
  &.is-done { --stage: var(--green); }
}

.stepper {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;

  &__line {
    flex: 1;
    height: 4px;
    border-radius: 4px;
    background: var(--surface-2);
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--green), var(--yellow));
    transform-origin: left center;
    transition: transform .8s cubic-bezier(.34, 1.56, .64, 1);
  }
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: .5;
  transition: opacity .3s;

  &__dot {
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: .8rem;
    background: var(--surface-2);
    color: var(--text);
    transition: background .3s, box-shadow .3s;
  }

  &__label {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    font-size: .85rem;
    span { color: var(--text-muted); font-size: .75rem; }
  }

  &.is-active {
    opacity: 1;
    .step__dot { background: var(--stage); color: var(--bg); box-shadow: 0 0 0 6px rgba(255, 255, 255, .06), 0 0 20px var(--stage); }
  }

  &.is-done {
    opacity: 1;
    .step__dot { background: var(--green); }
  }
}

.ring {
  position: relative;
  width: 220px;
  height: 220px;

  &__svg { width: 100%; height: 100%; transform: rotate(-90deg); }

  &__track {
    fill: none;
    stroke: var(--surface-2);
    stroke-width: 12;
  }

  &__bar {
    fill: none;
    stroke: var(--stage);
    stroke-width: 12;
    stroke-linecap: round;
    filter: drop-shadow(0 0 10px var(--stage));
    transition: stroke .4s;
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__value {
    font-size: 3.4rem;
    font-weight: 700;
    line-height: 1;
    color: var(--text);
    small { font-size: 1.2rem; color: var(--stage); margin-left: 2px; }
  }

  &__caption {
    margin-top: 6px;
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: var(--stage);
  }
}

.eq {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 32px;

  &__bar {
    width: 6px;
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(to top, var(--red), var(--yellow));
    transform-origin: bottom center;
    transform: scaleY(.3);
  }
}

@media (max-width: 480px) {
  .step__label strong { font-size: .78rem; }
  .ring { width: 180px; height: 180px; }
  .ring__value { font-size: 2.8rem; }
}
</style>
