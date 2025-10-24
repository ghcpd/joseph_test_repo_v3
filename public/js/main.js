import { Game2048 } from './game.js';

const GRID_SIZE = 4;
const MOVE_ANIMATION_MS = 180;
const BEST_SCORE_KEY = 'ghcpd-2048-best-score';

const keyToDirection = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right'
};

const game = new Game2048(GRID_SIZE);

const state = {
  tileElements: new Map(),
  cellPositions: [],
  bestScore: 0,
  inputLocked: false,
  pendingUnlock: null,
  touchStart: null,
  snapshot: null
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  state.bestScore = loadBestScore();
  elements.bestScore.textContent = state.bestScore;

  initGridBackground();
  bindEvents();
  restartGame();
});

function cacheElements() {
  elements.app = document.getElementById('app');
  elements.grid = document.getElementById('grid');
  elements.tileLayer = document.getElementById('tile-layer');
  elements.score = document.getElementById('score');
  elements.bestScore = document.getElementById('best-score');
  elements.restart = document.getElementById('restart');
  elements.overlay = document.getElementById('overlay');
  elements.overlayTitle = document.getElementById('overlay-title');
  elements.overlayMessage = document.getElementById('overlay-message');
  elements.overlayRestart = document.getElementById('overlay-restart');
  elements.continue = document.getElementById('continue');
  elements.board = document.querySelector('.board');
}

function bindEvents() {
  elements.restart.addEventListener('click', () => restartGame());
  elements.overlayRestart.addEventListener('click', () => restartGame());
  elements.continue.addEventListener('click', () => {
    game.continueGame();
    hideOverlay();
    unlockInput();
  });

  window.addEventListener('keydown', handleKeyDown);
  const touchTarget = elements.board ?? elements.app;
  touchTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
  touchTarget.addEventListener('touchmove', handleTouchMove, { passive: false });
  touchTarget.addEventListener('touchend', handleTouchEnd, { passive: true });
  touchTarget.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  window.addEventListener('resize', debounce(() => {
    state.cellPositions = [];
    captureCellPositions();
    if (state.snapshot) {
      drawSnapshot(state.snapshot, { immediate: true });
    }
  }, 120));
}

function restartGame() {
  clearPendingUnlock();
  hideOverlay();
  removeAllTiles();
  state.cellPositions = [];
  const status = game.reset();
  updateScoreboard(status);
  const snapshot = game.consumeTileSnapshot();
  drawSnapshot(snapshot, { immediate: true });
  unlockInput();
}

function handleKeyDown(event) {
  const direction = keyToDirection[event.key];
  if (!direction) return;
  event.preventDefault();
  handleMove(direction);
}

function handleMove(direction) {
  if (state.inputLocked) {
    return;
  }

  state.inputLocked = true;
  const result = game.move(direction);
  const snapshot = game.consumeTileSnapshot();
  drawSnapshot(snapshot);
  updateScoreboard(result);

  if (result.moved) {
    if (result.won && !game.keepPlaying) {
      showOverlay('win');
      return;
    }
    if (result.over) {
      showOverlay('lose');
      return;
    }
    scheduleUnlock();
  } else {
    if (result.locked && result.won && !game.keepPlaying) {
      showOverlay('win');
      return;
    }
    if (result.over) {
      showOverlay('lose');
      return;
    }
    unlockInput();
  }
}

function scheduleUnlock() {
  clearPendingUnlock();
  state.pendingUnlock = setTimeout(() => {
    state.inputLocked = false;
    state.pendingUnlock = null;
  }, MOVE_ANIMATION_MS);
}

function unlockInput() {
  clearPendingUnlock();
  state.inputLocked = false;
}

function clearPendingUnlock() {
  if (state.pendingUnlock) {
    clearTimeout(state.pendingUnlock);
    state.pendingUnlock = null;
  }
}

function showOverlay(type) {
  clearPendingUnlock();
  state.inputLocked = true;

  if (type === 'win') {
    elements.overlayTitle.textContent = 'You Win!';
    elements.overlayMessage.textContent = 'Keep going to chase an even higher score or celebrate your victory!';
    elements.continue.classList.remove('is-hidden');
  } else {
    elements.overlayTitle.textContent = 'Game Over';
    elements.overlayMessage.textContent = 'No more moves remain. Try again to beat your best score!';
    elements.continue.classList.add('is-hidden');
  }
  elements.overlay.classList.remove('overlay--hidden');
}

function hideOverlay() {
  elements.overlay.classList.add('overlay--hidden');
}

function updateScoreboard(status) {
  const score = status.score ?? 0;
  elements.score.textContent = score;
  if (score > state.bestScore) {
    state.bestScore = score;
    elements.bestScore.textContent = state.bestScore;
    persistBestScore(state.bestScore);
  }
}

