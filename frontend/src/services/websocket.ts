import { TelemetryStreamPacket, WsConnectionStatus, MotionStatus, DeviceConnectionStatus } from '../types';
import { vitaGuardStore } from './api';

/**
 * ============================================================================
 * VitaGuard Real-Time WebSocket Telemetry Service
 * ============================================================================
 *
 * Isolated frontend service for real-time WebSocket streaming of patient
 * biosignal telemetry (Heart Rate, SpO2, Temperature, ECG, Motion, Fall detection).
 *
 * Requirements & Behavior:
 * 1. Reads WebSocket base URL from environment variable: `VITE_WS_BASE_URL`
 * 2. Does not assume a fixed production URL. If `VITE_WS_BASE_URL` is not set,
 *    gracefully falls back to existing mock / REST data without breaking the app.
 * 3. Configurable endpoint pattern: default is `/ws/patients/{patientId}`.
 * 4. Supports the 5 connection states:
 *      • CONNECTING
 *      • CONNECTED
 *      • DISCONNECTED
 *      • ERROR
 *      • NO_RECENT_DATA
 * 5. Automatic connection when a patient is selected, clean disconnection on patient change or unmount,
 *    automatic reconnection with reasonable delay, safe JSON message parsing for partial fields,
 *    and stale data watchdog.
 * ============================================================================
 */

// Read WebSocket base URL strictly from environment variable VITE_WS_BASE_URL
export const getEnvWsBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const envVal = (import.meta as any).env.VITE_WS_BASE_URL;
    if (envVal && typeof envVal === 'string' && envVal.trim() !== '') {
      return envVal.trim();
    }
  }
  return '';
};

export interface WebSocketServiceConfig {
  wsBaseUrl: string;
  endpointPattern: string; // e.g. '/ws/patients/{patientId}'
  staleTimeoutMs: number; // Stale watchdog threshold (default: 8000ms)
  reconnectIntervalMs: number; // Delay between reconnect attempts (default: 3000ms)
  maxReconnectAttempts: number; // Max reconnect retries before state settles to ERROR/DISCONNECTED
  autoFallbackToMock: boolean; // When true and no live WS exists, simulates live sensor micro-fluctuations
}

export type TelemetryDataListener = (packet: TelemetryStreamPacket) => void;
export type StatusChangeListener = (status: WsConnectionStatus, details?: string) => void;
export type ErrorListener = (error: Event | Error | string) => void;

export class WebSocketTelemetryService {
  private socket: WebSocket | null = null;
  private currentPatientId: string | null = null;
  private status: WsConnectionStatus = 'DISCONNECTED';
  private statusMessage: string = 'Service initialized';
  private lastPacketTimestamp: string | null = null;
  private lastPacketReceivedAtMs: number = 0;

  private config: WebSocketServiceConfig = {
    wsBaseUrl: getEnvWsBaseUrl(),
    endpointPattern: '/ws/patients/{patientId}',
    staleTimeoutMs: 8000,
    reconnectIntervalMs: 3000,
    maxReconnectAttempts: 5,
    autoFallbackToMock: true,
  };

  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private staleWatchdogTimer: any = null;
  private fallbackStreamTimer: any = null;
  private isFallbackStreamActive = false;

  private dataListeners: Set<TelemetryDataListener> = new Set();
  private statusListeners: Set<StatusChangeListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();

