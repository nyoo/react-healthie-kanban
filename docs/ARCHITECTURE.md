# Kanban board architecture

## Component responsibilities

- `App` owns the board state, generates item IDs, and appends created items to To Do.
- `CreateItemForm` loads character choices and collects and validates controlled
  title and character inputs before calling `App` through `onCreate`.
- `KanbanBoard` defines the column labels and display order: To Do, Doing, Done.
  It passes each column its ID, title, and ordered items.
- `KanbanColumn` renders a heading, a count derived from its items, and either an
  ordered display of cards or an empty placeholder.
- `KanbanCard` displays an item's title and temporary character reference.

The board components are presentational function components. They receive data
through props and do not maintain copies of the board state.

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

## Future creation, movement, and ordering

Array position is the card order. Creation appends an item with a new
stable ID to the To Do array. Reordering can replace that array with a reordered
copy. Moving between columns can remove the item from the source array and
insert it at a chosen destination index in one state update, retaining its ID.
These operations should copy the affected arrays and the containing board.

This representation avoids maintaining an item lookup and separate ID lists in
sync. The tradeoff is that locating an item by ID requires searching the column
arrays. That is a reasonable cost for a small interview board. Normalization can
be considered if requirements later justify frequent global lookups or shared
item references. Transformation helpers can be extracted when those operations
are implemented and have concrete behavior to test.

## Character fetching and selection

`src/api/characters.ts` fetches the first page of characters with native fetch.
It defines the character and GraphQL response types and rejects HTTP and GraphQL
errors, including partial responses containing errors.

`useCharacters` owns loading, success, and error state, supports retries, and
aborts requests on cleanup to prevent stale updates. `CreateItemForm` renders
these states below the board and owns the selected character ID.
`CharacterSelector` is a controlled, presentational component with a labeled
native select with required-field support. Fetching failures disable creation
and offer a retry while the existing board continues to render independently.

Pagination, drag-and-drop, animations, editing, deletion, and persistence remain
outside this change.
