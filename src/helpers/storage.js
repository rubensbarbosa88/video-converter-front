/* eslint-disable no-console */
import { STORAGE_KEY } from './constants'

export function saveConversionState (data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Não foi possível salvar no localStorage:', err)
  }
}

export function getSavedConversionState () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved && saved.videoConverted && saved.expiresAt) {
      if (Date.now() < saved.expiresAt) {
        return saved
      }
      clearSavedConversionState()
    }
    return null
  } catch (err) {
    console.warn('Falha ao restaurar dados do localStorage:', err)
    clearSavedConversionState()
    return null
  }
}

export function clearSavedConversionState () {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (_) {}
}
