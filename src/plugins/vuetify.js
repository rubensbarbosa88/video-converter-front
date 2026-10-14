import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

Vue.use(Vuetify)

// Paleta inspirada no anime.js (https://animejs.com)
export const ANIME_COLORS = {
  background: '#252423',
  surface: '#2C2A28',
  red: '#FF4B4B',
  orange: '#FFA828',
  yellow: '#FFCC2A',
  green: '#8DFF55',
  cyan: '#26F2D5'
}

export default new Vuetify({
  theme: {
    dark: true,
    options: { customProperties: true },
    themes: {
      dark: {
        primary: ANIME_COLORS.red,
        secondary: ANIME_COLORS.yellow,
        accent: ANIME_COLORS.orange,
        success: ANIME_COLORS.green,
        warning: ANIME_COLORS.yellow,
        error: ANIME_COLORS.red,
        info: ANIME_COLORS.cyan,
        background: ANIME_COLORS.background,
        surface: ANIME_COLORS.surface
      }
    }
  }
})
