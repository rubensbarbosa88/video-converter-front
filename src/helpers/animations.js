import {
  animate,
  createTimeline,
  createAnimatable,
  stagger,
  spring,
  splitText,
  utils
} from 'animejs'

export const COLORS = ['#FF4B4B', '#FFA828', '#FFCC2A', '#8DFF55', '#26F2D5']

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const noop = { revert () {}, pause () {}, cancel () {} }

/** Entrada da página: título letra a letra + elementos marcados com [data-intro]. */
export function introTimeline (root) {
  if (!root || prefersReducedMotion()) return noop
  const title = root.querySelector('[data-split]')
  const splitter = title ? splitText(title, { chars: { wrap: 'clip' } }) : null
  const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 900 } })

  if (splitter && splitter.chars.length) {
    tl.add(splitter.chars, {
      y: { from: '110%' },
      rotate: { from: 12 },
      delay: stagger(28)
    })
  }

  const items = root.querySelectorAll('[data-intro]')
  if (items.length) {
    tl.add(items, {
      opacity: { from: 0 },
      y: { from: 40 },
      ease: spring({ bounce: 0.35, duration: 900 }),
      delay: stagger(90)
    }, splitter ? '-=600' : 0)
  }

  const chips = root.querySelectorAll('[data-chip]')
  if (chips.length) {
    tl.add(chips, {
      opacity: { from: 0 },
      scale: { from: 0.4 },
      ease: spring({ bounce: 0.55, duration: 700 }),
      delay: stagger(45, { grid: [3, 3], from: 'center' })
    }, '-=700')
  }

  return {
    revert () {
      tl.revert()
      if (splitter) splitter.revert()
    },
    pause () { tl.pause() }
  }
}

/**
 * Formas flutuando em loop (filho) + arrastáveis com retorno elástico (wrapper).
 * Retorna função de cleanup.
 */
export function floatShapes (wrappers) {
  if (!wrappers || !wrappers.length) return () => {}
  const instances = []
  const cleanups = []
  const reduce = prefersReducedMotion()

  Array.from(wrappers).forEach((wrap, i) => {
    const inner = wrap.firstElementChild
    if (!reduce && inner) {
      instances.push(animate(inner, {
        translateY: [-14 - i * 4, 14 + i * 4],
        rotate: [`${-10 - i * 6}deg`, `${10 + i * 6}deg`],
        duration: 2600 + i * 700,
        ease: 'inOutSine',
        loop: true,
        alternate: true
      }))
    }
    cleanups.push(elasticDrag(wrap))
  })

  return () => {
    instances.forEach(a => a.revert())
    cleanups.forEach(fn => fn())
  }
}

/** Arrasta o elemento e solta com retorno em spring. */
export function elasticDrag (el) {
  let startX = 0
  let startY = 0
  let back = null
  const down = e => {
    if (back) back.pause()
    startX = e.clientX
    startY = e.clientY
    el.setPointerCapture(e.pointerId)
    el.classList.add('is-dragging')
    animate(el, { scale: 1.25, duration: 300, ease: 'outBack(2)' })
  }
  const move = e => {
    if (!el.hasPointerCapture(e.pointerId)) return
    utils.set(el, { x: e.clientX - startX, y: e.clientY - startY })
  }
  const up = e => {
    if (!el.hasPointerCapture(e.pointerId)) return
    el.releasePointerCapture(e.pointerId)
    el.classList.remove('is-dragging')
    back = animate(el, { x: 0, y: 0, scale: 1, ease: spring({ bounce: 0.6, duration: 1100 }) })
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
  }
}

