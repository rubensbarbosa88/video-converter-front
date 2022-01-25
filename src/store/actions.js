import api from '@/api'

export default {
  async upload ({ commit }, payload) {
    try {
      const response = await api.upload(payload)
      return response.data
    } catch (err) {
      console.log(err)
    }
  },
  async getVideo ({ commit }, payload) {
    try {
      const response = await api.getVideo(payload)
      return response.data
    } catch (err) {
      console.log(err)
    }
  }
}
