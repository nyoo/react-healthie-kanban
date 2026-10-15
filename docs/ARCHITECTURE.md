# Kanban board architecture

## Component responsibilities and data flow

- `App` owns the authoritative board with `useState`, calls `useCharacters` once,
  generates UUIDs, and appends new items to To Do with a functional state update.
- `CreateItemForm` owns controlled title/character inputs. It trims titles,
  validates the assignment against loaded characters, guards submission, and
  clears inputs after creation. It renders loading, empty, and error/retry states.
- `CharacterSelector` renders a labeled, controlled native select.
- `KanbanBoard` defines the column order/labels, owns drag-end handling and
  transient celebration IDs, and sends the next board to App's setter.
- `KanbanColumn` registers a whole-column drop target, derives the count, renders
  cards or an empty placeholder, and resolves character IDs from shared data.
- `KanbanCard` registers a sortable card and labeled drag handle. It renders the
  title, character, avatar/fallback, and completion effect. Its local state only
  tracks a failed image URL.

Data flows from `App` to the form and `KanbanBoard`, then through columns to cards.
Callbacks flow upward for creation and movement; props are not copied into a
second board store. Character objects are shared rather than fetched per card.

## Board state model

```ts
type ColumnId = 'todo' | 'doing' | 'done'
type KanbanItem = { id: string; title: string; characterId: string }
type BoardState = Record<ColumnId, KanbanItem[]>
```

Array membership represents column ownership and array position represents order.
Each item has a unique, stable ID used for React keys and dragging. Counts are
array lengths; no separate status, position, or count fields need synchronization.
The initial fixture contains three sample items referencing API character IDs
1 (Rick Sanchez), 2 (Morty Smith), and 3 (Summer Smith). Newly created items use
`crypto.randomUUID()` and a valid API character ID. Repeated titles and shared
character assignments are allowed.

`moveItem` is a pure immutable transition. It finds an item by ID, removes it,
then inserts the same object at the final destination index. It copies affected
arrays and retains untouched arrays. Missing IDs, noninteger indices, and no-op
moves return the original board; integer indices are clamped to array boundaries.
A valid input board retains every item exactly once after a move.

Complete objects in column arrays are easy to explain and update for this small
board. The cost is linear lookup by ID. Normalization would introduce a separate
item map and ordered ID arrays that must stay consistent; it is unnecessary here.

## GraphQL fetching

`src/api/characters.ts` sends a native `fetch` POST to
`https://rickandmortyapi.com/graphql` for `characters(page: 1)`, requesting ID,
name, image, and species. It filters null results. An empty array is a successful
empty response; absent results are an error.

Non-2xx HTTP responses, GraphQL errors (even with partial data), network failures,
and invalid JSON reject the request. GraphQL messages and HTTP status information
reach the form through the hook's error state. Types describe expected responses;
they do not fully validate untrusted JSON at runtime.

`useCharacters` uses a discriminated loading/success/error state and an attempt
counter for explicit retry. Each effect owns an AbortController; cleanup aborts
the request and aborted effects do not update state. This also handles React
StrictMode's development effect cleanup/restart. Retry immediately enters loading
and triggers another request. No cache, GraphQL client, or per-card request is used.

Creation requires a nonblank title and an ID present in successful results. Both
the disabled button and submit handler enforce this. Errors offer Try again;
loading and empty results explain why creation is unavailable. Existing board
items and movement remain usable without characters.

## Drag-and-drop architecture

The integration uses `@dnd-kit/react` and `@dnd-kit/dom` 0.5.0.
`DragDropProvider` supplies default pointer/keyboard sensors, feedback, and
announcements. `useSortable` receives each card's stable ID, array index, column
group, and card type. A dedicated labeled button is the handle; Space starts or
drops, arrows change targets, and Escape cancels.