/** Botão "magnético": segue levemente o ponteiro. Retorna função de cleanup. */
export function magnetic (el, strength = 0.35) {
  if (!el || prefersReducedMotion()) return () => {}
  const anim = createAnimatable(el, { x: 600, y: 600, ease: 'out(4)' })
  const move = e => {
    const r = el.getBoundingClientRect()
    anim.x((e.clientX - (r.left + r.width / 2)) * strength)
    anim.y((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => { anim.x(0); anim.y(0) }
  el.addEventListener('mousemove', move)
  el.addEventListener('mouseleave', leave)
  return () => {
    el.removeEventListener('mousemove', move)
    el.removeEventListener('mouseleave', leave)
    anim.revert()
  }
}

/** Squash elástico ao clicar. */
export function pressBounce (el) {
  if (!el || prefersReducedMotion()) return noop
  return animate(el, {
    scale: [{ to: 0.88, duration: 90, ease: 'outQuad' }, { to: 1, ease: spring({ bounce: 0.65, duration: 700 }) }]
  })
}

/** Pop de entrada (ícones, checks). */
export function popIn (el, delay = 0) {
  if (!el || prefersReducedMotion()) return noop
  return animate(el, {
    scale: { from: 0 },
    rotate: { from: -45 },
    opacity: { from: 0 },
    delay,
    ease: spring({ bounce: 0.6, duration: 900 })
  })
}

/** Pulso contínuo (ícone do dropzone, ponto ativo). */
export function pulse (el, scale = 1.12) {
  if (!el || prefersReducedMotion()) return noop
  return animate(el, {
    scale: [1, scale],
    duration: 800,
    ease: 'inOutSine',
    loop: true,
    alternate: true
  })
}

/** Bottom-sheet subindo com spring + backdrop fade. */
export function sheetIn (sheet, backdrop) {
  if (prefersReducedMotion()) return noop
  const tl = createTimeline()
  if (backdrop) tl.add(backdrop, { opacity: { from: 0 }, duration: 300, ease: 'outQuad' })
  if (sheet) {
    tl.add(sheet, { y: { from: '100%' }, ease: spring({ bounce: 0.3, duration: 800 }) }, 0)
    const items = sheet.querySelectorAll('[data-sheet-item]')
    if (items.length) {
      tl.add(items, {
        opacity: { from: 0 },
        y: { from: 24 },
        delay: stagger(70),
        ease: 'outExpo',
        duration: 700
      }, 150)
    }
  }
  return tl
}

/** Anima um valor numérico (objeto) e chama onUpdate com o valor arredondado. */
export function countUp (state, to, onUpdate, duration = 700) {
  if (prefersReducedMotion()) {
    state.value = to
    onUpdate(to)
    return noop
  }
  return animate(state, {
    value: to,
    duration,
    ease: 'outExpo',
    modifier: utils.round(0),
    onUpdate: () => onUpdate(state.value)
  })
}

/** Barras de equalizador em loop aleatório. */
export function equalizer (bars) {
  if (!bars || !bars.length || prefersReducedMotion()) return noop
  return animate(bars, {
    scaleY: () => utils.random(0.2, 1, 2),
    duration: () => utils.random(260, 520),
    delay: stagger(40),
    ease: 'inOutSine',
    loop: true,
    alternate: true,
    loopDelay: 0,
    onLoop: self => self.refresh()
  })
}

/** Explosão de confete dentro de um container posicionado. */
export function confetti (container, amount = 36) {
  if (!container || prefersReducedMotion()) return noop
  const pieces = []
  for (let i = 0; i < amount; i++) {
    const p = document.createElement('span')
    const size = utils.random(6, 12)
    const shape = i % 3
    Object.assign(p.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: `${size}px`,
      height: `${size}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: shape === 0 ? '50%' : shape === 1 ? '2px' : '0',
      clipPath: shape === 2 ? 'polygon(50% 0, 100% 100%, 0 100%)' : 'none',
      pointerEvents: 'none'
    })
    container.appendChild(p)
    pieces.push(p)
  }
  return animate(pieces, {
    x: () => utils.random(-220, 220),
    y: () => utils.random(-180, 120),
    rotate: () => utils.random(-360, 360),
    scale: [{ from: 0, to: 1, duration: 300 }, { to: 0, delay: 500, duration: 600 }],
    duration: 1400,
    ease: 'outExpo',
    delay: stagger(8),
    onComplete: () => pieces.forEach(p => p.remove())
  })
}

/** Tremida de erro. */
export function shake (el) {
  if (!el || prefersReducedMotion()) return noop
  return animate(el, {
    x: [0, -14, 12, -8, 6, -3, 0],
    duration: 600,
    ease: 'inOutSine'
  })
}
