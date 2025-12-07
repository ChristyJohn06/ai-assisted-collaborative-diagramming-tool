# 🧠 AI-Assisted Collaborative Diagramming Tool

A real-time collaborative whiteboard tool powered by FastAPI, WebSockets, and React, with simulated AI cleanup that automatically simplifies and aligns hand-drawn diagrams.

Developed as part of my internship at **Infotact Solutions**.

---

## 🚀 Features

### ✔ Real-time collaboration
Multiple users can draw simultaneously on a shared canvas using WebSockets.

### ✔ AI-Assisted Cleanup
Scribbled lines are automatically cleaned using:
- Grid snapping  
- Stroke simplification  
- Structured redraw  
This simulates an AI-driven correction workflow.

### ✔ Diagram Saving & Loading
Users can:
- Save diagrams  
- Load past diagrams  
- Share diagrams publicly  

### ✔ Dashboard View
View:
- My Diagrams  
- Shared Diagrams  
- Timestamped history  

---

## 🛠 Tech Stack

- **Backend:** FastAPI, Python, WebSockets  
- **Frontend:** React + Vite  
- **Database:** SQLite  
- **Communication:** WebSocket + REST APIs  

---

## 📁 Project Structure

```
ai_diagram_tool_final/
│── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

---

## ▶ How to Run

### Backend
```
cd backend
python -m venv venv
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```
cd frontend
npm install
npm run dev
```

Open browser → **http://localhost:5173**

---

## 📌 Summary
This project demonstrates:
- Real-time system design  
- AI-inspired diagram processing  
- WebSocket communication  
- Full-stack integration  

Built during my internship at **Infotact Solutions**.

