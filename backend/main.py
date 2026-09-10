"""
VitaGuard backend — single FastAPI app serving:
  - Patient records + prediction API
  - Doctor escalation data
  - Hardware ingestion (ESP32 -> /api/hardware/ingest)
  - Dashboard summary metrics

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

The React frontend (frontend/) talks to this over CORS during development.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import patients, prediction, doctors, hardware, dashboard, websocket, api_v1

app = FastAPI(title="VitaGuard API", version="1.0.0")

# Dev origins: Vite's default port is 5173, CRA's is 3000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "VitaGuard backend running"}


app.include_router(patients.router)
app.include_router(prediction.router)
app.include_router(doctors.router)
app.include_router(hardware.router)
app.include_router(dashboard.router)
app.include_router(websocket.router)
app.include_router(api_v1.router)
