from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from database import Base, engine, get_db
from models import Diagram

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
      for connection in list(self.active_connections):
          try:
              await connection.send_text(message)
          except Exception:
              self.disconnect(connection)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "AI Diagram Tool Backend - Week 1–4 Complete"}

@app.websocket("/ws/draw")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.post("/ai/cleanup")
async def ai_cleanup(payload: dict):
    """
    Strong AI cleanup:
    - Snaps points to a coarse grid (40 px)
    - Simplifies each stroke by keeping fewer points
    So scribbles become cleaner, more geometric lines.
    """
    strokes = payload.get("strokes", [])
    cleaned_strokes = []

    # Bigger grid => more visible snapping
    def snap(value, grid=40):
        return round(value / grid) * grid

    for stroke in strokes:
        points = stroke.get("points", [])
        if not points:
            continue

        simplified = []
        for idx, p in enumerate(points):
            # keep first, last, and every 5th point
            if idx == 0 or idx == len(points) - 1 or idx % 5 == 0:
                simplified.append({
                    "x": snap(p.get("x", 0)),
                    "y": snap(p.get("y", 0)),
                })

        cleaned_strokes.append({"points": simplified})

    return {"strokes": cleaned_strokes}


@app.post("/diagrams")
def save_diagram(payload: dict, db: Session = Depends(get_db)):
    owner = payload.get("owner")
    title = payload.get("title")
    strokes = payload.get("strokes", [])
    is_shared = bool(payload.get("is_shared", False))

    if not owner or not title:
        raise HTTPException(status_code=400, detail="Owner and title are required")

    diagram = Diagram(
        owner=owner,
        title=title,
        data_json=json.dumps(strokes),
        is_shared=is_shared,
        created_at=datetime.utcnow()
    )
    db.add(diagram)
    db.commit()
    db.refresh(diagram)
    return {"id": diagram.id, "message": "Diagram saved successfully"}

@app.get("/diagrams/user/{owner}")
def get_user_diagrams(owner: str, db: Session = Depends(get_db)):
    diagrams = (
        db.query(Diagram)
        .filter(Diagram.owner == owner)
        .order_by(Diagram.created_at.desc())
        .all()
    )
    result = []
    for d in diagrams:
        result.append({
            "id": d.id,
            "title": d.title,
            "owner": d.owner,
            "is_shared": d.is_shared,
            "created_at": d.created_at.isoformat()
        })
    return result

@app.get("/diagrams/shared")
def get_shared_diagrams(db: Session = Depends(get_db)):
    diagrams = (
        db.query(Diagram)
        .filter(Diagram.is_shared == True)
        .order_by(Diagram.created_at.desc())
        .all()
    )
    result = []
    for d in diagrams:
        result.append({
            "id": d.id,
            "title": d.title,
            "owner": d.owner,
            "is_shared": d.is_shared,
            "created_at": d.created_at.isoformat()
        })
    return result

@app.get("/diagrams/{diagram_id}")
def get_diagram(diagram_id: int, db: Session = Depends(get_db)):
    d = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Diagram not found")
    strokes = json.loads(d.data_json)
    return {
        "id": d.id,
        "title": d.title,
        "owner": d.owner,
        "is_shared": d.is_shared,
        "created_at": d.created_at.isoformat(),
        "strokes": strokes
    }
