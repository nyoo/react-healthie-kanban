import type { ColumnId, KanbanItem } from '../kanban'
import KanbanCard from './KanbanCard'

type KanbanColumnProps = {
  id: ColumnId
  title: string
  items: KanbanItem[]
}

function KanbanColumn({ id, title, items }: KanbanColumnProps) {
  const headingId = `column-${id}-heading`

  return (
    <section className={`kanban-column kanban-column--${id}`} aria-labelledby={headingId}>
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
          {items.map((item) => (
            <li key={item.id}>
              <KanbanCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-column">No cards yet. Cards in {title} will appear here.</p>
      )}
    </section>
  )
}

export default KanbanColumn
