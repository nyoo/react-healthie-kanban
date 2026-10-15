import { useState } from 'react'
import KanbanBoard from './components/KanbanBoard'
import { initialBoard } from './kanban'
import type { BoardState } from './kanban'

function App() {
  const [board] = useState<BoardState>(initialBoard)

  return (
    <main>
      <header className="app-header">
        <h1>Healthie Kanban</h1>
        <p>A place to see what’s next, in progress, and complete.</p>
        <p className="sample-notice">Sample board · Temporary character references</p>
      </header>
      <KanbanBoard board={board} />
    </main>
  )
}

export default App
