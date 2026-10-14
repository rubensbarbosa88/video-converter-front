export const STORAGE_KEY = 'video_converter_last_conversion'
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const EXPIRATION_TIME_MS = 15 * 60 * 1000 // 15 minutos

export const OUTPUT_FORMATS = [
  { text: 'MP4 (.mp4) - Padrão universal (Recomendado)', value: 'mp4' },
  { text: 'AVI (.avi) - Audio Video Interleave', value: 'avi' },
  { text: 'MKV (.mkv) - Matroska Video', value: 'mkv' },
  { text: 'WEBM (.webm) - Otimizado para Web/HTML5', value: 'webm' },
  { text: 'MOV (.mov) - Apple QuickTime', value: 'mov' },
  { text: 'FLV (.flv) - Flash Video', value: 'flv' },
  { text: 'WMV (.wmv) - Windows Media Video', value: 'wmv' },
  { text: 'MP3 (.mp3) - Apenas Áudio (Extração)', value: 'mp3' },
  { text: 'GIF (.gif) - Animação GIF', value: 'gif' }
]

export const MIME_TYPES = {
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  mov: 'video/quicktime',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  mp3: 'audio/mpeg',
  gif: 'image/gif'
}
