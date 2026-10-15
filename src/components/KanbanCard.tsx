import { useSortable } from '@dnd-kit/react/sortable'
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import type { ColumnId, KanbanItem } from '../kanban'

type KanbanCardProps = {
  item: KanbanItem
  columnId: ColumnId
  index: number
}

function KanbanCard({ item, columnId, index }: KanbanCardProps) {
  const { ref, handleRef, isDragSource, isDropTarget } = useSortable({
    id: item.id,
    index,
    group: columnId,
    type: 'card',
    accept: 'card',
    // React owns list membership; keep keyboard support without DOM reparenting.
    plugins: [SortableKeyboardPlugin],
  })

  return (
    <li ref={ref} data-dragging={isDragSource} data-drop-target={isDropTarget}>
      <article className="kanban-card">
        <button
          ref={handleRef}
          type="button"
          className="drag-handle"
          aria-label={`Move ${item.title}`}
          aria-describedby="drag-instructions"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>{item.title}</h3>
        <p className="character-reference">
          <span>Temporary character reference</span>
          <span>{item.characterId}</span>
        </p>
      </article>
    </li>
  )
}

export default KanbanCard
