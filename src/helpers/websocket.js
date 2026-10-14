/* eslint-disable no-console */
export class WebSocketClient {
  constructor ({ url, onMessage, onProgress, onData, onError, onDisconnect }) {
    let resolvedUrl = url || process.env.VUE_APP_WS_URL || 'ws://localhost:3000/getVideoConverted'
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && resolvedUrl.startsWith('ws://')) {
      resolvedUrl = resolvedUrl.replace(/^ws:\/\//i, 'wss://')
    }
    this.url = resolvedUrl
    this.callbacks = { onMessage, onProgress, onData, onError, onDisconnect }
    this.connection = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.isConverting = false
  }

  setConverting (status) {
    this.isConverting = status
  }

  connect () {
    try {
      this.close()
      this.connection = new WebSocket(this.url)

      this.connection.onopen = () => {
        this.reconnectAttempts = 0
      }

      this.connection.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (e) {
          console.error('Falha ao parsear mensagem do WebSocket:', e)
        }
      }

      this.connection.onerror = error => {
        console.error('WebSocket error:', error)
        this.handleDisconnect()
      }

      this.connection.onclose = () => {
        this.handleDisconnect()
      }
    } catch (err) {
      console.error('Erro ao conectar ao WebSocket:', err)
    }
  }

  handleMessage (data) {
    switch (data.type) {
      case 'message':
        if (this.callbacks.onMessage) this.callbacks.onMessage(data.message)
        break
      case 'progress':
        if (this.callbacks.onProgress) this.callbacks.onProgress(Number(data.message) || 0)
        break
      case 'data':
        if (this.callbacks.onData) this.callbacks.onData(data.message)
        break
      case 'error':
        if (this.callbacks.onError) this.callbacks.onError(data.message || 'Erro na conversão do vídeo')
        break
      default:
        if (this.callbacks.onMessage) this.callbacks.onMessage(data.message)
    }
  }

  handleDisconnect () {
    if (!this.isConverting) return

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(`Conexão instável. Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      }
      setTimeout(() => {
        if (this.isConverting) {
          this.connect()
        }
      }, 2000)
    } else if (this.callbacks.onDisconnect) {
      this.callbacks.onDisconnect('A conexão com o servidor foi interrompida durante a conversão. Por favor, tente novamente.')
    }
  }

  send (payload) {
    return new Promise((resolve, reject) => {
      if (!this.connection || this.connection.readyState === WebSocket.CLOSED) {
        this.connect()
      }

      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)

      if (this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(raw)
        resolve()
        return
      }

      if (this.connection.readyState === WebSocket.CONNECTING) {
        const onOpen = () => {
          this.connection.removeEventListener('open', onOpen)
          this.connection.send(raw)
          resolve()
        }
        this.connection.addEventListener('open', onOpen)
        return
      }

      reject(new Error('Não foi possível estabelecer conexão WebSocket com o servidor.'))
    })
  }

  close () {
    if (this.connection) {
      try {
        this.connection.onclose = null
        this.connection.onerror = null
        this.connection.close()
      } catch (_) {}
      this.connection = null
    }
  }
}
