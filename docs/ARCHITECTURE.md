# Kanban board architecture

## Component responsibilities

- `App` owns the board state and shared character request, generates item IDs, and
  appends created items to To Do.
- `CreateItemForm` receives character loading state and collects and validates controlled
  title and character inputs before calling `App` through `onCreate`.
- `KanbanBoard` defines the column labels and display order: To Do, Doing, Done.
  It passes each column its ID, title, ordered items, and shared characters.
- `KanbanColumn` renders a heading, a count derived from its items, and either an
  ordered display of cards or an empty placeholder. It resolves each item's string
  `characterId` from the shared character collection and passes the matching
  character to `KanbanCard`.
- `KanbanCard` displays the item title, character name, and API avatar. Missing
  characters show “Character unavailable”; missing or failed images show an
  accessible avatar fallback while retaining any available character name.

The board components receive data through props and do not maintain copies of
the board state. `KanbanBoard` also owns the drag event handler; `KanbanColumn`
registers a drop target and `KanbanCard` registers a sortable card and drag handle.

## Board state representation

`src/kanban.ts` defines the domain types and a small sample board:

```ts
type ColumnId = 'todo' | 'doing' | 'done'

type KanbanItem = {
  id: string
  title: string
  characterId: string
}

type BoardState = Record<ColumnId, KanbanItem[]>
```

Each column has an array of complete items in display order. Each item belongs
to exactly one column, and its ID must be unique across the board. IDs remain
stable when titles, positions, or columns change. Card React keys use item IDs;
column keys use column IDs.

An item's column is represented by its array membership. There is no redundant
column property or position field on the item. Counts come from array lengths.
The sample IDs and character references are explicit placeholders, with no
dependency on a character API.

## State ownership and data flow

`App` initializes one `useState<BoardState>` value from the sample board. Data
flows downward: `App` → `KanbanBoard` → `KanbanColumn` → `KanbanCard`.
The sample fixture is initialization data, not another synchronized state store.

`CreateItemForm` trims the title and checks that the selected character ID is
present in the successfully loaded character list. Empty or whitespace-only
titles, missing selections, loading, empty results, and API failures disable
creation. The submit handler also guards against invalid input.

On valid submission, the form calls `App` with only the title and character ID.
`App` generates a `crypto.randomUUID()` once per item, outside the state updater,
and uses a functional update to append the item to a copied To Do array. Other
columns retain their existing arrays. React immediately renders the new card
and derived count, and the form clears both inputs after the callback returns.
Repeated titles are allowed; IDs are independent of titles and stay stable
across renders. Character objects are not duplicated in board state.

Components treat props and the initial fixture as immutable. No context or
external store is needed.

## Creation, movement, and ordering

Array position is the card order. Creation appends an item with a new
stable ID to the To Do array. The pure `moveItem` helper finds the source by stable item ID, removes that
exact item, and inserts it at a final destination index in one immutable update.
It copies only affected arrays and the containing board, retaining the item
object, ID, title, and character assignment. Array order is deterministic;
unchanged positions and missing IDs return the original board.

This representation avoids maintaining an item lookup and separate ID lists in
sync. The tradeoff is that locating an item by ID requires searching the column
arrays. That is a reasonable cost for a small interview board. Normalization can
be considered if requirements later justify frequent global lookups or shared
item references. `tests/kanban.test.ts` covers moves, boundaries, no-ops, immutability, and repeated
transfers that preserve the complete set of original items.

## Character fetching and selection

`src/api/characters.ts` fetches the first page of characters with native fetch.
It defines the character and GraphQL response types and rejects HTTP and GraphQL
errors, including partial responses containing errors.

`App` calls `useCharacters` once and shares its result with the form and board.
`useCharacters` owns loading, success, and error state, supports retries, and
aborts requests on cleanup to prevent stale updates. `CreateItemForm` renders
these states below the board and owns the selected character ID.
`CharacterSelector` is a controlled, presentational component with a labeled
native select with required-field support. The form keeps only the selected string
ID; items continue to store only that reference, without duplicated character
objects or per-card requests. Fetching failures disable creation
and offer a retry while the existing board continues to render independently.

## Drag-and-drop lifecycle

The integration uses `@dnd-kit/react` 0.5.0 and `@dnd-kit/dom` 0.5.0, checked
against the [official multiple-list guide](https://dndkit.com/react/guides/multiple-sortable-lists/)
and installed package types. There was no legacy dnd-kit integration to migrate.

`DragDropProvider` supplies the default pointer and keyboard sensors, drag
feedback, and accessibility announcements. Each card uses `useSortable` with
its stable ID, array index, column group, and a labeled button handle. Space
starts/drops a keyboard drag, arrows select targets, and Escape cancels.

Only `SortableKeyboardPlugin` is enabled for sortables. The default
`OptimisticSortingPlugin` reparents DOM nodes across lists; browser verification
found this conflicts with React removing the same nodes from their original
column. Disabling it keeps DOM membership under React's control. During dragging,
the library moves its visual feedback and CSS highlights the source and target;
the arrays and counts remain unchanged until a successful drop.

`KanbanBoard.handleDragEnd` ignores canceled drags, missing targets, and invalid
sources/destinations. A card target supplies its group and current array index.
Dropping on a card moves the source to that index. Each whole column is also a
lower-priority droppable target, so empty columns work without a card target;
dropping in column space appends. Card targets take precedence over their
containing column. Source and destination are captured before the functional
state updater invokes `moveItem` against the latest board in `App`.

There is no hover-state copy or rollback snapshot: canceling or dropping without
changing position leaves state unchanged. The helper removes and reinserts one
existing object atomically, so a valid board stays unique and complete. Invalid
destination indices are rejected or clamped to the available array boundaries.

Moving an incomplete card to Done queues its celebration. `KanbanCard` waits
until `isDragSource` is false before mounting the rocket and glow, allowing
dnd-kit's drop feedback to finish restoring the card first. Starting CSS
animations during that cleanup caused both animations to restart. The glow's
own animation-end event clears the celebration; child events are ignored.
Browser event counts verified one start and end per animation per completion.

Build, typecheck, and lint are configured npm commands. Run the existing and
movement tests with `node --test tests/*.test.ts` on a Node version supporting
TypeScript stripping. Browser checks covered all requested column directions,
reordering to the beginning/end, an empty destination, cancellation, and no-op
drops with keyboard input, plus pointer movement into an empty column.

`tests/character-display.test.ts` uses the existing Vite TSX transform and React
server rendering to check names, avatar URLs, shared assignments, missing data,
loading/error creation guards, and assignment rendering after moves and reorders.
Browser verification covered creating Rick and Morty cards, repeated assignments,
loaded avatar images, reordering, and a transfer to Done. A temporary local
fixture with a failing image URL verified that the avatar fallback retains the
character name. Server rendering does not dispatch image events.

Pagination, editing, deletion, and persistence remain
outside this change.