function loadBestScore() {
  try {
    const value = localStorage.getItem(BEST_SCORE_KEY);
    return value ? Number.parseInt(value, 10) || 0 : 0;
  } catch (error) {
    console.warn('Unable to access localStorage for best score', error);
    return 0;
  }
}

function persistBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch (error) {
    console.warn('Unable to persist best score', error);
  }
}

function initGridBackground() {
  elements.grid.innerHTML = '';
  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    elements.grid.appendChild(cell);
  }
}

function captureCellPositions() {
  const cells = elements.grid.querySelectorAll('.grid-cell');
  if (!cells.length) return;
  const layerRect = elements.tileLayer.getBoundingClientRect();
  state.cellPositions = Array.from(cells).map((cell) => {
    const rect = cell.getBoundingClientRect();
    return {
      x: rect.left - layerRect.left,
      y: rect.top - layerRect.top
    };
  });
}

function ensureCellPositions() {
  if (state.cellPositions.length !== GRID_SIZE * GRID_SIZE) {
    captureCellPositions();
  }
}

function getCellPosition(row, col) {
  ensureCellPositions();
  const index = row * GRID_SIZE + col;
  return state.cellPositions[index] ?? { x: 0, y: 0 };
}

function drawSnapshot(snapshot, { immediate = false } = {}) {
  if (!snapshot) return;
  state.snapshot = snapshot;
  ensureCellPositions();

  const activeIds = new Set();

  snapshot.tiles.forEach((tile) => {
    const element = getOrCreateTile(tile);
    applyTileValue(element, tile.value);
    animateTile(element, tile, { immediate });
    handleMergeSources(tile);
    activeIds.add(tile.id);
  });

  Array.from(state.tileElements.entries()).forEach(([id, element]) => {
    if (activeIds.has(id)) {
      return;
    }
    if (!element.classList.contains('tile--vanish')) {
      element.classList.add('tile--vanish');
      element.addEventListener('animationend', () => {
        element.remove();
        state.tileElements.delete(id);
      }, { once: true });
    }
  });
}

function getOrCreateTile(tile) {
  let element = state.tileElements.get(tile.id);
  if (!element) {
    element = document.createElement('div');
    element.className = 'tile';
    element.dataset.id = String(tile.id);
    elements.tileLayer.appendChild(element);
    state.tileElements.set(tile.id, element);
  }
  return element;
}

function applyTileValue(element, value) {
  element.textContent = value;
  element.dataset.value = String(value);
}

function animateTile(element, tile, { immediate }) {
  const { row, col, previousRow, previousCol, isNew, justMerged } = tile;
  const target = getCellPosition(row, col);

  if (isNew || immediate) {
    positionElement(element, target, true);
    if (isNew) {
      element.classList.add('tile--new');
      element.addEventListener('animationend', () => {
        element.classList.remove('tile--new');
      }, { once: true });
    }
  } else if (previousRow !== null && previousCol !== null && (previousRow !== row || previousCol !== col)) {
    const start = getCellPosition(previousRow, previousCol);
    positionElement(element, start, true);
    requestAnimationFrame(() => {
      positionElement(element, target, false);
    });
  } else {
    positionElement(element, target, false);
  }

  if (justMerged) {
    element.classList.add('tile--merged');
    setTimeout(() => element.classList.remove('tile--merged'), MOVE_ANIMATION_MS);
  }
}

function positionElement(element, position, immediate) {
  if (immediate) {
    element.style.transition = 'none';
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
    element.offsetHeight; // force reflow
    element.style.transition = '';
  } else {
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }
}

function handleMergeSources(tile) {
  (tile.mergedFrom || []).forEach((source) => {
    if (source.id === tile.id) return;
    const element = state.tileElements.get(source.id);
    if (!element) return;
    state.tileElements.delete(source.id);
    element.classList.add('tile--vanish');
    element.addEventListener('animationend', () => {
      element.remove();
    }, { once: true });
  });
}

function removeAllTiles() {
  state.tileElements.forEach((element) => element.remove());
  state.tileElements.clear();
  state.snapshot = null;
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  state.touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchMove(event) {
  if (!state.touchStart) return;
  // prevent scrolling while swiping intentionally
  event.preventDefault();
}

function handleTouchCancel() {
  state.touchStart = null;
}

function handleTouchEnd(event) {
  if (!state.touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - state.touchStart.x;
  const dy = touch.clientY - state.touchStart.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));

  state.touchStart = null;

  if (distance < 24) {
    return;
  }

  const direction = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');

  handleMove(direction);
}

function debounce(fn, wait = 120) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(null, args), wait);
  };
}
