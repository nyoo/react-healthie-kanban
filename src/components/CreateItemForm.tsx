import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useCharacters } from '../hooks/useCharacters'
import type { KanbanItem } from '../kanban'
import { CharacterSelector } from './CharacterSelector'

interface CreateItemFormProps {
  onCreate: (input: Pick<KanbanItem, 'title' | 'characterId'>) => void
}

export function CreateItemForm({ onCreate }: CreateItemFormProps) {
  const titleId = useId()
  const { state, retry } = useCharacters()
  const [title, setTitle] = useState('')
  const [characterId, setCharacterId] = useState('')
  const characters = state.status === 'success' ? state.characters : []
  const hasSelectedCharacter = characters.some((character) => character.id === characterId)
  const canCreate = title.trim().length > 0 && hasSelectedCharacter

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreate) return

    onCreate({ title: title.trim(), characterId })
    setTitle('')
    setCharacterId('')
  }

  return (
    <form className="create-item-form" aria-label="Create item" onSubmit={handleSubmit}>
      <h2>Create item</h2>
      <p>Enter a title and assign a character. Both fields are required.</p>
      <div className="title-field">
        <label htmlFor={titleId}>Item title</label>
        <input
          id={titleId}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div role="status">
        {state.status === 'loading' && <p>Loading characters…</p>}
        {state.status === 'success' && characters.length === 0 && (
          <p>No characters are available. Creation is unavailable.</p>
        )}
      </div>
      {state.status === 'error' && (
        <div>
          <p role="alert">Characters are unavailable. {state.message}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}
      <CharacterSelector
        characters={characters}
        value={characterId}
        onChange={setCharacterId}
        disabled={state.status !== 'success'}
        required
      />
      <button type="submit" disabled={!canCreate}>Create</button>
    </form>
  )
}
