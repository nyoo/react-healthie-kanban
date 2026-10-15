import assert from 'node:assert/strict'
import { after, afterEach, before, mock, test } from 'node:test'
import { createElement } from 'react'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import type { CharactersState } from '../src/hooks/useCharacters.ts'

const characters = [
  { id: '1', name: 'Rick Sanchez', image: 'https://example.com/rick.jpeg', species: 'Human' },
  { id: '2', name: 'Morty Smith', image: 'https://example.com/morty.jpeg', species: 'Human' },
  { id: '3', name: 'Summer Smith', image: 'https://example.com/summer.jpeg', species: 'Human' },
]
const loaded: CharactersState = { status: 'success', characters }
let server: ViteDevServer
let dom: JSDOM
let rtl: typeof import('@testing-library/react')
let CreateItemForm: typeof import('../src/components/CreateItemForm.tsx').CreateItemForm
const originalGlobals = new Map<string, PropertyDescriptor | undefined>()

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost', pretendToBeVisual: true,
  })
  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    AbortController: dom.window.AbortController,
    AbortSignal: dom.window.AbortSignal,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    // jsdom has no layout; creation tests do not need drag geometry updates.
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  // React DOM must load after the DOM globals so input events work correctly.
  rtl = await import('@testing-library/react/pure.js')
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' })
  const formModule = await server.ssrLoadModule('/src/components/CreateItemForm.tsx')
  CreateItemForm = formModule.CreateItemForm
})

afterEach(() => {
  rtl.cleanup()
  mock.restoreAll()
})

after(async () => {
  await server?.close()
  dom?.window.close()
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else Reflect.deleteProperty(globalThis, name)
  }
})

function renderForm(state: CharactersState = loaded) {
  const onCreate = mock.fn()
  const props = { state, retry: () => {}, onCreate }
  const view = rtl.render(createElement(CreateItemForm, props))
  return {
    ...view,
    onCreate,
    title: view.getByRole('textbox', { name: 'Item title' }),
    character: view.getByRole('combobox', { name: 'Character' }),
    submit: view.getByRole('button', { name: 'Create' }),
    form: view.getByRole('form', { name: 'Create item' }),
    setState: (next: CharactersState) => view.rerender(createElement(CreateItemForm, { ...props, state: next })),
  }
}

test('creates with a trimmed title and required character, then clears both fields', () => {
  const view = renderForm()
  rtl.fireEvent.change(view.title, { target: { value: '  Plan a walk  ' } })
  rtl.fireEvent.change(view.character, { target: { value: '2' } })
  assert.equal(view.submit.hasAttribute('disabled'), false)
  rtl.fireEvent.click(view.submit)
  assert.equal(view.onCreate.mock.callCount(), 1)
  assert.deepEqual(view.onCreate.mock.calls[0].arguments, [{ title: 'Plan a walk', characterId: '2' }])
  assert.equal(view.title.getAttribute('value'), '')
  assert.equal(view.character.querySelector('option:checked')?.getAttribute('value'), '')
  assert.equal(view.submit.hasAttribute('disabled'), true)
})

for (const [label, title, characterId] of [
  ['empty title', '', '1'],
  ['whitespace-only title', '   ', '1'],
  ['missing character', 'Plan a walk', ''],
] as const) {
  test(`rejects submission with ${label}, including direct submit events`, () => {
    const view = renderForm()
    rtl.fireEvent.change(view.title, { target: { value: title } })
    rtl.fireEvent.change(view.character, { target: { value: characterId } })
    assert.equal(view.submit.hasAttribute('disabled'), true)
    // Bypass native required-field validation to exercise the handler's guard.
    rtl.fireEvent.submit(view.form)
    assert.equal(view.onCreate.mock.callCount(), 0)
  })
}

for (const [label, state] of [
  ['loading', { status: 'loading' }],
  ['API failure', { status: 'error', message: 'Offline' }],
  ['empty results', { status: 'success', characters: [] }],
  ['removed character', { status: 'success', characters: [characters[1]] }],
] satisfies [string, CharactersState][]) {
  test(`rejects a previously valid submission after ${label}`, () => {
    const view = renderForm()
    rtl.fireEvent.change(view.title, { target: { value: 'Plan a walk' } })
    rtl.fireEvent.change(view.character, { target: { value: '1' } })
    view.setState(state)
    assert.equal(view.submit.hasAttribute('disabled'), true)
    rtl.fireEvent.submit(view.form)
    assert.equal(view.onCreate.mock.callCount(), 0)
  })
}

test('App appends repeated titles as distinct cards with their selected characters', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({
    data: { characters: { results: characters } },
  }))
  const uuid = mock.method(globalThis.crypto, 'randomUUID')
  uuid.mock.mockImplementationOnce(() => '00000000-0000-4000-8000-000000000001')
  uuid.mock.mockImplementationOnce(() => '00000000-0000-4000-8000-000000000002')
  const appModule = await server.ssrLoadModule('/src/App.tsx')
  const App: typeof import('../src/App.tsx').default = appModule.default
  const view = rtl.render(createElement(App))
  await view.findByRole('option', { name: 'Rick Sanchez (Human)' })

  for (const character of characters.slice(0, 2)) {
    rtl.fireEvent.change(view.getByRole('textbox', { name: 'Item title' }), { target: { value: 'New task' } })
    rtl.fireEvent.change(view.getByRole('combobox', { name: 'Character' }), { target: { value: character.id } })
    rtl.fireEvent.click(view.getByRole('button', { name: 'Create' }))
  }

  const todo = rtl.within(view.getByRole('region', { name: 'To Do' }))
  const cards = todo.getAllByRole('article')
  assert.deepEqual(cards.map((card) => rtl.within(card).getByRole('heading').textContent), [
    'Plan a morning walk', 'Prepare a weekly meal plan', 'New task', 'New task',
  ])
  assert.ok(rtl.within(cards[0]).getByText('Rick Sanchez'))
  assert.ok(rtl.within(cards[1]).getByText('Morty Smith'))
  assert.ok(rtl.within(view.getByRole('region', { name: 'Doing' })).getByText('Summer Smith'))
  assert.equal(view.queryByText('Character unavailable'), null)
  assert.ok(rtl.within(cards[2]).getByText('Rick Sanchez'))
  assert.ok(rtl.within(cards[3]).getByText('Morty Smith'))
  assert.ok(todo.getByLabelText('4 cards'))
  assert.equal(rtl.within(view.getByRole('region', { name: 'Doing' })).getAllByRole('article').length, 1)
  assert.equal(rtl.within(view.getByRole('region', { name: 'Done' })).queryAllByRole('article').length, 0)
  assert.equal(uuid.mock.callCount(), 2)
  assert.equal(fetch.mock.callCount(), 1)
})
