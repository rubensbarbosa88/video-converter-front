<template>
  <div>
    <v-overlay
      absolute
      color="white"
      opacity="0.8"
      :value="uploadPercent || wsProgress">

      <div class="d-flex flex-column justify-center">
        <div class="d-flex align-center justify-center">
          <v-progress-circular
            :value="uploadPercent"
            :rotate="-180"
            size="300"
            width="15"
            color="teal">
            <div class="text-center">
              <span class="black--text d-block title font-weight-light"> Upload </span>
              <span class="d-block display-1 font-weight-bold mt-1"> {{ uploadPercent }}% </span>
            </div>
          </v-progress-circular>

          <div style="width:10%">
            <v-progress-linear
              :value="uploadPercent"
              buffer-value="0"
              color="teal"
              height="20"
              stream />
          </div>

          <v-progress-circular
            :style="wsProgress || uploadPercent === 100? 'opacity:1':'opacity:0.3'"
            :value="wsProgress"
            :rotate="-180"
            size="300"
            width="15"
            color="teal">
            <div
              :style="wsProgress || uploadPercent === 100 ? 'opacity:1':'opacity:0.3'"
              class="text-center">
              <span class="black--text d-block title font-weight-light"> Convertendo para avi </span>
              <span class="d-block display-1 font-weight-bold mt-1"> {{ wsProgress }}% </span>
            </div>
          </v-progress-circular>
        </div>
        <h1
          class="display-2 text-center black--text mt-12 font-weight-light"
          v-html="textProgress">
        </h1>
      </div>
    </v-overlay>
    <h1> Conversor de vídeos </h1>

    <v-form>
      <v-file-input
        v-model="video"
        show-size
        label="Selecione o arquivo"
      />

      <v-btn
        rounded
        height="35"
        color="primary"
        class="body-2 white--text"
        @click="uploadVideo">
        Converter
      </v-btn>
    </v-form>
  </div>
</template>

<script>

export default {
  name: 'Home',
  data: () => ({
    video: null,
    videoUploaded: null,
    uploadPercent: 0,
    downloadPercent: 0,
    wsMessage: null,
    wsProgress: 0,
    connection: null,
    videoConverted: null
  }),
  computed: {
    textProgress () {
      if (this.uploadPercent && this.uploadPercent !== 100) {
        return 'Upload'
      } else if (this.wsMessage) {
        return this.wsMessage
      }

      return 'Processando'
    }
  },
  methods: {
    uploadVideo () {
      if (this.uploadPercent === 100) {
        this.uploadPercent = 0
        setTimeout(this.submitForm, 500)
      } else {
        this.submitForm()
      }
    },
    async submitForm () {
      try {
        const formData = new FormData()
        formData.append('video', this.video)

        const data = await this.$store.dispatch('upload', { data: formData, progress: this.uploadProgress })
        this.uploadPercent = 100

        this.connection.send(data.video)
        return data
      } catch (error) {
        this.uploadPercent = 0
      }
    },
    convertBinaryFile (binaryData) {
      const fileName = this.videoConverted.split(/_(.+)/)[1]
      const url = window.URL.createObjectURL(new Blob([binaryData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      this.downloadPercent = 100
    },
    async downloadVideo () {
      try {
        const data = await this.$store.dispatch('getVideo', { data: this.videoConverted, progress: this.downloadProgress })
        this.convertBinaryFile(data)
      } catch (error) {
        console.log('ERRO >>>', error)
      }
    },
    handleWsMessage (data) {
      switch (data.type) {
        case 'message':
          this.wsMessage = data.message
          break
        case 'progress':
          this.wsProgress = data.message
          break
        case 'data':
          this.videoConverted = data.message
          break
        case 'error':
          console.log(data.message)
          break
        default:
          this.wsMessage = data.message
      }
    },
    uploadProgress (event) {
      const progress = Math.round((event.loaded * 100) / event.total)
      this.uploadPercent = progress === 100 ? 99 : progress
    },
    downloadProgress (event) {
      const progress = Math.round((event.loaded * 100) / event.total)
      this.downloadPercent = progress === 100 ? 99 : progress
    },
    websocketConnection () {
      this.connection = new WebSocket('ws://localhost:3000/getVideoConverted')

      this.connection.onmessage = event => {
        const data = JSON.parse(event.data)
        this.handleWsMessage(data)
      }
    }
  },
  created () {
    this.websocketConnection()
  }
}
</script>
<style lang="styl">
  .v-overlay__content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .linear-loading {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
</style>
