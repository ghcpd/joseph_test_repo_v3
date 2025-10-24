const directionVectors = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 }
};

let tileIdCounter = 0;
const nextTileId = () => {
  tileIdCounter += 1;
  return tileIdCounter;
};

class Tile {
  constructor(position, value, opts = {}) {
    const { id = nextTileId() } = opts;
    this.id = id;
    this.value = value;
    this.row = position.row;
    this.col = position.col;
    this.previousPosition = null;
    this.mergedFrom = null;
    this.isNew = true;
    this.justMerged = false;
  }

  savePosition() {
    this.previousPosition = { row: this.row, col: this.col };
  }

  updatePosition(position) {
    this.row = position.row;
    this.col = position.col;
  }
}

function clonePosition(position) {
  return position ? { row: position.row, col: position.col } : null;
}

/**
 * Core game engine for the 2048 puzzle.
 *
 * The engine is UI-agnostic and exposes helpers for both rendering and testing.
 */
export class Game2048 {
  constructor(size = 4, options = {}) {
    if (!Number.isInteger(size) || size < 2) {
      throw new Error('Board size must be an integer >= 2');
    }

    const { rng = Math.random } = options;

    this.size = size;
    this.rng = rng;

    this.tiles = [];
    this.score = 0;
    this.bestScore = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.tileStateBuffer = null;

    this.grid = this._emptyGrid();
    this._spawnInitialTiles();
  }

  /** Returns a deep copy of the current board values (for testing/UI). */
  getBoardValues() {
    return this.grid.map((row) => row.map((tile) => (tile ? tile.value : 0)));
  }

  /** Returns whether the last move reached 2048. */
  hasWon() {
    return this.won;
  }

  /** Returns whether the game has no remaining moves. */
  isOver() {
    return this.over;
  }

  /** Allow play to continue after reaching 2048. */
  continueGame() {
    this.keepPlaying = true;
    return this._status();
  }

  /** Reset the game state and spawn two tiles. */
  reset() {
    this.grid = this._emptyGrid();
    this.tiles = [];
    this.score = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.tileStateBuffer = null;
    this._spawnInitialTiles();
    return this._status();
  }

  /**
   * Utility for tests: load a specific matrix of values.
   * Empty cells should be 0.
   */
  setBoard(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== this.size) {
      throw new Error('Matrix must match the configured board size');
    }

    this.grid = this._emptyGrid();
    this.tiles = [];
    this.score = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;

