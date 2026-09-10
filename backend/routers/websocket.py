"""WebSocket telemetry broadcasting for VitaGuard."""
import asyncio
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/api/v1", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.connections = defaultdict(set)

    async def connect(self, patient_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[patient_id].add(websocket)

    def disconnect(self, patient_id: str, websocket: WebSocket):
        self.connections[patient_id].discard(websocket)
        if not self.connections[patient_id]:
            self.connections.pop(patient_id, None)

    async def broadcast(self, patient_id: str, message: dict):
        stale = []
        for ws in list(self.connections.get(patient_id, set())):
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(patient_id, ws)

manager = ConnectionManager()

@router.websocket("/ws/patients/{patient_id}")
async def patient_telemetry(patient_id: str, websocket: WebSocket):
    await manager.connect(patient_id, websocket)
    try:
        while True:
            # The frontend may send a subscribe handshake. We keep the socket alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(patient_id, websocket)
    except Exception:
        manager.disconnect(patient_id, websocket)

async def broadcast_patient_telemetry(patient_id: str | None, payload: dict):
    if patient_id:
        await manager.broadcast(patient_id, payload)
