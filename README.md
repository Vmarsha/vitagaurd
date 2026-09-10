# VitaGuard — Integrated Project

This folder combines the Google AI Studio React/TypeScript dashboard with the VitaGuard FastAPI, SQLite, ML, alert and ESP32 backend.

## Run backend

```bash
cd backend
python -m venv .venv
# Activate it, then:
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend health: `http://localhost:8000/api/health`

## Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Important routes

- REST frontend compatibility API: `/api/v1/...`
- Existing hardware ingest: `POST /api/hardware/ingest`
- WebSocket telemetry: `/api/v1/ws/patients/{patient_id}`

The ESP32 posts readings to the existing hardware endpoint. Each patient-specific reading is then broadcast to connected Live Monitoring WebSocket clients.

## Development note

The frontend mock data remains as a fallback. With both environment variables configured, REST pages use the real FastAPI backend and Live Monitoring can receive WebSocket telemetry.

This is an educational/research prototype, not a certified medical device.
