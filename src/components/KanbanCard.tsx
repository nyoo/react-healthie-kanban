import { useSortable } from '@dnd-kit/react/sortable'
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable'
import { useState } from 'react'
import type { Character } from '../api/characters'
import type { ColumnId, KanbanItem } from '../kanban'

type KanbanCardProps = {
  item: KanbanItem
  character: Character | undefined
  columnId: ColumnId
  index: number
  isCelebrating: boolean
  onCelebrationEnd: (itemId: string) => void
}

function KanbanCard({ item, character, columnId, index, isCelebrating, onCelebrationEnd }: KanbanCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null)
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
        {/* Wait for drop cleanup so restoring the drag feedback cannot restart the animation. */}
        {isCelebrating && !isDragSource && (
          <span
            className="completion-glow"
            aria-hidden="true"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) onCelebrationEnd(item.id)
            }}
          >
            <span className="completion-rocket">🚀</span>
          </span>
        )}
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
          {character?.image && character.image !== failedImage ? (
            <img
              className="character-avatar"
              src={character.image}
              alt={`${character.name} avatar`}
              width={40}
              height={40}
              onError={() => setFailedImage(character.image)}
            />
          ) : (
            <span className="character-avatar" role="img" aria-label="Avatar unavailable">?</span>
          )}
          <span>{character?.name || 'Character unavailable'}</span>
        </p>
      </article>
    </li>
  )
}

export default KanbanCard
