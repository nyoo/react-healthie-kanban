import type { KanbanItem } from '../kanban'

type KanbanCardProps = {
  item: KanbanItem
}

function KanbanCard({ item }: KanbanCardProps) {
  return (
    <article className="kanban-card">
      <h3>{item.title}</h3>
      <p className="character-reference">
        <span>Temporary character reference</span>
        <span>{item.characterId}</span>
      </p>
    </article>
  )
}

export default KanbanCard