  /**
   * Check whether a WebSocket base URL is explicitly configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.wsBaseUrl && this.config.wsBaseUrl.trim().length > 0);
  }

  getStatus(): WsConnectionStatus {
    return this.status;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  getLastPacketTimestamp(): string | null {
    return this.lastPacketTimestamp;
  }

  isUsingFallbackStream(): boolean {
    return this.isFallbackStreamActive;
  }

  getConfig(): WebSocketServiceConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<WebSocketServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Constructs the full WebSocket URL for a given patient ID
   */
  buildEndpointUrl(patientId: string): string {
    const base = (this.config.wsBaseUrl || '').replace(/\/+$/, '');
    const path = this.config.endpointPattern
      .replace('{patientId}', encodeURIComponent(patientId))
      .replace('{patient_id}', encodeURIComponent(patientId));
    
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${formattedPath}`;
  }

  /**
   * Subscribe to incoming telemetry packets
   */
  onData(listener: TelemetryDataListener): () => void {
    this.dataListeners.add(listener);
    return () => {
      this.dataListeners.delete(listener);
    };
  }

  /**
   * Subscribe to connection status changes (CONNECTING, CONNECTED, DISCONNECTED, ERROR, NO_RECENT_DATA)
   */
  onStatusChange(listener: StatusChangeListener): () => void {
    this.statusListeners.add(listener);
    // Notify listener immediately of current state
    listener(this.status, this.statusMessage);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Subscribe to errors
   */
  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private setStatus(status: WsConnectionStatus, message?: string) {
    this.status = status;
    if (message !== undefined) {
      this.statusMessage = message;
    }
    this.statusListeners.forEach((fn) => fn(this.status, this.statusMessage));
  }

  /**
   * Connect to WebSocket telemetry for a specific patient.
   * If VITE_WS_BASE_URL is not configured, gracefully falls back to mock/REST stream.
   */
  connect(patientId: string, customWsUrl?: string): void {
    if (!patientId) return;

    // Clean disconnect any prior connection before switching patients
    if (this.currentPatientId && this.currentPatientId !== patientId) {
      this.disconnect();
    }

    this.currentPatientId = patientId;
    this.reconnectAttempts = 0;

    const wsUrl = customWsUrl || (this.isConfigured() ? this.buildEndpointUrl(patientId) : '');

    if (!wsUrl) {
      // No WebSocket URL configured in environment
      if (this.config.autoFallbackToMock) {
        this.setStatus('CONNECTED', 'Using Mock / REST Baseline Telemetry (VITE_WS_BASE_URL not set)');
        this.startFallbackStream(patientId);
      } else {
        this.setStatus('DISCONNECTED', 'VITE_WS_BASE_URL not configured in environment');
      }
      return;
    }

    this.establishConnection(wsUrl, patientId);
  }

  /**
   * Patient-specific connection helper alias
   */
  connectToPatient(patientId: string): void {
    this.connect(patientId);
  }

  private establishConnection(url: string, patientId: string): void {
    this.setStatus('CONNECTING', `Connecting to WebSocket at ${url}...`);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        if (this.currentPatientId !== patientId) return;

        this.reconnectAttempts = 0;
        this.stopFallbackStream();
        this.setStatus('CONNECTED', `Connected to WebSocket endpoint for patient ${patientId}`);
        this.startStaleWatchdog();

        // Send optional handshake message if supported by backend
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
            this.socket.send(
              JSON.stringify({
                action: 'subscribe',
                patient_id: patientId,
                timestamp: new Date().toISOString(),
              })
            );
          } catch {
            // Non-fatal handshake send error
          }
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        if (this.currentPatientId !== patientId) return;
        this.parseAndDispatchMessage(event.data, patientId);
      };

      this.socket.onerror = (errorEvent: Event) => {
        this.errorListeners.forEach((fn) => fn(errorEvent));
        this.setStatus('ERROR', `WebSocket error on endpoint: ${url}`);
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.stopStaleWatchdog();
        
        if (this.currentPatientId === patientId) {
          if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts += 1;
            this.setStatus(
              'CONNECTING',
              `Connection lost (code: ${event.code}). Reconnecting attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}...`
            );
            this.reconnectTimer = setTimeout(() => {
              this.establishConnection(url, patientId);
            }, this.config.reconnectIntervalMs);
          } else {
            this.setStatus('ERROR', `WebSocket closed (code: ${event.code || '1006'}). Reconnection limit reached.`);
            if (this.config.autoFallbackToMock) {
              this.startFallbackStream(patientId);
            }
          }
        }
      };
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize WebSocket client';
      this.errorListeners.forEach((fn) => fn(err));
      this.setStatus('ERROR', msg);

      if (this.config.autoFallbackToMock) {
        this.startFallbackStream(patientId);
      }
    }
  }

  /**
   * Cleanly disconnects the current WebSocket, clears timers, and resets state.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopStaleWatchdog();
    this.stopFallbackStream();

    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch {
        // Safe close catch
      }
      this.socket = null;
    }

    this.currentPatientId = null;
    this.setStatus('DISCONNECTED', 'Telemetry stream disconnected');
  }

  /**
   * Safe JSON message parsing supporting partial fields, snake_case, and camelCase
   */
  private parseAndDispatchMessage(rawData: any, targetPatientId: string): void {
    let parsed: any;
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch {
        // If string payload is non-JSON
        console.warn('Received non-JSON WebSocket message:', rawData);
        return;
      }
    } else if (typeof rawData === 'object' && rawData !== null) {
      parsed = rawData;
    } else {
      return;
    }

    const nowIso = new Date().toISOString();
    const packetTimestamp = parsed.timestamp || parsed.time || parsed.created_at || nowIso;

    // Normalize expected fields: patient_id, heart_rate, spo2, temperature, ecg, motion_status, fall_detected, timestamp, device_status
    const packet: TelemetryStreamPacket = {
      patient_id: parsed.patient_id || parsed.patientId || targetPatientId,
      patientId: parsed.patientId || parsed.patient_id || targetPatientId,
      device_id: parsed.device_id || parsed.deviceId,
      deviceId: parsed.deviceId || parsed.device_id,
      heart_rate: parsed.heart_rate !== undefined ? Number(parsed.heart_rate) : (parsed.heartRate !== undefined ? Number(parsed.heartRate) : undefined),
      heartRate: parsed.heartRate !== undefined ? Number(parsed.heartRate) : (parsed.heart_rate !== undefined ? Number(parsed.heart_rate) : undefined),
      spo2: parsed.spo2 !== undefined ? Number(parsed.spo2) : (parsed.spO2 !== undefined ? Number(parsed.spO2) : undefined),
      spO2: parsed.spO2 !== undefined ? Number(parsed.spO2) : (parsed.spo2 !== undefined ? Number(parsed.spo2) : undefined),
      temperature: parsed.temperature !== undefined ? Number(parsed.temperature) : (parsed.temp !== undefined ? Number(parsed.temp) : undefined),
      ecg: parsed.ecg ?? parsed.ecgSample ?? parsed.ecg_sample,
      ecg_sample: parsed.ecg_sample !== undefined ? Number(parsed.ecg_sample) : (parsed.ecgSample !== undefined ? Number(parsed.ecgSample) : undefined),
      ecgSample: parsed.ecgSample !== undefined ? Number(parsed.ecgSample) : (parsed.ecg_sample !== undefined ? Number(parsed.ecg_sample) : undefined),
      ecg_lead: parsed.ecg_lead || parsed.ecgLead,
      ecgLead: parsed.ecgLead || parsed.ecg_lead,
      ecg_rhythm: parsed.ecg_rhythm || parsed.ecgRhythm,
      ecgRhythm: parsed.ecgRhythm || parsed.ecg_rhythm,
      motion_status: (parsed.motion_status || parsed.motionStatus) as MotionStatus | undefined,
      motionStatus: (parsed.motionStatus || parsed.motion_status) as MotionStatus | undefined,
      fall_detected: parsed.fall_detected !== undefined ? Boolean(parsed.fall_detected) : (parsed.fallDetected !== undefined ? Boolean(parsed.fallDetected) : undefined),
      fallDetected: parsed.fallDetected !== undefined ? Boolean(parsed.fallDetected) : (parsed.fall_detected !== undefined ? Boolean(parsed.fall_detected) : undefined),
      device_status: (parsed.device_status || parsed.deviceStatus) as DeviceConnectionStatus | undefined,
      deviceStatus: (parsed.deviceStatus || parsed.device_status) as DeviceConnectionStatus | undefined,
      battery_level: parsed.battery_level !== undefined ? Number(parsed.battery_level) : (parsed.batteryLevel !== undefined ? Number(parsed.batteryLevel) : undefined),
      batteryLevel: parsed.batteryLevel !== undefined ? Number(parsed.batteryLevel) : (parsed.battery_level !== undefined ? Number(parsed.battery_level) : undefined),
      signal_strength_dbm: parsed.signal_strength_dbm !== undefined ? Number(parsed.signal_strength_dbm) : (parsed.signalStrengthDbm !== undefined ? Number(parsed.signalStrengthDbm) : undefined),
      signalStrengthDbm: parsed.signalStrengthDbm !== undefined ? Number(parsed.signalStrengthDbm) : (parsed.signal_strength_dbm !== undefined ? Number(parsed.signal_strength_dbm) : undefined),
      latency_ms: parsed.latency_ms !== undefined ? Number(parsed.latency_ms) : (parsed.latencyMs !== undefined ? Number(parsed.latencyMs) : undefined),
      latencyMs: parsed.latencyMs !== undefined ? Number(parsed.latencyMs) : (parsed.latency_ms !== undefined ? Number(parsed.latency_ms) : undefined),
      timestamp: packetTimestamp,
    };

    this.lastPacketTimestamp = packetTimestamp;
    this.lastPacketReceivedAtMs = Date.now();

    // If previously in NO_RECENT_DATA or CONNECTING, restore CONNECTED
    if (this.status === 'NO_RECENT_DATA' || this.status === 'CONNECTING') {
      this.setStatus('CONNECTED', 'Streaming live telemetry data');
    }

    // Reset stale timer
    this.resetStaleWatchdog();

    // Dispatch to subscribers
    this.dataListeners.forEach((fn) => fn(packet));

    // Update global store if vital fields are present
    const storeUpdate: any = {};
    if (packet.heartRate !== undefined) storeUpdate.heartRate = packet.heartRate;
    if (packet.spO2 !== undefined) storeUpdate.spO2 = packet.spO2;
    if (packet.temperature !== undefined) storeUpdate.temperature = packet.temperature;
    if (packet.ecgRhythm) storeUpdate.ecgRhythm = packet.ecgRhythm;
    if (packet.ecgLead) storeUpdate.ecgLead = packet.ecgLead;
    if (packet.motionStatus) storeUpdate.motionStatus = packet.motionStatus;
    if (packet.fallDetected !== undefined) storeUpdate.fallDetected = packet.fallDetected;
    if (packet.batteryLevel !== undefined) storeUpdate.batteryLevel = packet.batteryLevel;
    if (packet.signalStrengthDbm !== undefined) storeUpdate.signalStrengthDbm = packet.signalStrengthDbm;
    if (packet.latencyMs !== undefined) storeUpdate.latencyMs = packet.latencyMs;
    storeUpdate.lastUpdated = packet.timestamp;

    if (Object.keys(storeUpdate).length > 0) {
      vitaGuardStore.updateLiveSensorData(targetPatientId, storeUpdate);
    }
  }

  /**
   * Watchdog timer: checks for stalls or lack of recent data
   */
  private startStaleWatchdog(): void {
    this.stopStaleWatchdog();
    this.staleWatchdogTimer = setInterval(() => {
      if (this.status === 'CONNECTED' && this.lastPacketReceivedAtMs > 0) {
        const elapsed = Date.now() - this.lastPacketReceivedAtMs;
        if (elapsed > this.config.staleTimeoutMs) {
          this.setStatus(
            'NO_RECENT_DATA',
            `No telemetry data received for ${Math.round(elapsed / 1000)}s`
          );
        }
      }
    }, 2000);
  }

  private resetStaleWatchdog(): void {
    this.lastPacketReceivedAtMs = Date.now();
  }

  private stopStaleWatchdog(): void {
    if (this.staleWatchdogTimer) {
      clearInterval(this.staleWatchdogTimer);
      this.staleWatchdogTimer = null;
    }
  }

  /**
   * Fallback mock stream: used when VITE_WS_BASE_URL is not configured
   */
  startFallbackStream(patientId: string): void {
    this.stopFallbackStream();
    this.isFallbackStreamActive = true;

    const sensor = vitaGuardStore.liveSensors[patientId] || vitaGuardStore.liveSensors['PT-101'];
    let baseHR = sensor?.heartRate || 75;
    let baseSpO2 = sensor?.spO2 || 98;
    let baseTemp = sensor?.temperature || 37.0;

    this.fallbackStreamTimer = setInterval(() => {
      const hrVariance = (Math.random() - 0.48) * 1.5;
      const spo2Variance = Math.random() > 0.85 ? (Math.random() > 0.5 ? 0.3 : -0.3) : 0;
      const tempVariance = (Math.random() - 0.5) * 0.04;

      const currentHR = Math.round(Math.max(45, Math.min(170, baseHR + hrVariance)));
      const currentSpO2 = Math.round(Math.max(82, Math.min(100, baseSpO2 + spo2Variance)));
      const currentTemp = Number((baseTemp + tempVariance).toFixed(1));

      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      const mockPacket: TelemetryStreamPacket = {
        patient_id: patientId,
        patientId: patientId,
        device_id: sensor?.deviceId || `ESP32-NODE-${patientId}`,
        deviceId: sensor?.deviceId || `ESP32-NODE-${patientId}`,
        heart_rate: currentHR,
        heartRate: currentHR,
        spo2: currentSpO2,
        spO2: currentSpO2,
        temperature: currentTemp,
        ecg_lead: sensor?.ecgLead || 'Lead II',
        ecgLead: sensor?.ecgLead || 'Lead II',
        ecg_rhythm: sensor?.ecgRhythm || 'Sinus Rhythm',
        ecgRhythm: sensor?.ecgRhythm || 'Sinus Rhythm',
        motion_status: sensor?.motionStatus || 'RESTING',
        motionStatus: sensor?.motionStatus || 'RESTING',
        fall_detected: Boolean(sensor?.fallDetected),
        fallDetected: Boolean(sensor?.fallDetected),
        device_status: 'ONLINE',
        deviceStatus: 'ONLINE',
        battery_level: sensor?.batteryLevel || 94,
        batteryLevel: sensor?.batteryLevel || 94,
        signal_strength_dbm: -58 + Math.floor((Math.random() - 0.5) * 4),
        latency_ms: 22 + Math.floor(Math.random() * 10),
        timestamp: timeStr,
      };

      this.parseAndDispatchMessage(mockPacket, patientId);
    }, 1000);
  }

  stopFallbackStream(): void {
    if (this.fallbackStreamTimer) {
      clearInterval(this.fallbackStreamTimer);
      this.fallbackStreamTimer = null;
    }
    this.isFallbackStreamActive = false;
  }
}

// Global isolated instance
export const telemetryStreamService = new WebSocketTelemetryService();

/**
 * FastAPI Reference Documentation for Backend Engineers
 */
export const FASTAPI_WEBSOCKET_BACKEND_CODE = `# =====================================================================
# VitaGuard FastAPI WebSocket Telemetry Implementation
# Save this in: app/routers/sensors.py (or main.py)
# =====================================================================
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/ws", tags=["Real-Time WebSockets"])

class TelemetryConnectionManager:
    def __init__(self):
        # Maps patient_id -> Set of active WebSocket client connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, patient_id: str, websocket: WebSocket):
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = set()
        self.active_connections[patient_id].add(websocket)

