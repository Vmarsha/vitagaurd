import {
  Patient,
  LiveSensorData,
  ClinicalInputData,
  AIAnalysisData,
  DeteriorationData,
  ExplainableRiskData,
  ClinicalAlert,
  Doctor,
  OverviewMetrics,
  AlertAckStatus,
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_LIVE_SENSOR_DATA,
  INITIAL_CLINICAL_INPUTS,
  INITIAL_AI_ANALYSIS,
  INITIAL_DETERIORATION_DATA,
  INITIAL_EXPLAINABLE_RISK,
  INITIAL_CLINICAL_ALERTS,
  INITIAL_DOCTORS,
  INITIAL_OVERVIEW_METRICS,
} from './mockData';

/**
 * VitaGuard Clinical API Service
 * -------------------------------------------------------------
 * This service is configured to either use local clinical state or connect
 * directly to the external FastAPI REST API backend (which integrates SQLite,
 * the Random Forest ML classifier, and ESP32 hardware streaming).
 *
 * To connect to FastAPI, set VITE_API_BASE_URL (e.g. http://localhost:8000/api/v1)
 */

const rawEnvUrl: string =
  (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_API_BASE_URL) || '';

export const API_BASE_URL: string = rawEnvUrl
  ? (rawEnvUrl.endsWith('/api/v1') ? rawEnvUrl : rawEnvUrl.replace(/\/+$/, '') + '/api/v1')
  : '';
export const IS_API_CONNECTED = Boolean(API_BASE_URL);

export interface AppState {
  patients: Patient[];
  liveSensors: Record<string, LiveSensorData>;
  clinicalInputs: Record<string, ClinicalInputData>;
  aiAnalysis: Record<string, AIAnalysisData>;
  deterioration: Record<string, DeteriorationData>;
  explainableRisk: Record<string, ExplainableRiskData>;
  alerts: ClinicalAlert[];
  doctors: Doctor[];
  metrics: OverviewMetrics;
  isCleanMode: boolean;
}

// In-memory state store for responsive client-side interactions
class VitaGuardStore {
  isCleanMode: boolean = true;
  patients: Patient[] = [];
  liveSensors: Record<string, LiveSensorData> = {};
  clinicalInputs: Record<string, ClinicalInputData> = {};
  aiAnalysis: Record<string, AIAnalysisData> = {};
  deterioration: Record<string, DeteriorationData> = {};
  explainableRisk: Record<string, ExplainableRiskData> = {};
  alerts: ClinicalAlert[] = [];
  doctors: Doctor[] = [...INITIAL_DOCTORS];
  metrics: OverviewMetrics = {
    totalPatients: 0,
    criticalAlerts: 0,
    monitoredWards: 0,
    highRiskPatients: 0,
    averageRiskScore: 0,
    iotNodesOnline: 0,
  };

  getState(): AppState {
    return {
      patients: this.patients,
      liveSensors: this.liveSensors,
      clinicalInputs: this.clinicalInputs,
      aiAnalysis: this.aiAnalysis,
      deterioration: this.deterioration,
      explainableRisk: this.explainableRisk,
      alerts: this.alerts,
      doctors: this.doctors,
      metrics: this.metrics,
      isCleanMode: this.isCleanMode,
    };
  }

  // Toggle between Clean Real-Time Hardware Mode and Demo Ward Mode
  toggleMode() {
    if (this.isCleanMode) {
      // Load Full Ward Demo Data
      this.isCleanMode = false;
      this.patients = [...INITIAL_PATIENTS];
      this.liveSensors = { ...INITIAL_LIVE_SENSOR_DATA };
      this.clinicalInputs = { ...INITIAL_CLINICAL_INPUTS };
      this.aiAnalysis = { ...INITIAL_AI_ANALYSIS };
      this.deterioration = { ...INITIAL_DETERIORATION_DATA };
      this.explainableRisk = { ...INITIAL_EXPLAINABLE_RISK };
      this.alerts = [...INITIAL_CLINICAL_ALERTS];
      this.metrics = { ...INITIAL_OVERVIEW_METRICS };
    } else {
      // Clear all mock data for 100% Pure Real-Time Mode
      this.isCleanMode = true;
      this.patients = [];
      this.liveSensors = {};
      this.clinicalInputs = {};
      this.aiAnalysis = {};
      this.deterioration = {};
      this.explainableRisk = {};
      this.alerts = [];
      this.metrics = {
        totalPatients: 0,
        criticalAlerts: 0,
        monitoredWards: 0,
        highRiskPatients: 0,
        averageRiskScore: 0,
        iotNodesOnline: 0,
      };
    }
    this.notify();
  }

