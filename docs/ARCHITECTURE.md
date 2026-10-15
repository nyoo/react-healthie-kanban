# Kanban board architecture

## Component responsibilities

- `App` owns the board state and renders the page header and board.
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

This scope has no editing controls, so the state setter is intentionally unused.
Future interactions can call callbacks supplied by `App` and update that same
state with functional updates. Components must treat props and the initial
fixture as immutable. No context, external store, effects, or state transformation
helpers are needed for the current read-only UI.

## Future creation, movement, and ordering

Array position is the card order. Future creation can insert an item with a new
stable ID into a column's array. Reordering can replace that array with a reordered
copy. Moving between columns can remove the item from the source array and
insert it at a chosen destination index in one state update, retaining its ID.
These operations should copy the affected arrays and the containing board.

This representation avoids maintaining an item lookup and separate ID lists in
sync. The tradeoff is that locating an item by ID requires searching the column
arrays. That is a reasonable cost for a small interview board. Normalization can
be considered if requirements later justify frequent global lookups or shared
item references. Transformation helpers can be extracted when those operations
are implemented and have concrete behavior to test.

Fetching, character selection, creation controls, drag-and-drop, animations,
and persistence are outside this change.
