# Interview notes

## Five technical decisions worth explaining

1. **One local board state in App.** A small board needs no global store or context.
   Passing props and callbacks makes ownership and updates explicit.
2. **Ordered arrays of complete items per column.** Membership and position encode
   status and order without redundant fields. A pure helper handles moves and
   preserves IDs, assignments, and untouched array references.
3. **One native-fetch GraphQL request shared by the UI.** Character objects stay
   outside board state; items reference IDs. A small hook makes request lifecycle
   and retry explicit without adding a client/cache dependency.
4. **Use dnd-kit sensors while React owns list membership.** Stable IDs and a
   dedicated handle support pointer/keyboard input. Disabling optimistic DOM
   reparenting prevents conflicts with React reconciliation; commit on drop keeps
   cancellation simple.
5. **Keep celebration as transient presentation state.** Entering Done queues
   an effect, unrelated to persistent item data. CSS animation events clear it,
   and reduced-motion CSS suppresses visible motion while preserving cleanup.

## Why this board representation?

`Record<ColumnId, KanbanItem[]>` guarantees the three known column keys at compile
time. Each array is already render-ready and ordered. A move removes and inserts
one existing object, so it is easy to reason about immutability and identity.
Counts derive directly from array lengths. UUIDs distinguish repeated titles.

The tradeoff is linear item lookup. For this small exercise, a normalized item
map plus ordered ID lists adds synchronization work without a measured benefit.
If items became widely referenced or the board grew large, normalization and
virtualization could become useful. Types alone do not enforce unique IDs across
arrays; creation and the movement helper preserve that invariant, backed by tests.

## How does data flow through React?

`App` owns board state and calls `useCharacters`. It passes request state and a
creation callback to `CreateItemForm`, and board data/characters plus a setter to
`KanbanBoard`. Columns receive ordered items and resolve character references;
cards receive one item and its character. Form input and failed-image state stay
local to their components.

Creation validates and trims inputs, generates an ID once outside the updater,
then functionally appends to To Do. Drag-end handling computes a new board from
its render snapshot and passes it to the setter. A future asynchronous mutation
model should centralize these transitions against the latest state, such as in a
reducer. Celebration IDs belong to the board UI, not to domain items.

## How are GraphQL errors handled?

HTTP success does not imply GraphQL success: an `errors` array rejects even when
partial `data` is present. Non-2xx status, absent results, network failures, and
JSON parse failures also reject. Null result entries are filtered; an empty array
is a valid empty state.

The hook converts failures to a discriminated error state, and the form displays
an alert with Try again. Retry switches to loading and starts another effect.
Cleanup aborts requests, and aborted effects cannot overwrite state. Creation
requires a character in successful results; existing cards still move offline.
Expected response types are not comprehensive runtime validation.

## How do dragging and reordering work?

A sortable card registers its ID, index, column group, and handle. Whole columns
also register lower-priority targets, which makes empty columns droppable.
On a successful drop, a card target supplies the destination index; column space
appends. `moveItem` interprets the index after removing the source, copies only
affected arrays, and inserts the same object. Canceled, missing-target, and no-op
drops leave state unchanged.

Only the sortable keyboard plugin is enabled; React performs actual list changes
at drop time. Incomplete-to-Done transitions queue a rocket/glow after drag cleanup.
Reordering Done does not celebrate. Tests verify domain moves, while browser
checks exercise the library integration. Sensor/collision and animation lifecycle
coverage remain useful next tests; default announcements currently use item IDs.

## Likely follow-ups and implementation approaches

| Request | Brief approach |
| --- | --- |
| Edit a title or assignment | Add a small controlled edit form and update by stable item ID. Reuse creation validation; preserve column/order. |
| Delete a card and undo | Remove by ID and retain the removed item, column, and index for one undo action. Restore through an immutable transition; manage focus explicitly. |
| Search or paginate characters | Parameterize the query with variables, expose page metadata, and cancel stale searches. Keep selected character details available when results change. |
| Persist across refreshes | Add a versioned localStorage schema and runtime validation with a safe initial-board fallback. Store IDs/order and define how assigned character details reload. |
| Filter by character or title | Derive visible items without mutating the canonical board. Specify whether dragging is disabled while filtered or maps visible targets back to canonical indices. |

These are discussion proposals only. None is implemented in this review.

## Suggested demo sequence

Load characters, create a card with a required assignment, reorder it, move it
into empty Done, and show the completion effect. Demonstrate keyboard Space,
arrows, and Escape. Explain sample assignment fallbacks, show the test suite, and
state the first-page-only and refresh-reset limitations before discussing extensions.