  // Listeners for UI state syncing
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((l) => l());
  }

  acknowledgeAlert(alertId: string, doctorName: string, notes?: string): ClinicalAlert | null {
    const alertIndex = this.alerts.findIndex((a) => a.id === alertId);
    if (alertIndex === -1) return null;

    const updatedAlert: ClinicalAlert = {
      ...this.alerts[alertIndex],
      ackStatus: 'ACKNOWLEDGED' as AlertAckStatus,
      emailStatus: 'ACKNOWLEDGED',
      acknowledgedBy: doctorName,
      acknowledgedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      clinicalActionNote: notes || 'Clinical acknowledgement confirmed by attending team.',
    };

    this.alerts[alertIndex] = updatedAlert;
    this.metrics.activeAlerts = this.alerts.filter(
      (a) => a.ackStatus === 'PENDING' || a.ackStatus === 'SENT'
    ).length;
    this.metrics.acknowledgedAlertsToday += 1;

    this.notify();
    return updatedAlert;
  }

  admitPatient(patient: Patient, pairedDeviceId: string = 'ESP32-001'): Patient {
    const existingIdx = this.patients.findIndex((p) => p.id === patient.id);
    if (existingIdx !== -1) {
      this.patients[existingIdx] = { ...this.patients[existingIdx], ...patient };
    } else {
      this.patients.unshift(patient);
      this.metrics.totalPatients += 1;
      this.metrics.stablePatients += 1;
    }

    if (!this.liveSensors[patient.id]) {
      this.liveSensors[patient.id] = {
        patientId: patient.id,
        heartRate: 74,
        spO2: 98.2,
        temperature: 37.0,
        ecgLead: 'Lead II',
        ecgRhythm: 'Sinus Rhythm',
        motionStatus: 'RESTING',
        fallDetected: false,
        batteryLevel: 98,
        signalStrengthDbm: -54,
        latencyMs: 16,
        deviceId: pairedDeviceId || 'ESP32-001',
        lastUpdated: 'Just connected',
      };
    }

    this.notify();
    return patient;
  }

  addClinicalEntry(entry: ClinicalInputData): void {
    this.clinicalInputs[entry.patientId] = entry;

    // Check if patient exists and update vitals
    const patientIndex = this.patients.findIndex((p) => p.id === entry.patientId);
    if (patientIndex !== -1) {
      this.patients[patientIndex].lastUpdated = 'Just now';
    }

    // Update or calculate deterioration index
    const det = this.deterioration[entry.patientId];
    if (det) {
      const nowStr = new Date().toTimeString().substring(0, 5);
      const newTrendPoint = {
        time: nowStr,
        heartRate: this.liveSensors[entry.patientId]?.heartRate || 75,
        spO2: this.liveSensors[entry.patientId]?.spO2 || 98,
        temperature: this.liveSensors[entry.patientId]?.temperature || 37.0,
        respiratoryRate: entry.respiratoryRate,
        systolicBP: entry.systolicBP,
        diastolicBP: entry.diastolicBP,
        deteriorationIndex: det.deteriorationScore,
      };
      det.historicalTrends = [...det.historicalTrends.slice(-10), newTrendPoint];
      det.currentValues.respRate = entry.respiratoryRate;
      det.currentValues.bloodPressure = `${entry.systolicBP}/${entry.diastolicBP} mmHg`;
      det.lastCalculated = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }

    this.notify();
  }

  updateLiveSensorData(patientId: string, data: Partial<LiveSensorData>): LiveSensorData | null {
    const existing = this.liveSensors[patientId];
    if (!existing) return null;

    const updated: LiveSensorData = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };
    this.liveSensors[patientId] = updated;

    // Also update deterioration current values
    const det = this.deterioration[patientId];
    if (det) {
      if (data.heartRate) det.currentValues.heartRate = data.heartRate;
      if (data.spO2) det.currentValues.spO2 = data.spO2;
      if (data.temperature) det.currentValues.temperature = data.temperature;
    }

    this.notify();
    return updated;
  }
}

