import { useState } from 'react'
import { useCharacters } from '../hooks/useCharacters'
import { CharacterSelector } from './CharacterSelector'

export function CharacterPreview() {
  const { state, retry } = useCharacters()
  const [selectedId, setSelectedId] = useState('')
  const characters = state.status === 'success' ? state.characters : []
  const selectedCharacter = characters.find((character) => character.id === selectedId)

  return (
    <section className="character-preview" aria-labelledby="character-preview-heading">
      <h2 id="character-preview-heading">Character selector preview</h2>
      <p>Explore characters for the upcoming item creation form.</p>
      <div role="status">
        {state.status === 'loading' && <p>Loading characters…</p>}
        {state.status === 'success' && characters.length === 0 && (
          <p>No characters are available.</p>
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
        value={selectedId}
        onChange={setSelectedId}
        disabled={state.status !== 'success'}
      />
      {selectedCharacter && (
        <figure>
          <img src={selectedCharacter.image} alt={selectedCharacter.name} width="120" height="120" />
          <figcaption>{selectedCharacter.name} · {selectedCharacter.species}</figcaption>
        </figure>
      )}
    </section>
  )
}
