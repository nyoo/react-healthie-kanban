export interface Character {
  id: string
  name: string
  image: string
  species: string
}

export interface CharactersData {
  characters: {
    results: (Character | null)[] | null
  } | null
}

export interface GraphQLError {
  message: string
}

export interface CharactersResponse {
  data?: CharactersData | null
  errors?: GraphQLError[]
}

const charactersQuery = `
  query Characters {
    characters(page: 1) {
      results {
        id
        name
        image
        species
      }
    }
  }
`

export async function fetchCharacters(signal: AbortSignal): Promise<Character[]> {
  const response = await fetch('https://rickandmortyapi.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: charactersQuery }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Could not load characters (HTTP ${response.status}).`)
  }

  const result: CharactersResponse = await response.json()

  // Treat partial data with GraphQL errors as a failure so it is never silent.
  if (result.errors?.length) {
    throw new Error(`Could not load characters: ${result.errors.map((error) => error.message).join('; ')}`)
  }

  const results = result.data?.characters?.results

  if (!results) {
    throw new Error('The API did not return character results.')
  }

  return results.filter((character) => character !== null)
}
