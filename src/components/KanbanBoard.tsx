import { DragDropProvider } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import type { Dispatch, SetStateAction } from 'react'
import { isColumnId, moveItem } from '../kanban'
import type { BoardState, ColumnId } from '../kanban'
import KanbanColumn from './KanbanColumn'

type KanbanBoardProps = {
  board: BoardState
  onBoardChange: Dispatch<SetStateAction<BoardState>>
}

const columns: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
]

function KanbanBoard({ board, onBoardChange }: KanbanBoardProps) {
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
    onBoardChange((previousBoard) =>
      moveItem(
        previousBoard,
        itemId,
        destination,
        append ? previousBoard[destination].length : index,
      ),
    )
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <p className="drag-instructions" id="drag-instructions">
        Drag a card using its handle, or press Space, use arrow keys to move, and
        press Space to drop. Press Escape to cancel.
      </p>
      <section className="kanban-board" aria-label="Kanban board">
        {columns.map(({ id, title }) => (
          <KanbanColumn key={id} id={id} title={title} items={board[id]} />
        ))}
      </section>
    </DragDropProvider>
  )
}

export default KanbanBoard
