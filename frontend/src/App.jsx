import React, { useState } from 'react'
import CanvasBoard from './CanvasBoard'
import DiagramDashboard from './DiagramDashboard'

function App() {
  const [username, setUsername] = useState('')
  const [activeUsername, setActiveUsername] = useState('')

  const handleSetUser = () => {
    setActiveUsername(username.trim())
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '10px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>AI-Assisted Collaborative Diagramming Tool</h2>
          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Real-time collaborative whiteboard with AI cleanup (simulated)
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button onClick={handleSetUser}>Set User</button>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Active: {activeUsername || 'None'}
          </span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 3, borderRight: '1px solid #eee' }}>
          <CanvasBoard activeUsername={activeUsername} />
        </div>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <DiagramDashboard activeUsername={activeUsername} />
        </div>
      </div>
    </div>
  )
}

export default App
