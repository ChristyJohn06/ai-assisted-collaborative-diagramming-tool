import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function DiagramDashboard({ activeUsername }) {
  const [userDiagrams, setUserDiagrams] = useState([])
  const [sharedDiagrams, setSharedDiagrams] = useState([])

  const fetchData = async () => {
    try {
      if (activeUsername) {
        const resUser = await axios.get(`${API_BASE}/diagrams/user/${activeUsername}`)
        setUserDiagrams(resUser.data)
      } else {
        setUserDiagrams([])
      }
      const resShared = await axios.get(`${API_BASE}/diagrams/shared`)
      setSharedDiagrams(resShared.data)
    } catch (err) {
      console.error('Dashboard fetch error', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeUsername])

  const handleRefresh = () => {
    fetchData()
  }

  const handleLoad = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/diagrams/${id}`)
      const strokes = res.data.strokes
      if (window.__LOAD_DIAGRAM_STROKES__) {
        window.__LOAD_DIAGRAM_STROKES__(strokes)
      }
    } catch (err) {
      console.error('Load diagram error', err)
    }
  }

  return (
    <div style={{
      flex: 1,
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Diagram Dashboard</h3>
        <button onClick={handleRefresh}>Refresh</button>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
        <div style={{
          flex: 1,
          border: '1px solid #eee',
          borderRadius: '4px',
          padding: '8px',
          overflowY: 'auto'
        }}>
          <h4>My Diagrams</h4>
          {activeUsername ? (
            userDiagrams.length ? (
              <ul style={{ paddingLeft: '18px' }}>
                {userDiagrams.map(d => (
                  <li key={d.id} style={{ cursor: 'pointer' }} onClick={() => handleLoad(d.id)}>
                    <strong>{d.title}</strong>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      Created: {new Date(d.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>No diagrams yet for this user.</p>
            )
          ) : (
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Set a username to see your diagrams.</p>
          )}
        </div>
        <div style={{
          flex: 1,
          border: '1px solid #eee',
          borderRadius: '4px',
          padding: '8px',
          overflowY: 'auto'
        }}>
          <h4>Shared Diagrams</h4>
          {sharedDiagrams.length ? (
            <ul style={{ paddingLeft: '18px' }}>
              {sharedDiagrams.map(d => (
                <li key={d.id} style={{ cursor: 'pointer' }} onClick={() => handleLoad(d.id)}>
                  <strong>{d.title}</strong> <span style={{ fontSize: '0.8rem' }}>({d.owner})</span>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    Created: {new Date(d.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
              </ul>
          ) : (
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>No shared diagrams yet.</p>
          )}
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        Click any diagram in the list to load it back into the canvas.
      </p>
    </div>
  )
}

export default DiagramDashboard