    matrix.forEach((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== this.size) {
        throw new Error('Matrix rows must match the configured board size');
      }

      row.forEach((value, colIndex) => {
        if (!value) return;
        const tile = new Tile({ row: rowIndex, col: colIndex }, value);
        tile.isNew = false;
        this._insertTile(tile);
        if (value === 2048) {
          this.won = true;
        }
      });
    });

    this.tileStateBuffer = this._buildTileSnapshot();
    return this._status();
  }

  /** Perform a move in one of the four directions. */
  move(direction) {
    const vector = directionVectors[direction];
    if (!vector) {
      throw new Error(`Unknown direction: ${direction}`);
    }

    if (this.over) {
      return { ...this._status(), moved: false, locked: true };
    }

    if (this.won && !this.keepPlaying) {
      return { ...this._status(), moved: false, locked: true };
    }

    this._prepareTiles();

    const traversals = this._buildTraversals(vector);
    let moved = false;
    let scoreDelta = 0;

    traversals.rows.forEach((row) => {
      traversals.cols.forEach((col) => {
        const tile = this.grid[row][col];
        if (!tile) return;

        const cell = { row, col };
        const positions = this._findFarthestPosition(cell, vector);
        const nextTile = this._cellContent(positions.next);

        if (
          nextTile &&
          nextTile.value === tile.value &&
          !nextTile.mergedFrom
        ) {
          // Merge tiles
          const mergedValue = tile.value * 2;
          const mergedTile = new Tile(positions.next, mergedValue);
          mergedTile.isNew = false;
          mergedTile.justMerged = true;
          mergedTile.mergedFrom = [tile, nextTile].map((original) => {
            const clone = new Tile(
              { row: original.row, col: original.col },
              original.value,
              { id: original.id }
            );
            clone.previousPosition = clonePosition(original.previousPosition);
            clone.isNew = original.isNew;
            return clone;
          });
          mergedTile.previousPosition = clonePosition(positions.next);

          this._removeTile(tile);
          this._removeTile(nextTile);
          this._insertTile(mergedTile);

          this.score += mergedValue;
          scoreDelta += mergedValue;
          if (mergedValue === 2048) {
            this.won = true;
          }
          moved = true;
        } else {
          const { row: targetRow, col: targetCol } = positions.farthest;
          if (targetRow !== row || targetCol !== col) {
            this._moveTile(tile, positions.farthest);
            moved = true;
          }
        }
      });
    });

    let spawned = null;
    if (moved) {
      spawned = this._addRandomTile();
      if (!this._movesAvailable()) {
        this.over = true;
      }
    } else if (!this._movesAvailable()) {
      this.over = true;
    }

    this.tileStateBuffer = this._buildTileSnapshot(spawned);

    return {
      ...this._status(),
      moved,
      scoreDelta,
      spawnedTileId: spawned ? spawned.id : null,
      locked: this.won && !this.keepPlaying
    };
  }

  consumeTileSnapshot() {
    const snapshot = this.tileStateBuffer ?? this._buildTileSnapshot();
    this.tileStateBuffer = null;
    return snapshot;
  }

  /** Return current persistent game metrics. */
  _status() {
    return {
      score: this.score,
      won: this.won,
      over: this.over,
      keepPlaying: this.keepPlaying
    };
  }

  _spawnInitialTiles() {
    this._addRandomTile();
    this._addRandomTile();
    this.tileStateBuffer = this._buildTileSnapshot();
  }

  _emptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  _availableCells() {
    const cells = [];
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        if (!this.grid[row][col]) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  _addRandomTile() {
    const cells = this._availableCells();
    if (!cells.length) {
      return null;
    }

    const index = Math.floor(this.rng() * cells.length);
    const position = cells[index];
    const value = this.rng() < 0.9 ? 2 : 4;
    const tile = new Tile(position, value);
    tile.isNew = true;
    this._insertTile(tile);
    return tile;
  }

  _insertTile(tile) {
    this.grid[tile.row][tile.col] = tile;
    this.tiles.push(tile);
  }

  _removeTile(tile) {
    if (this.grid[tile.row] && this.grid[tile.row][tile.col] === tile) {
      this.grid[tile.row][tile.col] = null;
    }
    const index = this.tiles.findIndex((candidate) => candidate.id === tile.id);
    if (index !== -1) {
      this.tiles.splice(index, 1);
    }
  }

  _moveTile(tile, position) {
    this.grid[tile.row][tile.col] = null;
    tile.updatePosition(position);
    tile.isNew = false;
    this.grid[position.row][position.col] = tile;
  }

  _prepareTiles() {
    this.tiles.forEach((tile) => {
      tile.isNew = false;
      tile.justMerged = false;
      tile.savePosition();
      tile.mergedFrom = null;
    });
  }

  _buildTraversals(vector) {
    const rows = [...Array(this.size).keys()];
    const cols = [...Array(this.size).keys()];

    if (vector.row === 1) rows.reverse();
    if (vector.col === 1) cols.reverse();

    return { rows, cols };
  }

  _findFarthestPosition(position, vector) {
    let previous;

    do {
      previous = position;
      position = { row: previous.row + vector.row, col: previous.col + vector.col };
    } while (this._withinBounds(position) && !this._cellOccupied(position));

    return {
      farthest: previous,
      next: position
    };
  }

  _withinBounds(position) {
    return (
      position.row >= 0 &&
      position.row < this.size &&
      position.col >= 0 &&
      position.col < this.size
    );
  }

  _cellOccupied(position) {
    return Boolean(this._cellContent(position));
  }

  _cellContent(position) {
    if (this._withinBounds(position)) {
      return this.grid[position.row][position.col];
    }
    return null;
  }

  _movesAvailable() {
    return this._availableCells().length > 0 || this._tileMatchesAvailable();
  }

  _tileMatchesAvailable() {
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        const tile = this.grid[row][col];
        if (!tile) continue;

        for (const vector of Object.values(directionVectors)) {
          const position = { row: row + vector.row, col: col + vector.col };
          const other = this._cellContent(position);
          if (other && other.value === tile.value) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _buildTileSnapshot(spawned) {
    const tiles = this.tiles.map((tile) => ({
      id: tile.id,
      value: tile.value,
      row: tile.row,
      col: tile.col,
      previousRow: tile.previousPosition ? tile.previousPosition.row : null,
      previousCol: tile.previousPosition ? tile.previousPosition.col : null,
      isNew: tile.isNew || (spawned && tile.id === spawned.id),
      justMerged: tile.justMerged,
      mergedFrom: tile.mergedFrom
        ? tile.mergedFrom.map((mergedTile) => ({
            id: mergedTile.id,
            value: mergedTile.value,
            row: mergedTile.row,
            col: mergedTile.col
          }))
        : []
    }));

    return {
      tiles,
      spawnedTileId: spawned ? spawned.id : null
    };
  }
}

export const DIRECTIONS = Object.freeze(Object.keys(directionVectors));
