import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const WS_URL = 'ws://localhost:8000/ws/draw'
const API_BASE = 'http://localhost:8000'

function CanvasBoard({ activeUsername }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawing = useRef(false)
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [strokes, setStrokes] = useState([])
  const currentStroke = useRef(null)

  // -------- Canvas setup --------
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = window.innerWidth * 0.6
    canvas.height = window.innerHeight - 60
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#222'
    ctxRef.current = ctx
  }, [])

  // -------- WebSocket setup --------
  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onerror = (err) => console.error('WebSocket error', err)

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'stroke-start') {
        startRemoteStroke(msg)
      } else if (msg.type === 'stroke-point') {
        drawFromRemote(msg)
      } else if (msg.type === 'clear') {
        clearLocalCanvas(false)
      }
    }

    return () => ws.close()
  }, [])

  // -------- Local drawing handlers --------
  const startDrawing = (e) => {
    drawing.current = true
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)

    currentStroke.current = { points: [{ x: offsetX, y: offsetY }] }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stroke-start',
        x: offsetX,
        y: offsetY
      }))
    }
  }

  const draw = (e) => {
    if (!drawing.current) return
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = ctxRef.current
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()

    currentStroke.current.points.push({ x: offsetX, y: offsetY })

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stroke-point',
        x: offsetX,
        y: offsetY
      }))
    }
  }

  const stopDrawing = () => {
    if (!drawing.current) return
    drawing.current = false
    ctxRef.current.closePath()
    setStrokes(prev => [...prev, currentStroke.current])
    currentStroke.current = null
  }

  // -------- Remote drawing handlers --------
  const startRemoteStroke = (msg) => {
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(msg.x, msg.y)
  }

  const drawFromRemote = (msg) => {
    const ctx = ctxRef.current
    ctx.lineTo(msg.x, msg.y)
    ctx.stroke()
  }

  // -------- Clear & redraw helpers --------
  const clearLocalCanvas = (send = true) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokes([])

    if (send && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }))
    }
  }

  const redrawFromStrokes = (strokeList) => {
    clearLocalCanvas(false)
    const ctx = ctxRef.current
    strokeList.forEach(st => {
      if (st.points && st.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(st.points[0].x, st.points[0].y)
        st.points.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.stroke()
      }
    })
    setStrokes(strokeList)
  }

  // -------- AI Clean Up --------
  const handleAiCleanup = async () => {
    try {
      if (!strokes.length) {
        alert('Draw something first!')
        return
      }

      const payload = {
        strokes: strokes.map(st => ({
          points: st.points.map(p => ({ x: p.x, y: p.y }))
        }))
      }

      const res = await axios.post(`${API_BASE}/ai/cleanup`, payload)
      console.log('AI cleanup response:', res.data)

      if (res.data && res.data.strokes) {
        redrawFromStrokes(res.data.strokes)
      } else {
        alert('AI cleanup returned no data')
      }
    } catch (err) {
      console.error('AI cleanup error', err)
      alert('AI cleanup failed. Check console.')
    }
  }

  // -------- Save helpers --------
  const saveDiagram = async (shareFlag) => {
    if (!activeUsername) {
      alert('Please set a username before saving.')
      return
    }
    const title = window.prompt('Enter a title for this diagram:')
    if (!title) return
    try {
      await axios.post(`${API_BASE}/diagrams`, {
        owner: activeUsername,
        title: title,
        strokes: strokes,
        is_shared: shareFlag   // <- controls My vs Shared
      })
      alert(shareFlag ? 'Diagram saved & shared!' : 'Diagram saved successfully!')
    } catch (err) {
      console.error('Save error', err)
      alert('Failed to save diagram')
    }
  }

  const handleSave = () => {
    // personal save
    saveDiagram(false)
  }

  const handleSaveAndShare = () => {
    // shared save
    saveDiagram(true)
  }

  // -------- Allow dashboard to load strokes --------
  useEffect(() => {
    window.__LOAD_DIAGRAM_STROKES__ = (strokeList) => {
      if (strokeList) {
        redrawFromStrokes(strokeList)
      }
    }
  }, [])

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        display: 'flex',
        gap: '10px'
      }}>
        <button onClick={() => clearLocalCanvas(true)}>Clear Canvas</button>
        <button onClick={handleAiCleanup}>AI Clean Up</button>
        <button onClick={handleSave}>Save Diagram</button>
        <button onClick={handleSaveAndShare}>Save &amp; Share</button>
        <span style={{ fontSize: '0.85rem' }}>
          WS: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', background: '#f7f7f7', cursor: 'crosshair' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  )
}

export default CanvasBoard
