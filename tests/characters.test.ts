import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { fetchCharacters } from '../src/api/characters.ts'

const character = { id: '1', name: 'Rick Sanchez', image: 'https://example.com/rick.jpeg', species: 'Human' }

afterEach(() => mock.restoreAll())

test('requests the first page and returns characters, excluding null entries', async () => {
  const controller = new AbortController()
  mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://rickandmortyapi.com/graphql')
    assert.equal(options.method, 'POST')
    assert.equal(options.signal, controller.signal)
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json' })
    const { query } = JSON.parse(String(options.body))
    assert.match(query, /characters\(page: 1\)/)
    for (const field of ['id', 'name', 'image', 'species']) {
      assert.match(query, new RegExp(`\\b${field}\\b`))
    }
    return Response.json({ data: { characters: { results: [character, null] } } })
  })

  assert.deepEqual(await fetchCharacters(controller.signal), [character])
})

test('preserves a valid empty result', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ data: { characters: { results: [] } } }))
  assert.deepEqual(await fetchCharacters(new AbortController().signal), [])
})

test('rejects non-2xx responses before parsing their body', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status: 503 }))
  await assert.rejects(fetchCharacters(new AbortController().signal), /HTTP 503/)
})

test('rejects GraphQL errors even when partial data is present', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({
    data: { characters: { results: [character] } },
    errors: [{ message: 'Resolver failed' }, { message: 'Try later' }],
  }))
  await assert.rejects(fetchCharacters(new AbortController().signal), /Resolver failed; Try later/)
})

test('distinguishes missing data from an empty result', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ data: null }))
  await assert.rejects(fetchCharacters(new AbortController().signal), /did not return character results/)
})

test('propagates network failures to the caller', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(fetchCharacters(new AbortController().signal), /Failed to fetch/)
})

test('propagates cancellation to the caller', async () => {
  const controller = new AbortController()
  controller.abort()
  mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    options.signal?.throwIfAborted()
    throw new Error('Expected an aborted signal')
  })
  await assert.rejects(fetchCharacters(controller.signal), { name: 'AbortError' })
})

test('rejects invalid JSON', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('invalid JSON'))
  await assert.rejects(fetchCharacters(new AbortController().signal), SyntaxError)
})