    def disconnect(self, patient_id: str, websocket: WebSocket):
        if patient_id in self.active_connections:
            self.active_connections[patient_id].discard(websocket)
            if not self.active_connections[patient_id]:
                del self.active_connections[patient_id]

    async def broadcast_patient_telemetry(self, patient_id: str, packet: dict):
        """
        Broadcasts incoming ESP32 biosignals to all connected clinical monitors
        """
        if patient_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[patient_id]:
                try:
                    await connection.send_json(packet)
                except Exception:
                    dead_connections.add(connection)
            for dead in dead_connections:
                self.disconnect(patient_id, dead)

manager = TelemetryConnectionManager()

@router.websocket("/patients/{patient_id}")
async def websocket_patient_telemetry(websocket: WebSocket, patient_id: str):
    """
    WebSocket endpoint for real-time patient biosignal streaming
    Path: ws://{host}:{port}/ws/patients/{patient_id}
    """
    await manager.connect(patient_id, websocket)
    try:
        while True:
            # Receive client ping or heartbeat commands
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(patient_id, websocket)

# Example: When ESP32 posts telemetry via MQTT or HTTP:
# @router.post("/sensors/ingest/{patient_id}")
# async def ingest_esp32_packet(patient_id: str, telemetry: dict):
#     telemetry["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
#     await manager.broadcast_patient_telemetry(patient_id, telemetry)
#     return {"status": "broadcasted"}
`;
