import { useEffect, useState } from 'react'
import { fetchCharacters } from '../api/characters'
import type { Character } from '../api/characters'

export type CharactersState =
  | { status: 'loading' }
  | { status: 'success'; characters: Character[] }
  | { status: 'error'; message: string }

export function useCharacters() {
  const [state, setState] = useState<CharactersState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCharacters() {
      try {
        const characters = await fetchCharacters(controller.signal)

        if (!controller.signal.aborted) {
          setState({ status: 'success', characters })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load characters.',
          })
        }
      }
    }

    void loadCharacters()

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((previousAttempt) => previousAttempt + 1)
  }

  return { state, retry }
}
