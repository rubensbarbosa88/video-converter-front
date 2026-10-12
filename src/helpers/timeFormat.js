export function formatRemainingTime (remainingSeconds) {
  if (!remainingSeconds || remainingSeconds <= 0) return ''
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const paddedSecs = secs < 10 ? `0${secs}` : secs
  return `Disponível para download por mais ${mins}m ${paddedSecs}s (limite de 30 min)`
}

export function startExpirationTimer (getExpiresAt, onTick, onExpire) {
  const tick = () => {
    const expiresAt = getExpiresAt()
    if (!expiresAt) {
      onTick(0)
      return
    }
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    onTick(diff)
    if (diff <= 0 && onExpire) {
      onExpire()
    }
  }
  tick()
  return setInterval(tick, 1000)
}
