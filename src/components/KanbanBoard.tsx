import { DragDropProvider } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Character } from '../api/characters'
import { isColumnId, moveItem } from '../kanban'
import type { BoardState, ColumnId } from '../kanban'
import KanbanColumn from './KanbanColumn'

type KanbanBoardProps = {
  board: BoardState
  onBoardChange: Dispatch<SetStateAction<BoardState>>
  characters: Character[]
}

const columns: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
]

function KanbanBoard({ board, onBoardChange, characters }: KanbanBoardProps) {
  const [celebratingItemIds, setCelebratingItemIds] = useState<string[]>([])

  function finishCelebration(itemId: string) {
    setCelebratingItemIds((previous) => previous.filter((id) => id !== itemId))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source, target } = event.operation
    if (event.canceled || !target || !isSortable(source) || typeof source.id !== 'string') return

    // Plain column targets cover empty lists and space below the last card.
    const destination = isColumnId(target.id)
      ? target.id
      : isSortable(target) ? target.group : undefined
    if (!isColumnId(destination)) return

    const itemId = source.id
    const index = isSortable(target) ? target.index : 0
    const append = isColumnId(target.id)
    const nextBoard = moveItem(
      board,
      itemId,
      destination,
      append ? board[destination].length : index,
    )
    if (nextBoard === board) return

    onBoardChange(nextBoard)

    const wasIncomplete = [...board.todo, ...board.doing].some((item) => item.id === itemId)
    if (destination === 'done' && wasIncomplete) {
      setCelebratingItemIds((previous) => [...previous, itemId])
    } else if (destination !== 'done') {
      finishCelebration(itemId)
    }
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <p className="drag-instructions" id="drag-instructions">
        Drag a card using its handle, or press Space, use arrow keys to move, and
        press Space to drop. Press Escape to cancel.
      </p>
      <section className="kanban-board" aria-label="Kanban board">
        {columns.map(({ id, title }) => (
          <KanbanColumn
            key={id}
            id={id}
            title={title}
            items={board[id]}
            characters={characters}
            celebratingItemIds={celebratingItemIds}
            onCelebrationEnd={finishCelebration}
          />
        ))}
      </section>
    </DragDropProvider>
  )
}

export default KanbanBoard