Only `SortableKeyboardPlugin` is enabled for sortables. The default optimistic
sorting plugin reparents DOM nodes between lists, conflicting with React's own
list reconciliation in this implementation. React therefore owns membership:
board arrays and counts change on drop, with visual feedback during dragging.

`handleDragEnd` ignores cancellation, absent targets, invalid groups, and invalid
sources. A card target supplies its group/index. Whole-column targets have lower
collision priority, cover empty lists and column space, and append on drop.
`moveItem` receives a final index after source removal, including same-column
reorders. A no-op leaves the board and celebration state unchanged.

The handler currently computes a next board from its render's board snapshot and
passes that value to App's setter. Creation uses a functional updater. This is
adequate for the current synchronous local interactions; asynchronous or
collaborative mutations would warrant centralizing transitions against the latest
state, for example in a reducer.

## Completion effect

`KanbanBoard` queues a celebration only when a card moves from To Do/Doing into
Done. Reordering within Done does not trigger it; leaving Done clears its entry,
and entering again can celebrate again.

`KanbanCard` waits for `isDragSource` to become false before mounting an
aria-hidden CSS rocket and glow, avoiding animation restart during drag feedback
cleanup. The glow's own `animationend` clears the celebration; bubbled child
animation events are ignored. Both effects run for 900ms. Reduced-motion CSS
uses an invisible 1ms animation to preserve cleanup without a visible pulse.
No animation dependency or timer is needed.

## Accessibility, layout, and dependencies

Semantic main/section headings, lists, labeled native form controls, required
inputs, loading status, error alerts, and avatar alternatives support basic
accessibility. Handles have visible focus and share keyboard instructions.
Library announcements currently expose item IDs; this remains an accessibility
limitation. Focus restoration occurs after drag feedback cleanup, so transient
focus observations during a drop do not establish a lasting focus failure.

The CSS grid uses three columns above 48rem and stacks below that breakpoint.
Columns and form fields allow shrinking; an explicit `minmax(0, 1fr)` form track
prevents long character options from forcing horizontal overflow at 320px.
There is no UI framework. Runtime dependencies are React/React DOM and the two
used dnd-kit packages; tooling/test dependencies each have an active use.
TypeScript enables strict and unused-code checks. No obvious dead code was found.

## Verification and remaining gaps

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
The 33 automated tests cover:

- All six column directions, empty destinations, ordering, bounds, no-ops,
  immutability, item identity, and uniqueness across repeated transfers.
- GraphQL request shape, null filtering, empty results, HTTP/GraphQL errors,
  missing results, network failure, cancellation propagation, and invalid JSON.
- Character names/avatars/fallback markup and assignments after moves/reorders.
- Valid/invalid form submissions, loading/error/empty guards, reset, and App
  creation with distinct IDs for repeated titles.

Tests use Node's runner and native TypeScript stripping, Vite's TSX transform,
React server rendering, and React Testing Library with jsdom. No live API is
needed. They do not simulate drag sensors, collision selection, hook retry/abort
races, image-error events, or completion animation timing.

Final review also exercised the live character API, assigned creation, keyboard
reordering, cancellation, empty Done drops, pointer transfers, completion mounting
and cleanup, and desktop/narrow layouts. At 320px, the fixed layout's document
scroll width equals its 320px viewport width.
This is a focused review, not a full screen-reader, browser, or touch-device audit.

## Design tradeoffs and reasonable improvements

Local state, native fetch, plain CSS, and a small pure movement helper keep the
exercise readable. A drag library supplies the complex sensor/feedback behavior;
custom drag physics would add disproportionate complexity. Rejecting partial
GraphQL data favors a clear failure over silently incomplete choices. Seed
cards use actual API character IDs and remain movable while the API is unavailable.

Future work should follow concrete requirements: character search/pagination,
editing/deletion, undo, or persistence. First expand browser coverage for drag
and completion behavior, improve announcement labels, and verify touch and
screen-reader interactions. Consider a reducer or normalized state only if new
mutation patterns justify it. None of those features is implemented here.
