export type RiskLevel = 'STABLE' | 'MONITORING' | 'HIGH_RISK' | 'CRITICAL';
export type ClinicalStatus = 'STABLE' | 'MONITORING' | 'DETERIORATING' | 'CRITICAL';
export type AlertEmailStatus = 'PENDING' | 'SENT' | 'COOLDOWN' | 'ACKNOWLEDGED';
export type AlertAckStatus = 'PENDING' | 'SENT' | 'COOLDOWN' | 'ACKNOWLEDGED';
export type MotionStatus = 'RESTING' | 'BED_REST' | 'ACTIVE' | 'AGITATED' | 'FALL_EVENT';
export type DeviceConnectionStatus = 'ONLINE' | 'STANDBY' | 'DISCONNECTED' | 'BATTERY_LOW';
export type WsConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'NO_RECENT_DATA';

export interface TelemetryStreamPacket {
  patient_id?: string;
  patientId?: string;
  device_id?: string;
  deviceId?: string;
  heart_rate?: number;
  heartRate?: number;
  spo2?: number;
  spO2?: number;
  temperature?: number;
  ecg?: number | number[] | string;
  ecg_sample?: number;
  ecgSample?: number;
  ecg_lead?: string;
  ecgLead?: string;
  ecg_rhythm?: string;
  ecgRhythm?: string;
  motion_status?: MotionStatus | string;
  motionStatus?: MotionStatus | string;
  fall_detected?: boolean;
  fallDetected?: boolean;
  device_status?: DeviceConnectionStatus | string;
  deviceStatus?: DeviceConnectionStatus | string;
  battery_level?: number;
  batteryLevel?: number;
  signal_strength_dbm?: number;
  signalStrengthDbm?: number;
  latency_ms?: number;
  latencyMs?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  mrn: string;
  ward: string;
  bed: string;
  currentRisk: RiskLevel;
  currentStatus: ClinicalStatus;
  assignedDoctor: string;
  doctorId: string;
  department: string;
  admissionDate: string;
  primaryDiagnosis: string;
  lastUpdated: string;
  notes?: string;
}

export interface LiveSensorData {
  patientId: string;
  deviceId: string;
  heartRate: number; // BPM
  spO2: number; // %
  temperature: number; // °C
  ecgLead: string; // e.g., 'Lead II'
  ecgSampleRateHz: number;
  ecgRhythm: 'Sinus Rhythm' | 'Sinus Tachycardia' | 'Sinus Bradycardia' | 'Atrial Fibrillation' | 'Ventricular Ectopy';
  motionStatus: MotionStatus;
  fallDetected: boolean;
  deviceStatus: DeviceConnectionStatus;
  batteryLevel: number; // %
  signalStrengthDbm: number;
  latencyMs: number;
  lastUpdated: string;
}

export interface ClinicalInputData {
  patientId: string;
  patientAge: number;
  respiratoryRate: number; // breaths/min
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  map: number; // Mean Arterial Pressure
  avpuConsciousness: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
  supplementalO2LMin: number;
  recordedBy: string;
  timestamp: string;
  clinicalNotes?: string;
}

export interface AIAnalysisData {
  patientId: string;
  patientName: string;
  predictedCondition: string;
  riskLevel: RiskLevel;
  confidence: number; // 0-100%
  assignedDoctor: string;
  department: string;
  analysisTimestamp: string;
  modelIdentifier: string; // "Random Forest Clinical Classifier v2.4"
  recommendedAction: string;
  featureAttributions: {
    feature: string;
    clinicalValue: string;
    normalRange: string;
    importancePercent: number; // 0-100%
    impactDirection: 'ELEVATES_RISK' | 'NORMAL' | 'PROTECTIVE';
  }[];
  clinicalRationale: string;
}

export interface VitalTrendPoint {
  time: string;
  heartRate: number;
  spO2: number;
  temperature: number;
  respiratoryRate: number;
  systolicBP: number;
  diastolicBP: number;
  deteriorationIndex: number;
}

export interface DeteriorationData {
  patientId: string;
  patientName: string;
  deteriorationScore: number; // 0 to 100
  status: ClinicalStatus;
  historicalTrends: VitalTrendPoint[];
  flaggedReasons: string[];
  lastCalculated: string;
  deteriorationVelocity: 'RAPID' | 'MODERATE' | 'SLOW' | 'STEADY';
  baselineValues: {
    heartRate: number;
    spO2: number;
    temperature: number;
    respRate: number;
    bloodPressure: string;
  };
  currentValues: {
    heartRate: number;
    spO2: number;
    temperature: number;
    respRate: number;
    bloodPressure: string;
  };
}

export interface ExplainableRiskFactor {
  parameter: string;
  baseline: string;
  current: string;
  delta: string;
  severity: 'NORMAL' | 'MODERATE' | 'CRITICAL';
  description: string;
}

export interface ExplainableRiskData {
  patientId: string;
  patientName: string;
  riskLevel: RiskLevel;
  deteriorationScore: number;
  reasons: string[];
  factors: ExplainableRiskFactor[];
  aiAttributionNotes: string;
  abnormalDurationMinutes: number;
  backendEndpoint: string;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bed: string;
  predictedCondition: string;
  riskLevel: RiskLevel;
  deteriorationScore: number;
  alertReason: string;
  assignedDoctor: string;
  doctorId: string;
  emailStatus: AlertEmailStatus;
  ackStatus: AlertAckStatus;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  clinicalActionNote?: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  activeCases: number;
  activeAlerts: number;
  email: string;
  pager: string;
  onCall: boolean;
  avatarInitials: string;
}

export interface OverviewMetrics {
  totalPatients: number;
  stablePatients: number;
  monitoringRequired: number;
  highRiskPatients: number;
  criticalPatients: number;
  activeAlerts: number;
  acknowledgedAlertsToday: number;
  iotNodesOnline: number;
  totalIotNodes: number;
}

export interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  travel_time_mins: number;
  primary_specialty: string;
  available_treatments: string[];
  matched_conditions: string[];
  available_icu_beds: number;
  total_icu_beds: number;
  emergency_phone: string;
  coordinator_email: string;
  coordinator_name: string;
  ambulance_priority: string;
  status: string;
}

export interface HospitalTransfer {
  id: number;
  transfer_id: string;
  patient_id: string;
  patient_name: string;
  current_ward?: string;
  condition: string;
  risk_level: string;
  source_hospital: string;
  target_hospital_id: string;
  target_hospital_name: string;
  target_department: string;
  required_treatment: string;
  transport_mode: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  justification_notes?: string;
  attending_physician?: string;
  created_at: string;
  email_sent?: boolean;
}

export type NavigationPage =
  | 'overview'
  | 'live-monitoring'
  | 'patients'
  | 'vitals-entry'
  | 'ai-analysis'
  | 'deterioration'
  | 'explainable-risk'
  | 'clinical-alerts'
  | 'hospital-transfers'
  | 'alert-history'
  | 'doctors'
  | 'api-docs';
