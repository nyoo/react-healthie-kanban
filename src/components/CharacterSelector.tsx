import { useId } from 'react'
import type { Character } from '../api/characters'

interface CharacterSelectorProps {
  characters: Character[]
  value: string
  onChange: (characterId: string) => void
  disabled?: boolean
}

export function CharacterSelector({
  characters,
  value,
  onChange,
  disabled = false,
}: CharacterSelectorProps) {
  const id = useId()

  return (
    <div className="character-selector">
      <label htmlFor={id}>Character</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || characters.length === 0}
      >
        <option value="">Choose a character</option>
        {characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name} ({character.species})
          </option>
        ))}
      </select>
    </div>
  )
}
