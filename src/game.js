const DEFAULT_SIZE = 4
const START_TILES = 2
const TARGET_TILE_VALUE = 2048

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const MOVE_SPAWN_DEFAULT = true

const tileSnapshot = (tile) => ({
  id: tile.id,
  row: tile.row,
  col: tile.col,
  value: tile.value,
  isNew: Boolean(tile.isNew),
  justMerged: Boolean(tile.justMerged),
  mergeSources: tile.mergeSources ? [...tile.mergeSources] : null,
  previousRow: tile.previousRow,
  previousCol: tile.previousCol,
})

export class Game2048 {
  constructor({ size = DEFAULT_SIZE, rng = Math.random } = {}) {
    if (!Number.isInteger(size) || size <= 1) {
      throw new Error('Game size must be an integer greater than 1')
    }

    if (typeof rng !== 'function') {
      throw new Error('rng must be a function')
    }

    this.size = size
    this.rng = rng
    this.tiles = new Map()
    this._idCounter = 0
    this.reset()
  }

  reset({ startTiles = START_TILES } = {}) {
    this.grid = this._emptyGrid()
    this.tiles.clear()
    this.score = 0
    this.won = false
    this.keepPlaying = false
    this.over = false
    this.lastDirection = null
    this._idCounter = 0

    for (let i = 0; i < startTiles; i += 1) {
      this.addRandomTile()
    }

    return this.getSnapshot()
  }

  continue() {
    this.keepPlaying = true
    return this.getSnapshot()
  }

  setKeepPlaying(value = true) {
    this.keepPlaying = Boolean(value)
  }

  getSnapshot() {
    return {
      score: this.score,
      tiles: this.getTilesSnapshot(),
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
      hasMoves: this.movesAvailable(),
    }
  }

  getTilesSnapshot() {
    return Array.from(this.tiles.values()).map(tileSnapshot)
  }

  seedGrid(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== this.size) {
      throw new Error('Matrix size must match game size')
    }

    this.grid = this._emptyGrid()
    this.tiles.clear()
    this.score = 0
    this.won = false
    this.keepPlaying = false
    this.over = false
    this._idCounter = 0

    for (let row = 0; row < this.size; row += 1) {
      if (!Array.isArray(matrix[row]) || matrix[row].length !== this.size) {
        throw new Error('Matrix rows must match game size')
      }

      for (let col = 0; col < this.size; col += 1) {
        const value = matrix[row][col]
        if (value) {
          this._insertTile(this._createTile(row, col, value))
        }
      }
    }

