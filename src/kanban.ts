export type ColumnId = 'todo' | 'doing' | 'done'

export type KanbanItem = {
  id: string
  title: string
  characterId: string
}

export type BoardState = Record<ColumnId, KanbanItem[]>

export function isColumnId(value: unknown): value is ColumnId {
  return value === 'todo' || value === 'doing' || value === 'done'
}

// destinationIndex is the final index, after removing the item from its source.
export function moveItem(
  board: BoardState,
  itemId: string,
  destination: ColumnId,
  destinationIndex: number,
): BoardState {
  const source = (['todo', 'doing', 'done'] as const).find((column) =>
    board[column].some((item) => item.id === itemId),
  )
  if (!source || !Number.isInteger(destinationIndex)) return board

  const sourceIndex = board[source].findIndex((item) => item.id === itemId)
  const sourceItems = [...board[source]]
  const [item] = sourceItems.splice(sourceIndex, 1)
  if (!item) return board

  const destinationItems = source === destination ? sourceItems : [...board[destination]]
  const index = Math.max(0, Math.min(destinationIndex, destinationItems.length))
  if (source === destination && sourceIndex === index) return board

  destinationItems.splice(index, 0, item)
  return { ...board, [source]: sourceItems, [destination]: destinationItems }
}

export const initialBoard: BoardState = {
  todo: [
    {
      id: 'sample-card-1',
      title: 'Plan a morning walk',
      characterId: '1',
    },
    {
      id: 'sample-card-2',
      title: 'Prepare a weekly meal plan',
      characterId: '2',
    },
  ],
  doing: [
    {
      id: 'sample-card-3',
      title: 'Build a daily stretching routine',
      characterId: '3',
    },
  ],
  done: [],
}
