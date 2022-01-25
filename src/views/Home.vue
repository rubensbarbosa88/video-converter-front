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
        @click="uploadVideo"
      >
        Upload
      </v-btn>

      <v-btn
        rounded
        height="35"
        color="primary"
        class="body-2 white--text"
        @click="convertVideo"
      >
        Converter
      </v-btn>
      <v-btn
        rounded
        height="35"
        color="purple"
        class="body-2 white--text"
        @click="downloadVideo"
      >
        Baixar
      </v-btn>
    </v-form>

    <v-progress-circular
      :rotate="-90"
      :size="100"
      :width="15"
      :value="uploadPercent"
      color="teal"
    >
      {{ uploadPercent }}%
    </v-progress-circular>
    &nbsp;&nbsp; -- > &nbsp;&nbsp;
    <v-progress-circular
      :indeterminate="initDownload"
      :rotate="-90"
      :size="100"
      :width="15"
      :value="convertPercent"
      color="primary"
    >
      {{ `${initDownload ? 'Processando' : `${convertPercent}%`}` }}
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
    convertPercent: 0,
    connection: null
  }),
  computed: {
    initDownload () {
      const percent = Number(this.convertPercent)
      return isNaN(percent)
    }
  },
  methods: {
    async uploadVideo () {
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
      this.connection.send('getFiles')
    },
    async downloadVideo () {
      try {
        const data = await this.$store.dispatch('getVideo', this.videoUploaded)
        console.log(data)
      } catch (error) {
        console.log('ERRO >>>', error)
      }
    },
    uploadProgress (event) {
      this.uploadPercent = 0
      const progress = Math.round((event.loaded * 100) / event.total)
      this.uploadPercent = progress === 100 ? 99 : progress
    },
    websocketConnection () {
      this.connection = new WebSocket('ws://localhost:3000/getVideoConverted')

      this.connection.onmessage = event => {
        this.convertPercent = event.data
      }

      this.connection.onopen = event => {
        console.log(event)
        console.log('Successfully connected to the echo websocket server...')
      }
    }
  },
  created () {
    this.websocketConnection()
  }
}
</script>