    return this.getSnapshot()
  }

  move(direction, options = {}) {
    const { spawn = MOVE_SPAWN_DEFAULT } = options
    if (!Object.prototype.hasOwnProperty.call(DIRECTION_VECTORS, direction)) {
      throw new Error(`Unsupported direction: ${direction}`)
    }

    if (this.over) {
      return this._buildResult({ moved: false, locked: 'over' })
    }

    if (this.won && !this.keepPlaying) {
      return this._buildResult({ moved: false, locked: 'won' })
    }

    const vector = DIRECTION_VECTORS[direction]
    const traversals = this._buildTraversals(vector)
    let moved = false
    let scoreGained = 0

    const moves = []
    const merges = []
    const removed = []

    this._prepareTiles()

    traversals.rows.forEach((row) => {
      traversals.cols.forEach((col) => {
        const tile = this.grid[row][col]
        if (!tile) return

        const originalRow = tile.row
        const originalCol = tile.col

        const { farthest, next } = this._findFarthestPosition({ row, col }, vector)
        const nextTile = next ? this._cellContent(next) : null

        if (
          nextTile &&
          nextTile.value === tile.value &&
          !nextTile.mergedThisTurn
        ) {
          this._removeTile(tile)
          nextTile.value *= 2
          nextTile.justMerged = true
          nextTile.mergedThisTurn = true
          nextTile.mergeSources = [tile.id, nextTile.id]
          nextTile.previousRow = nextTile.row
          nextTile.previousCol = nextTile.col
          scoreGained += nextTile.value
          removed.push(tile.id)
          moved = true

          moves.push({
            id: tile.id,
            fromRow: originalRow,
            fromCol: originalCol,
            toRow: nextTile.row,
            toCol: nextTile.col,
            mergesInto: nextTile.id,
          })

          merges.push({
            intoId: nextTile.id,
            fromId: tile.id,
            value: nextTile.value,
            row: nextTile.row,
            col: nextTile.col,
          })

          if (nextTile.value >= TARGET_TILE_VALUE) {
            this.won = true
          }
        } else {
          const target = farthest
          this._moveTile(tile, target)
          if (target.row !== originalRow || target.col !== originalCol) {
            moved = true
            moves.push({
              id: tile.id,
              fromRow: originalRow,
              fromCol: originalCol,
              toRow: tile.row,
              toCol: tile.col,
            })
          }
        }
      })
    })

    if (!moved) {
      const noMovesRemain = !this.movesAvailable()
      if (noMovesRemain) {
        this.over = true
      }
      return this._buildResult({ moved: false, locked: noMovesRemain ? 'over' : null })
    }

    this.score += scoreGained
    let newTile = null

    if (spawn) {
      newTile = this.addRandomTile()
    }

    this.over = !this.movesAvailable()
    this.lastDirection = direction

    return this._buildResult({
      moved: true,
      scoreGained,
      newTile: newTile ? tileSnapshot(newTile) : null,
      moves,
      merges,
      removed,
    })
  }

  addRandomTile() {
    const availableCells = this._availableCells()
    if (!availableCells.length) {
      return null
    }

    const cellIndex = Math.floor(this.rng() * availableCells.length)
    const cell = availableCells[cellIndex]
    const value = this.rng() < 0.9 ? 2 : 4
    const tile = this._createTile(cell.row, cell.col, value)
    tile.isNew = true
    this._insertTile(tile)
    return tile
  }

  movesAvailable() {
    return this._availableCells().length > 0 || this._tileMatchesAvailable()
  }

  _prepareTiles() {
    this.tiles.forEach((tile) => {
      tile.isNew = false
      tile.justMerged = false
      tile.mergeSources = null
      tile.mergedThisTurn = false
      tile.previousRow = tile.row
      tile.previousCol = tile.col
    })
  }

  _emptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null))
  }

  _createTile(row, col, value) {
    this._idCounter += 1
    return {
      id: this._idCounter,
      row,
      col,
      value,
      previousRow: row,
      previousCol: col,
      justMerged: false,
      isNew: false,
      mergeSources: null,
      mergedThisTurn: false,
    }
  }

  _insertTile(tile) {
    this.grid[tile.row][tile.col] = tile
    this.tiles.set(tile.id, tile)
    return tile
  }

  _removeTile(tile) {
    if (!tile) return
    this.grid[tile.row][tile.col] = null
    this.tiles.delete(tile.id)
  }

  _moveTile(tile, position) {
    if (tile.row === position.row && tile.col === position.col) {
      return
    }
    this.grid[tile.row][tile.col] = null
    const previousRow = tile.row
    const previousCol = tile.col
    tile.row = position.row
    tile.col = position.col
    tile.previousRow = previousRow
    tile.previousCol = previousCol
    this.grid[position.row][position.col] = tile
  }

  _withinBounds(position) {
    return (
      position.row >= 0 &&
      position.row < this.size &&
      position.col >= 0 &&
      position.col < this.size
    )
  }

  _cellContent(position) {
    if (this._withinBounds(position)) {
      return this.grid[position.row][position.col]
    }
    return null
  }

  _cellAvailable(position) {
    return !this._cellContent(position)
  }

  _availableCells() {
    const cells = []
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        if (!this.grid[row][col]) {
          cells.push({ row, col })
        }
      }
    }
    return cells
  }

  _tileMatchesAvailable() {
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        const tile = this.grid[row][col]
        if (!tile) continue
        for (const vector of Object.values(DIRECTION_VECTORS)) {
          const neighbourPos = { row: row + vector.y, col: col + vector.x }
          const neighbour = this._cellContent(neighbourPos)
          if (neighbour && neighbour.value === tile.value) {
            return true
          }
        }
      }
    }
    return false
  }

  _buildTraversals(vector) {
    const rows = Array.from({ length: this.size }, (_, index) => index)
    const cols = Array.from({ length: this.size }, (_, index) => index)

    if (vector.x === 1) cols.reverse()
    if (vector.y === 1) rows.reverse()

    return { rows, cols }
  }

  _findFarthestPosition(position, vector) {
    let current = { row: position.row, col: position.col }

    while (true) {
      const next = { row: current.row + vector.y, col: current.col + vector.x }
      if (!this._withinBounds(next) || !this._cellAvailable(next)) {
        return {
          farthest: current,
          next,
        }
      }
      current = next
    }
  }

  _buildResult(overrides) {
    const base = {
      score: this.score,
      tiles: this.getTilesSnapshot(),
      won: this.won,
      over: this.over,
      keepPlaying: this.keepPlaying,
      hasMoves: this.movesAvailable(),
      moved: false,
      scoreGained: 0,
      newTile: null,
      moves: [],
      merges: [],
      removed: [],
      locked: null,
      direction: this.lastDirection,
    }

    return { ...base, ...overrides }
  }
}
