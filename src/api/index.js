import Vue from 'vue'
import path from './paths'

export default {
  upload (payload = {}) {
    const options = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: payload.progress
    }
    return Vue.$http.post(path.upload, payload.data, options)
  },
  getVideo (payload) {
    return Vue.$http.get(path.download(payload))
  }
}
