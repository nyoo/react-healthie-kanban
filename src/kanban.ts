export type ColumnId = 'todo' | 'doing' | 'done'

export type KanbanItem = {
  id: string
  title: string
  characterId: string
}

export type BoardState = Record<ColumnId, KanbanItem[]>

export const initialBoard: BoardState = {
  todo: [
    {
      id: 'sample-card-1',
      title: 'Plan a morning walk',
      characterId: 'sample-character-1',
    },
    {
      id: 'sample-card-2',
      title: 'Prepare a weekly meal plan',
      characterId: 'sample-character-2',
    },
  ],
  doing: [
    {
      id: 'sample-card-3',
      title: 'Build a daily stretching routine',
      characterId: 'sample-character-3',
    },
  ],
  done: [],
}
