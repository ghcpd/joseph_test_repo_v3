import { describe, it, expect, beforeEach } from 'vitest'
import { Game2048 } from './game.js'

const sequenceRng = (values) => {
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

const snapshotGrid = (tiles, size = 4) => {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  tiles.forEach((tile) => {
    grid[tile.row][tile.col] = tile.value
  })
  return grid
}

describe('Game2048 core mechanics', () => {
  let game

  beforeEach(() => {
    game = new Game2048({ rng: () => 0 })
    game.reset({ startTiles: 0 })
  })

  it('merges identical tiles when moving left', () => {
    game.seedGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])

    const result = game.move('left', { spawn: false })
    const grid = snapshotGrid(result.tiles)

    expect(result.moved).toBe(true)
    expect(result.score).toBe(4)
    expect(result.scoreGained).toBe(4)
    expect(grid[0]).toEqual([4, 0, 0, 0])
  })

  it('prevents double merges in a single move', () => {
    game.seedGrid([
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])

    const result = game.move('left', { spawn: false })
    const grid = snapshotGrid(result.tiles)

    expect(result.scoreGained).toBe(12)
    expect(grid[0]).toEqual([4, 8, 0, 0])
  })

  it('merges vertically when moving up', () => {
    game.seedGrid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [4, 0, 0, 0],
    ])

    const result = game.move('up', { spawn: false })
    const grid = snapshotGrid(result.tiles)

    expect(grid.map((row) => row[0])).toEqual([4, 8, 0, 0])
    expect(result.score).toBe(12)
  })

  it('spawns a predictable tile when using deterministic rng', () => {
    const rng = sequenceRng([0.25, 0.2, 0.1, 0.95])
    game = new Game2048({ rng })
    game.seedGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])

    const result = game.move('left')
    const grid = snapshotGrid(result.tiles)

    expect(result.newTile).not.toBeNull()
    expect(result.newTile?.value).toBe(2)
    expect(grid[result.newTile.row][result.newTile.col]).toBe(result.newTile.value)
  })

  it('upgrades to a 2048 tile and blocks further moves until continued', () => {
    game.seedGrid([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])

    const winResult = game.move('left', { spawn: false })
    expect(winResult.won).toBe(true)
    expect(game.won).toBe(true)
    expect(game.over).toBe(false)

    const blocked = game.move('left', { spawn: false })
    expect(blocked.moved).toBe(false)
    expect(blocked.locked).toBe('won')

    game.setKeepPlaying(true)
    const continued = game.move('right', { spawn: false })
    expect(continued.locked).toBeNull()
  })

  it('marks the game as over when no moves remain', () => {
    game.seedGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ])

    const attempt = game.move('left', { spawn: false })
    expect(attempt.moved).toBe(false)
    expect(attempt.locked).toBe('over')
    expect(game.over).toBe(true)
    expect(attempt.hasMoves).toBe(false)
  })
})