export const vitaGuardStore = new VitaGuardStore();

/**
 * Unified API Client for VitaGuard
 */
export const VitaGuardAPI = {
  /**
   * GET /api/v1/overview/metrics
   * Retrieves summary statistics for the clinical overview
   */
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/overview/metrics`);
      if (!res.ok) throw new Error('Failed to fetch overview metrics');
      return res.json();
    }
    return { ...vitaGuardStore.metrics };
  },

  /**
   * GET /api/v1/patients
   * Retrieves all admitted patients
   */
  async getPatients(riskFilter?: string, query?: string): Promise<Patient[]> {
    if (IS_API_CONNECTED) {
      const url = new URL(`${API_BASE_URL}/patients`);
      if (riskFilter && riskFilter !== 'ALL') url.searchParams.append('risk', riskFilter);
      if (query) url.searchParams.append('q', query);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    }

    let results = [...vitaGuardStore.patients];
    if (riskFilter && riskFilter !== 'ALL') {
      results = results.filter((p) => p.currentRisk === riskFilter);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.assignedDoctor.toLowerCase().includes(q) ||
          p.ward.toLowerCase().includes(q)
      );
    }
    return results;
  },

  /**
   * GET /api/v1/patients/{patient_id}
   */
  async getPatientById(id: string): Promise<Patient | undefined> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/patients/${id}`);
      if (!res.ok) return undefined;
      return res.json();
    }
    return vitaGuardStore.patients.find((p) => p.id === id);
  },

  /**
   * POST /api/v1/patients
   * Admits and registers a new patient
   */
  async admitPatient(patient: Patient): Promise<{ success: boolean; patient: Patient }> {
    const localPatient = vitaGuardStore.admitPatient(patient);
    if (IS_API_CONNECTED) {
      try {
        await fetch(`${API_BASE_URL}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            ward: patient.ward,
            room: patient.bed,
          }),
        });
      } catch (err) {
        console.warn('Could not sync patient admission to backend:', err);
      }
    }
    return { success: true, patient: localPatient };
  },

  /**
   * GET /api/v1/sensors/live/{patient_id}
   * Fetches latest ESP32 IoT telemetry stream packet
   */
  async getLiveSensorData(patientId: string): Promise<LiveSensorData | undefined> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/sensors/live/${patientId}`);
      if (!res.ok) throw new Error(`Live sensor telemetry unavailable for ${patientId}`);
      return res.json();
    }
    return vitaGuardStore.liveSensors[patientId];
  },

  /**
   * POST /api/v1/vitals/clinical-entry
   * Submits newly measured clinical input data (Age, RR, BP)
   */
  async submitClinicalEntry(entry: ClinicalInputData): Promise<{ success: boolean; message: string }> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/vitals/clinical-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error('Failed to submit clinical vital entry');
      return res.json();
    }

    vitaGuardStore.addClinicalEntry(entry);
    return { success: true, message: `Clinical vitals logged successfully for patient ${entry.patientId}` };
  },

  /**
   * Alias for submitting clinical vitals
   */
  async submitClinicalVitals(entry: ClinicalInputData): Promise<{ success: boolean; message: string }> {
    return this.submitClinicalEntry(entry);
  },

  /**
   * Updates live sensor data in store or via REST API
   */
  async updateLiveSensor(
    patientId: string,
    data: Partial<LiveSensorData>
  ): Promise<LiveSensorData | null> {

    // The ESP32/backend is the source of live sensor data.
    // Update the frontend store only.
    return vitaGuardStore.updateLiveSensorData(patientId, data);
  },

  /**
   * GET /api/v1/ai/analysis/{patient_id}
   * Retrieves Random Forest model inference results & confidence
   */
  async getAIAnalysis(patientId: string): Promise<AIAnalysisData | undefined> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/ai/analysis/${patientId}`);
      if (!res.ok) return undefined;
      return res.json();
    }
    return vitaGuardStore.aiAnalysis[patientId];
  },

  /**
   * GET /api/v1/deterioration/{patient_id}
   * Retrieves Deterioration Score (0-100) and historical trend curves
   */
  async getDeteriorationData(patientId: string): Promise<DeteriorationData | undefined> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/deterioration/${patientId}`);
      if (!res.ok) return undefined;
      return res.json();
    }
    return vitaGuardStore.deterioration[patientId];
  },

  /**
   * GET /api/v1/ai/explain/{patient_id}
   * Retrieves explainable risk attribution data (WHY was patient flagged)
   */
  async getExplainableRisk(patientId: string): Promise<ExplainableRiskData | undefined> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/ai/explain/${patientId}`);
      if (!res.ok) return undefined;
      return res.json();
    }
    return vitaGuardStore.explainableRisk[patientId];
  },

  /**
   * GET /api/v1/alerts
   * Retrieves clinical escalation alerts with optional status filtering
   */
  async getClinicalAlerts(statusFilter?: string): Promise<ClinicalAlert[]> {
    if (IS_API_CONNECTED) {
      const url = new URL(`${API_BASE_URL}/alerts`);
      if (statusFilter && statusFilter !== 'ALL') url.searchParams.append('status', statusFilter);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch clinical alerts');
      return res.json();
    }

    if (statusFilter && statusFilter !== 'ALL') {
      return vitaGuardStore.alerts.filter((a) => a.ackStatus === statusFilter || a.emailStatus === statusFilter);
    }
    return [...vitaGuardStore.alerts];
  },

  /**
   * POST /api/v1/alerts/{alert_id}/acknowledge
   * Submits clinical acknowledgment by an attending doctor
   */
  async acknowledgeAlert(
    alertId: string,
    doctorName: string,
    notes?: string
  ): Promise<{ success: boolean; alert: ClinicalAlert | null }> {
    // 1. Immediately update client-side store state so UI reactive subscriptions re-render
    const alert = vitaGuardStore.acknowledgeAlert(alertId, doctorName, notes);

    // 2. Synchronize acknowledgement with backend
    if (IS_API_CONNECTED) {
      try {
        await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctor_name: doctorName, notes }),
        });
      } catch (err) {
        console.warn('Could not sync alert acknowledgement to backend:', err);
      }
    }

    return { success: true, alert };
  },

  /**
   * GET /api/v1/doctors
   * Retrieves clinical doctor roster and on-call assignments
   */
  async getDoctors(): Promise<Doctor[]> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/doctors`);
      if (!res.ok) throw new Error('Failed to fetch clinical staff');
      return res.json();
    }
    return [...vitaGuardStore.doctors];
  },

  /**
   * GET /api/v1/hospitals/nearby
   * Retrieves partner hospitals with matched capabilities & real-time ICU beds
   */
  async getNearbyHospitals(condition?: string): Promise<any[]> {
    if (IS_API_CONNECTED) {
      const url = new URL(`${API_BASE_URL}/hospitals/nearby`);
      if (condition) url.searchParams.append('condition', condition);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch nearby partner hospitals');
      return res.json();
    }
    return [];
  },

  /**
   * POST /api/v1/transfers/escalate
   * Dispatches an inter-hospital transfer request & alerts destination hospital
   */
  async escalateHospitalTransfer(payload: {
    patient_id: string;
    target_hospital_id: string;
    required_treatment: string;
    justification_notes: string;
    attending_physician: string;
    transport_mode?: string;
  }): Promise<{ success: boolean; transfer?: any }> {
    if (IS_API_CONNECTED) {
      const res = await fetch(`${API_BASE_URL}/transfers/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to initiate inter-hospital transfer');
      return res.json();
    }
    return { success: true };
  },

  /**
   * GET /api/v1/transfers
   */
  async getTransfers(patientId?: string): Promise<any[]> {
    if (IS_API_CONNECTED) {
      const url = new URL(`${API_BASE_URL}/transfers`);
      if (patientId) url.searchParams.append('patient_id', patientId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch hospital transfers');
      return res.json();
    }
    return [];
  },
};
