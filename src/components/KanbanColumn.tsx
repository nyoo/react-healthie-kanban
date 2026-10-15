import { useDroppable } from '@dnd-kit/react'
import type { ColumnId, KanbanItem } from '../kanban'
import KanbanCard from './KanbanCard'

type KanbanColumnProps = {
  id: ColumnId
  title: string
  items: KanbanItem[]
}

function KanbanColumn({ id, title, items }: KanbanColumnProps) {
  const headingId = `column-${id}-heading`
  const { ref, isDropTarget } = useDroppable({
    id,
    accept: 'card',
    // Prefer individual cards when a card and its column overlap.
    collisionPriority: -1,
  })

  return (
    <section
      ref={ref}
      className={`kanban-column kanban-column--${id}`}
      aria-labelledby={headingId}
      data-drop-target={isDropTarget}
    >
      <header className="column-header">
        <h2 id={headingId}>{title}</h2>
        <span
          className="column-count"
          aria-label={`${items.length} ${items.length === 1 ? 'card' : 'cards'}`}
        >
          {items.length}
        </span>
      </header>
      {items.length > 0 ? (
        <ul className="card-list">
          {items.map((item, index) => (
            <KanbanCard key={item.id} item={item} columnId={id} index={index} />
          ))}
        </ul>
      ) : (
        <p className="empty-column">No cards yet. Cards in {title} will appear here.</p>
      )}
    </section>
  )
}

export default KanbanColumn
