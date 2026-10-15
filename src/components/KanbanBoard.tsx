import type { BoardState, ColumnId } from '../kanban'
import KanbanColumn from './KanbanColumn'

type KanbanBoardProps = {
  board: BoardState
}

const columns: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
]

function KanbanBoard({ board }: KanbanBoardProps) {
  return (
    <section className="kanban-board" aria-label="Kanban board">
      {columns.map(({ id, title }) => (
        <KanbanColumn key={id} id={id} title={title} items={board[id]} />
      ))}
    </section>
  )
}

export default KanbanBoard
