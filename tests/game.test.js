import test from 'node:test';
import assert from 'node:assert/strict';

import { Game2048 } from '../public/js/game.js';

const constantRng = () => 0;

function createGame(size = 4) {
  return new Game2048(size, { rng: constantRng });
}

function nonZeroCount(board) {
  return board.reduce((total, row) => total + row.filter((value) => value !== 0).length, 0);
}

test('initializes with two tiles on the board', () => {
  const game = createGame();
  const board = game.getBoardValues();
  assert.strictEqual(nonZeroCount(board), 2);
});

test('moving left merges equal tiles and increases score', () => {
  const game = createGame();
  game.setBoard([
    [2, 0, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);

  const result = game.move('left');
  const board = game.getBoardValues();

  assert.strictEqual(result.moved, true);
  assert.strictEqual(result.scoreDelta, 4);
  assert.deepStrictEqual(board[0], [4, 2, 0, 0]);
  assert.strictEqual(game.hasWon(), false);
});

test('merges do not chain more than once per move', () => {
  const game = createGame();
  game.setBoard([
    [2, 2, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);

  const result = game.move('left');
  const board = game.getBoardValues();

  assert.strictEqual(result.moved, true);
  assert.strictEqual(result.scoreDelta, 4);
  assert.deepStrictEqual(board[0], [4, 2, 2, 0]);
});

test('spawns a new tile only after a successful move', () => {
  const game = createGame();
  game.setBoard([
    [0, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);

  const beforeCount = nonZeroCount(game.getBoardValues());
  const result = game.move('left');
  const afterCount = nonZeroCount(game.getBoardValues());

  assert.strictEqual(result.moved, true);
  assert.strictEqual(afterCount, beforeCount + 1);
  assert.ok(result.spawnedTileId);
});

test('invalid moves do not spawn new tiles', () => {
  const game = createGame();
  game.setBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [4, 2, 4, 2],
    [16, 32, 64, 128]
  ]);

  const before = game.getBoardValues();
  const result = game.move('left');
  const after = game.getBoardValues();

  assert.strictEqual(result.moved, false);
  assert.strictEqual(result.spawnedTileId, null);
  assert.strictEqual(nonZeroCount(after), nonZeroCount(before));
});

test('detects victory and locks further moves until continuing', () => {
  const game = createGame();
  game.setBoard([
    [1024, 1024, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);

  const winningMove = game.move('left');
  assert.strictEqual(winningMove.won, true);
  assert.strictEqual(game.hasWon(), true);

  const blockedMove = game.move('right');
  assert.strictEqual(blockedMove.locked, true);
  assert.strictEqual(blockedMove.moved, false);

  game.continueGame();
  const followUpMove = game.move('right');
  assert.strictEqual(followUpMove.locked, false);
});

test('signals game over when no moves remain', () => {
  const game = createGame();
  game.setBoard([
    [2, 4, 2, 4],
    [4, 2, 4, 8],
    [8, 16, 8, 16],
    [32, 64, 32, 64]
  ]);

  const result = game.move('left');
  assert.strictEqual(result.moved, false);
  assert.strictEqual(result.over, true);
  assert.strictEqual(game.isOver(), true);
});
