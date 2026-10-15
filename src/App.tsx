import { useState } from 'react'
import { CreateItemForm } from './components/CreateItemForm'
import KanbanBoard from './components/KanbanBoard'
import { initialBoard } from './kanban'
import type { BoardState, KanbanItem } from './kanban'

function App() {
  const [board, setBoard] = useState<BoardState>(initialBoard)

  function createItem(input: Pick<KanbanItem, 'title' | 'characterId'>) {
    const item: KanbanItem = { ...input, id: crypto.randomUUID() }

    setBoard((previousBoard) => ({
      ...previousBoard,
      todo: [...previousBoard.todo, item],
    }))
  }

  return (
    <main>
      <header className="app-header">
        <h1>Healthie Kanban</h1>
        <p>A place to see what’s next, in progress, and complete.</p>
        <p className="sample-notice">Sample board · Temporary character references</p>
      </header>
      <KanbanBoard board={board} />
      <CreateItemForm onCreate={createItem} />
    </main>
  )
}

export default App
