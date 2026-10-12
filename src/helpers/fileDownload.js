import { MIME_TYPES } from './constants'

export function triggerFileDownload (binaryData, rawName, format = 'mp4') {
  const targetExt = (format || 'mp4').toLowerCase()
  let fileName = `video_convertido.${targetExt}`

  if (rawName) {
    fileName = rawName.includes('_')
      ? rawName.split(/_(.+)/)[1]
      : rawName
  }

  const mimeType = MIME_TYPES[targetExt] || 'application/octet-stream'
  const blob = new Blob([binaryData], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 1000)

  return fileName
}
