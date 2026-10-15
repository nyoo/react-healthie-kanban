import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import type { Character } from '../src/api/characters.ts'
import type { BoardState } from '../src/kanban.ts'
import { moveItem } from '../src/kanban.ts'

// Use the existing Vite transform for TSX; no additional test runner is needed.
let server: ViteDevServer
before(async () => {
  server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  })
})
after(async () => { await server?.close() })

const characters: Character[] = [
  { id: '1', name: 'Rick Sanchez', image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg', species: 'Human' },
  { id: '2', name: 'Morty Smith', image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg', species: 'Human' },
]
const board: BoardState = {
  todo: [
    { id: 'rick', title: 'Rick task', characterId: '1' },
    { id: 'morty', title: 'Morty task', characterId: '2' },
    { id: 'rick-again', title: 'Another Rick task', characterId: '1' },
  ],
  doing: [],
  done: [],
}

async function renderBoard(value: BoardState, choices = characters) {
  const boardModule = await server.ssrLoadModule('/src/components/KanbanBoard.tsx')
  const KanbanBoard: typeof import('../src/components/KanbanBoard.tsx').default = boardModule.default
  return renderToStaticMarkup(createElement(KanbanBoard, {
    board: value,
    characters: choices,
    onBoardChange: () => {},
  }))
}

function assertAssignments(html: string) {
  for (const item of board.todo) {
    const character = characters.find((entry) => entry.id === item.characterId)
    assert.ok(character)
    const card = html.match(new RegExp(`<article[^>]*>.*?<h3>${item.title}</h3>(.*?)</article>`))
    assert.ok(card)
    assert.ok(card[1].includes(`src="${character.image}"`))
    assert.ok(card[1].includes(`alt="${character.name} avatar"`))
    assert.ok(card[1].includes(`<span>${character.name}</span>`))
  }
  assert.doesNotMatch(html, /Temporary/)
}

test('resolves string IDs to Rick and Morty names and avatars, including shared assignments', async () => {
  assertAssignments(await renderBoard(board))
})

test('preserves rendered assignments after a column move and a reorder', async () => {
  const moved = moveItem(board, 'rick', 'doing', 0)
  const reordered = moveItem(moved, 'rick-again', 'todo', 0)
  assertAssignments(await renderBoard(reordered))
  assert.equal(reordered.doing[0], board.todo[0])
  assert.equal(reordered.todo[0], board.todo[2])
})

test('missing characters and empty image URLs render explicit fallbacks', async () => {
  const missing = await renderBoard(board, [])
  assert.equal((missing.match(/Character unavailable/g) ?? []).length, 3)
  assert.equal((missing.match(/aria-label="Avatar unavailable"/g) ?? []).length, 3)
  assert.doesNotMatch(missing, /<img|Temporary/)

  const noImage = await renderBoard(board, characters.map((character) => ({ ...character, image: '' })))
  assert.match(noImage, /Rick Sanchez/)
  assert.match(noImage, /Morty Smith/)
  assert.doesNotMatch(noImage, /<img/)
})

test('loading and errors disable creation without displaying placeholder identities', async () => {
  const formModule = await server.ssrLoadModule('/src/components/CreateItemForm.tsx')
  const CreateItemForm: typeof import('../src/components/CreateItemForm.tsx').CreateItemForm = formModule.CreateItemForm
  for (const state of [{ status: 'loading' }, { status: 'error', message: 'Offline' }] as const) {
    const html = renderToStaticMarkup(createElement(CreateItemForm, {
      state, retry: () => {}, onCreate: () => {},
    }))
    assert.match(html, /<button type="submit" disabled="">Create/)
    assert.doesNotMatch(html, /Temporary/)
    assert.match(html, state.status === 'loading' ? /Loading characters/ : /Characters are unavailable/)
  }
})
