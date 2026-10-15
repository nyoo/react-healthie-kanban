import assert from 'node:assert/strict'
import { test } from 'node:test'
import { initialBoard, moveItem } from '../src/kanban.ts'
import type { BoardState, ColumnId } from '../src/kanban.ts'

function ids(board: BoardState, column: ColumnId) {
  return board[column].map((item) => item.id)
}

for (const [source, destination] of [
  ['todo', 'doing'], ['doing', 'done'], ['done', 'todo'],
] as const) {
  test(`moves ${source} to ${destination}, preserving identity and assignments`, () => {
    const item = initialBoard.todo[0]
    assert.ok(item)
    const board: BoardState = { todo: [], doing: [], done: [], [source]: [item] }
    const result = moveItem(board, item.id, destination, 0)
    assert.deepEqual(result[source], [])
    assert.equal(result[destination][0], item)
    assert.deepEqual(board[source], [item])
  })
}

test('reorders to the end and beginning without mutating the input', () => {
  const result = moveItem(initialBoard, 'sample-card-1', 'todo', 1)
  assert.deepEqual(ids(result, 'todo'), ['sample-card-2', 'sample-card-1'])
  assert.deepEqual(moveItem(result, 'sample-card-1', 'todo', 0), initialBoard)
  assert.deepEqual(ids(initialBoard, 'todo'), ['sample-card-1', 'sample-card-2'])
  assert.equal(result.doing, initialBoard.doing)
})

test('inserts at beginning and appends at end of another column', () => {
  const first = moveItem(initialBoard, 'sample-card-1', 'doing', 0)
  assert.deepEqual(ids(first, 'doing'), ['sample-card-1', 'sample-card-3'])
  const last = moveItem(initialBoard, 'sample-card-1', 'doing', 1)
  assert.deepEqual(ids(last, 'doing'), ['sample-card-3', 'sample-card-1'])
})

test('ignores unknown items, invalid indices, and unchanged positions', () => {
  assert.equal(moveItem(initialBoard, 'missing', 'done', 0), initialBoard)
  assert.equal(moveItem(initialBoard, 'sample-card-1', 'todo', 0), initialBoard)
  assert.equal(moveItem(initialBoard, 'sample-card-1', 'done', NaN), initialBoard)
  assert.equal(moveItem(initialBoard, 'sample-card-1', 'done', 0.5), initialBoard)
})

test('clamps out-of-range positions to column boundaries', () => {
  assert.deepEqual(ids(moveItem(initialBoard, 'sample-card-3', 'todo', -1), 'todo'),
    ['sample-card-3', 'sample-card-1', 'sample-card-2'])
  assert.deepEqual(ids(moveItem(initialBoard, 'sample-card-3', 'todo', 99), 'todo'),
    ['sample-card-1', 'sample-card-2', 'sample-card-3'])
})

test('repeated transfers never duplicate, lose, or replace items', () => {
  const originals = Object.values(initialBoard).flat()
  let board = initialBoard
  for (let round = 0; round < 10; round++) {
    for (const destination of ['todo', 'doing', 'done'] as const) {
      for (const item of originals) {
        board = moveItem(board, item.id, destination, round % 3)
        const items = Object.values(board).flat()
        assert.equal(items.length, originals.length)
        assert.equal(new Set(items.map((entry) => entry.id)).size, originals.length)
        for (const original of originals) assert.ok(items.includes(original))
      }
    }
  }
})
