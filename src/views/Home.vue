<template>
  <div>

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
        color="green"
        class="body-2 white--text"
        @click="uploadVideo">
        Upload
      </v-btn>

      <v-btn
        rounded
        height="35"
        color="primary"
        class="body-2 white--text"
        @click="convertVideo">
        Converter
      </v-btn>
      <v-btn
        rounded
        height="35"
        color="purple"
        class="body-2 white--text"
        @click="downloadVideo">
        Baixar
      </v-btn>
    </v-form>

    <v-progress-circular
      :rotate="-90"
      :size="100"
      :width="15"
      :value="uploadPercent"
      color="teal">
      {{ uploadPercent }}%
    </v-progress-circular>

    &nbsp;&nbsp; -- > &nbsp;&nbsp;

    <v-progress-circular
      :indeterminate="initDownload"
      :rotate="-90"
      :size="100"
      :width="15"
      :value="wsMessage"
      color="primary">
      {{ percent }}
    </v-progress-circular>

    &nbsp;&nbsp; -- > &nbsp;&nbsp;

    <v-progress-circular
      :rotate="-90"
      :size="100"
      :width="15"
      :value="downloadPercent"
      color="purple"
    >
      {{ downloadPercent }}%
    </v-progress-circular>
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
    wsMessage: 0,
    connection: null
  }),
  computed: {
    initDownload () {
      if (typeof this.wsMessage !== 'object') {
        const percent = Number(this.wsMessage)

        return isNaN(percent)
      }

      return false
    },
    percent () {
      if (typeof this.wsMessage !== 'object') {
        if (this.initDownload) {
          return this.wsMessage
        } else {
          return `${this.wsMessage || 0}%`
        }
      }

      return '100%'
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

        this.videoUploaded = data.video
      } catch (error) {
        this.uploadPercent = 0
      }
    },
    convertVideo () {
      this.connection.send(this.videoUploaded)
    },
    convertBinaryFile (binaryData) {
      const fileName = this.wsMessage.video.split('_')[1]
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
        const data = await this.$store.dispatch('getVideo', { data: this.videoUploaded, progress: this.downloadProgress })
        this.convertBinaryFile(data)
      } catch (error) {
        console.log('ERRO >>>', error)
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
        this.wsMessage = JSON.parse(event.data)
      }
    }
  },
  created () {
    this.websocketConnection()
  }
}
</script>
