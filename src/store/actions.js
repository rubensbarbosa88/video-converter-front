/* eslint-disable no-console */
import api from '@/api'

export default {
  async upload ({ commit }, payload) {
    try {
      const response = await api.upload(payload)
      return response.data
    } catch (err) {
      let errorMessage = 'Erro ao realizar upload do vídeo'
      if (err?.response?.status === 413) {
        errorMessage = err?.response?.data?.message || 'O arquivo excede o limite máximo permitido de 100MB.'
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }
      console.error('Erro na ação de upload:', errorMessage)
      throw new Error(errorMessage)
    }
  },
  async getVideo ({ commit }, payload) {
    try {
      const response = await api.getVideo(payload)
      return response.data
    } catch (err) {
      let errorMessage = 'Erro ao baixar o vídeo'
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          if (json.message) {
            errorMessage = json.message
          } else if (err?.response?.status === 404) {
            errorMessage = 'Vídeo não encontrado ou expirado.'
          }
        } catch (_) {
          if (err?.response?.status === 404) {
            errorMessage = 'Vídeo não encontrado ou expirado.'
          }
        }
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.response?.status === 404) {
        errorMessage = 'Vídeo não encontrado ou expirado.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      console.error('Erro na ação getVideo:', errorMessage)
      throw new Error(errorMessage)
    }
  }
}
