import './style.css'
import { Game2048 } from './game.js'

const BEST_SCORE_KEY = 'game-2048-best-score'
const animationTimers = new Map()
const tileElements = new Map()
const retiringTiles = new Set()

const root = document.querySelector('#app')

if (!root) {
  throw new Error('#app root element was not found')
}

root.innerHTML = `
  <div class="game" data-game>
    <header class="game__header">
      <div class="game__identity">
        <h1 class="game__title" aria-label="2048">2048</h1>
        <p class="game__subtitle">Join the tiles, get to <strong>2048!</strong></p>
      </div>
      <div class="game__scores" aria-live="polite" aria-atomic="true">
        <div class="score-box" data-score-box>
          <span class="score-box__label">Score</span>
          <span class="score-box__value" data-score>0</span>
        </div>
        <div class="score-box" data-best-box>
          <span class="score-box__label">Best</span>
          <span class="score-box__value" data-best>0</span>
        </div>
      </div>
    </header>

    <div class="game__controls" role="group" aria-label="Game controls">
      <button type="button" class="btn" data-restart>Restart</button>
      <button type="button" class="btn btn--secondary" data-keep-playing hidden>Keep going</button>
    </div>

    <div class="board" data-board>
      <div class="board__grid" data-grid></div>
      <div class="board__tiles" data-tile-layer aria-live="polite" aria-label="Game board"></div>
      <div class="board__overlay" data-overlay aria-hidden="true">
        <div class="overlay__content">
          <p class="overlay__message" data-overlay-message></p>
          <div class="overlay__actions">
            <button type="button" class="btn" data-overlay-keep hidden>Keep playing</button>
            <button type="button" class="btn btn--secondary" data-overlay-restart>Try again</button>
          </div>
        </div>
      </div>
    </div>

    <p class="game__hint">Use your arrow keys or swipe to move the tiles. Combine tiles with the same number to reach 2048.</p>
  </div>
`

const boardEl = root.querySelector('[data-board]')
const gridEl = root.querySelector('[data-grid]')
const tileLayer = root.querySelector('[data-tile-layer]')
const scoreEl = root.querySelector('[data-score]')
const bestEl = root.querySelector('[data-best]')
const scoreBox = root.querySelector('[data-score-box]')
const bestBox = root.querySelector('[data-best-box]')
const restartButtons = root.querySelectorAll('[data-restart], [data-overlay-restart]')
const keepGoingBtn = root.querySelector('[data-keep-playing]')
const overlayKeepBtn = root.querySelector('[data-overlay-keep]')
const overlayEl = root.querySelector('[data-overlay]')
const overlayMessage = root.querySelector('[data-overlay-message]')

if (!boardEl || !gridEl || !tileLayer || !scoreEl || !bestEl || !overlayEl || !overlayMessage) {
  throw new Error('Game markup failed to render')
}

const backgroundCells = Array.from({ length: 16 }, () => '<div class="board__cell" aria-hidden="true"></div>').join('')
gridEl.innerHTML = backgroundCells

let bestScore = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0
let currentScore = 0
bestEl.textContent = `${bestScore}`

const game = new Game2048()
let metrics = { gap: 0, tileSize: 0 }
let pointerStart = null
let overlayState = { visible: false, type: null }

const resizeObserver = new ResizeObserver(() => {
  recalcMetrics()
  syncAllTilePositions()
})
resizeObserver.observe(boardEl)
recalcMetrics()

function recalcMetrics() {
  const size = boardEl.clientWidth
  const gap = Math.max(Math.round(size * 0.024), 8)
  const tileSize = (size - gap * 5) / 4
  metrics = { gap, tileSize }
  boardEl.style.setProperty('--tile-gap', `${gap}px`)
  boardEl.style.setProperty('--tile-size', `${tileSize}px`)
  boardEl.style.setProperty('--board-padding', `${gap}px`)
}

function applyTilePosition(element, tile) {
  const x = metrics.gap + tile.col * (metrics.tileSize + metrics.gap)
  const y = metrics.gap + tile.row * (metrics.tileSize + metrics.gap)
  element.style.setProperty('--tx', `${x}px`)
  element.style.setProperty('--ty', `${y}px`)
}

function syncAllTilePositions() {
  tileElements.forEach((element) => {
    const row = Number.parseInt(element.dataset.row ?? '', 10)
    const col = Number.parseInt(element.dataset.col ?? '', 10)
    if (Number.isFinite(row) && Number.isFinite(col)) {
      applyTilePosition(element, { row, col })
    }
  })
}

function createTileElement(tile) {
  const el = document.createElement('div')
  el.className = 'tile tile--new'
  el.dataset.id = `${tile.id}`
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('role', 'img')
  el.innerHTML = `<span class="tile__label">${tile.value}</span>`
  tileLayer.appendChild(el)
  requestAnimationFrame(() => {
    el.classList.remove('tile--new')
  })
  return el
}

function valueKey(value) {
  return value > 2048 ? 'super' : `${value}`
}

function applyTileState(element, tile) {
  const key = valueKey(tile.value)
  element.dataset.value = key
  element.dataset.actualValue = `${tile.value}`
  element.dataset.row = `${tile.row}`
  element.dataset.col = `${tile.col}`
  element.querySelector('.tile__label').textContent = `${tile.value}`
  applyTilePosition(element, tile)

  element.classList.toggle('tile--merged', Boolean(tile.justMerged))
  if (tile.justMerged) {
    scheduleAnimationClear(element, 'tile--merged')
  }
}

function scheduleAnimationClear(element, className, delay = 220) {
  const descriptor = element.dataset?.id ?? element.dataset?.key ?? element.id ?? Array.from(element.classList).join('.') ?? element.tagName
  const key = `${descriptor}:${className}`
  clearTimeout(animationTimers.get(key))
  const timer = setTimeout(() => {
    element.classList.remove(className)
    animationTimers.delete(key)
  }, delay)
  animationTimers.set(key, timer)
}

function markRetiredTile(id) {
  const element = tileElements.get(id)
  if (!element || retiringTiles.has(id)) return
  retiringTiles.add(id)
  element.classList.add('tile--retiring')
  scheduleAnimationClear(element, 'tile--retiring')
  setTimeout(() => {
    if (element.parentElement) {
      element.remove()
    }
    tileElements.delete(id)
    retiringTiles.delete(id)
  }, 180)
}

function syncTiles(tiles, turnSummary = {}) {
  const active = new Set()

  tiles.forEach((tile) => {
    active.add(tile.id)
    let element = tileElements.get(tile.id)
    if (!element) {
      element = createTileElement(tile)
      tileElements.set(tile.id, element)
    }
    element.classList.remove('tile--retiring')
    applyTileState(element, tile)
  })

  if (turnSummary.removed) {
    turnSummary.removed.forEach((id) => markRetiredTile(id))
  }

  tileElements.forEach((element, id) => {
    if (!active.has(id) && !retiringTiles.has(id)) {
      element.remove()
      tileElements.delete(id)
    }
  })
}

function updateScores(score, { animate = true } = {}) {
  if (score !== currentScore) {
    currentScore = score
    scoreEl.textContent = `${score}`
    if (animate) {
      scoreBox.classList.add('score-box--pulse')
      scheduleAnimationClear(scoreBox, 'score-box--pulse', 260)
    }
  }

  if (score > bestScore) {
    bestScore = score
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore))
    bestEl.textContent = `${bestScore}`
    if (animate) {
      bestBox.classList.add('score-box--pulse')
      scheduleAnimationClear(bestBox, 'score-box--pulse', 260)
    }
  }
}

function hideOverlay() {
  overlayEl.classList.remove('board__overlay--visible')
  overlayEl.setAttribute('aria-hidden', 'true')
  overlayState = { visible: false, type: null }
  keepGoingBtn.hidden = !game.won || game.keepPlaying
  overlayKeepBtn.hidden = true
}

function showOverlay(type, message) {
  overlayMessage.textContent = message
  overlayEl.classList.add('board__overlay--visible')
  overlayEl.setAttribute('aria-hidden', 'false')
  overlayState = { visible: true, type }
  const allowContinue = type === 'win'
  keepGoingBtn.hidden = !allowContinue || game.keepPlaying
  overlayKeepBtn.hidden = !allowContinue || game.keepPlaying
}

function applyTurn(result) {
  if (result.moved) {
    updateScores(result.score)
  }

  syncTiles(result.tiles, result)

  if (result.won && !game.keepPlaying) {
    showOverlay('win', 'You win! Keep playing?')
  } else if (result.over) {
    showOverlay('over', 'Game over! No more moves.')
  } else if (!result.moved && result.locked === 'won') {
    showOverlay('win', 'You win! Keep playing?')
  } else if (!result.moved && result.locked === 'over') {
    showOverlay('over', 'Game over! No more moves.')
  } else if (overlayState.visible) {
    hideOverlay()
  }
}

function startNewGame() {
  hideOverlay()
  animationTimers.forEach((timer) => clearTimeout(timer))
  animationTimers.clear()
  tileElements.forEach((element) => element.remove())
  tileElements.clear()
  retiringTiles.clear()
  const snapshot = game.reset()
  currentScore = snapshot.score
  scoreEl.textContent = `${snapshot.score}`
  updateScores(snapshot.score, { animate: false })
  syncTiles(snapshot.tiles)
}

function continueGame() {
  game.setKeepPlaying(true)
  hideOverlay()
}

function attemptMove(direction) {
  const result = game.move(direction)
  applyTurn(result)
}

const KEY_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

window.addEventListener('keydown', (event) => {
  const direction = KEY_TO_DIRECTION[event.key]
  if (!direction) return
  event.preventDefault()
  attemptMove(direction)
})

boardEl.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary) return
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId }
  boardEl.setPointerCapture(event.pointerId)
})

boardEl.addEventListener('pointerup', (event) => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return
  const dx = event.clientX - pointerStart.x
  const dy = event.clientY - pointerStart.y
  const threshold = 20
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)
  if (Math.max(absX, absY) > threshold) {
    const direction = absX > absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    attemptMove(direction)
  }
  pointerStart = null
  if (boardEl.hasPointerCapture(event.pointerId)) {
    boardEl.releasePointerCapture(event.pointerId)
  }
})

boardEl.addEventListener('pointercancel', () => {
  pointerStart = null
})

restartButtons.forEach((button) => button.addEventListener('click', startNewGame))
keepGoingBtn?.addEventListener('click', continueGame)
overlayKeepBtn?.addEventListener('click', continueGame)

startNewGame()
