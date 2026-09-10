import React, { useEffect, useRef, useState } from 'react';
import {
  Radio,
  Heart,
  Activity,
  Thermometer,
  Zap,
  BatteryCharging,
  Wifi,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Brain,
  Server,
  RefreshCw,
  LayoutGrid,
  MonitorPlay,
  Users,
  Eye,
  Sparkles,
} from 'lucide-react';

import {
  Patient,
  LiveSensorData,
  ClinicalInputData,
  NavigationPage,
  MotionStatus,
} from '../types';

import { VitalCard } from '../components/common/VitalCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ECGWaveform } from '../components/common/ECGWaveform';

interface LiveMonitoringPageProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  liveSensors: Record<string, LiveSensorData>;
  clinicalInputs: Record<string, ClinicalInputData>;
  onNavigate: (page: NavigationPage) => void;
  onOpenAdmitModal?: () => void;
  onUpdateSensor?: (
    patientId: string,
    data: Partial<LiveSensorData>
  ) => void;
}

interface HardwareReading {
  id: number;
  patient_id: string;
  source: string;
  device_id: string;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  respiratory_rate?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  ecg_raw: number | null;
  fall_detected: number | boolean;
  created_at: string;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  liveSensors,
  clinicalInputs: _clinicalInputs,
  onNavigate,
  onOpenAdmitModal,
  onUpdateSensor,
}) => {
  const patient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Map each patient to their actual hardware device.
  const patientDeviceMap: Record<string, string> = {
    'PT-101': 'ESP32-001',
  };

  const selectedDeviceId = patient?.id
    ? patientDeviceMap[patient.id]
    : undefined;

  // Never use PT-101 data as a fallback for another patient.
  const initialSensor = patient?.id
    ? liveSensors[patient.id]
    : undefined;

  /*
   * LIVE VITAL STATE
   */
  const [liveVitals, setLiveVitals] = useState({
    heartRate: initialSensor?.heartRate || 75,
    spO2: initialSensor?.spO2 || 98,
    temperature: initialSensor?.temperature || 37.0,
    ecgLead: initialSensor?.ecgLead || 'Lead II',
    ecgRhythm: initialSensor?.ecgRhythm || 'Sinus Rhythm',
    motionStatus:
      initialSensor?.motionStatus || ('RESTING' as MotionStatus),
    fallDetected: initialSensor?.fallDetected || false,
    batteryLevel: initialSensor?.batteryLevel || 92,
    signalStrengthDbm: initialSensor?.signalStrengthDbm || -58,
    latencyMs: initialSensor?.latencyMs || 24,
    deviceId: initialSensor?.deviceId || 'ESP32-001',
    lastUpdated: initialSensor?.lastUpdated || 'Awaiting data...',
  });

  /*
   * API CONNECTION STATE
   */
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bedside' | 'ward_grid'>('bedside');

  /*
   * LAST UPDATED TIMER
   */
  const [timeAgoText, setTimeAgoText] =
    useState<string>('Awaiting data');

  const lastPacketTimeRef = useRef<number>(Date.now());

  /*
   * Keeps track of the latest reading so the
   * "Last updated" timer only resets when new
   * sensor data actually arrives.
   */
  const lastReadingKeyRef = useRef<string | null>(null);

  /*
   * FETCH REAL DATA FROM FASTAPI
   *
   * Endpoint already tested successfully:
   * GET /api/hardware/latest/ESP32-001
   */
  useEffect(() => {
    let isActive = true;

    const fetchLatestReading = async () => {
      if (!patient?.id || !selectedDeviceId) {
        if (isActive) {
          setApiConnected(false);
          setApiError('No hardware device connected to this patient');
          setLiveVitals((previous) => ({
            ...previous,
            deviceId: 'No device',
            lastUpdated: 'No hardware connected',
          }));
        }
        return;
      }

      try {
        const startTime = Date.now();
        const response = await fetch(
          `http://localhost:8000/api/hardware/latest/${selectedDeviceId}`
        );

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const data: HardwareReading = await response.json();

        if (data.patient_id && data.patient_id !== patient.id) {
          throw new Error(
            `Device ${selectedDeviceId} is assigned to ${data.patient_id}, not ${patient.id}`
          );
        }

        const latency = Date.now() - startTime;
        const readingKey = `${data.id}-${data.created_at}`;

        if (!isActive) return;

        setLiveVitals((previous) => ({
          ...previous,
          heartRate: data.heart_rate ?? previous.heartRate,
          spO2: data.spo2 ?? previous.spO2,
          temperature: data.temperature ?? previous.temperature,
          deviceId: data.device_id || selectedDeviceId,
          fallDetected:
            data.fall_detected !== undefined && data.fall_detected !== null
              ? Boolean(data.fall_detected)
              : previous.fallDetected,
          latencyMs: latency,
          lastUpdated: data.created_at || new Date().toLocaleString(),
        }));

        if (lastReadingKeyRef.current !== readingKey) {
          lastReadingKeyRef.current = readingKey;
          lastPacketTimeRef.current = Date.now();
        }

        if (onUpdateSensor) {
          const updatePayload: Partial<LiveSensorData> = {};
          if (data.heart_rate !== null) updatePayload.heartRate = data.heart_rate;
          if (data.spo2 !== null) updatePayload.spO2 = data.spo2;
          if (data.temperature !== null) updatePayload.temperature = data.temperature;
          if (data.fall_detected !== undefined) {
            updatePayload.fallDetected = Boolean(data.fall_detected);
          }
          if (data.created_at) updatePayload.lastUpdated = data.created_at;

          onUpdateSensor(patient.id, updatePayload);
        }

        setApiConnected(true);
        setApiError(null);
      } catch (error) {
        console.error('Failed to fetch VitaGuard sensor data:', error);
        if (!isActive) return;
        setApiConnected(false);
        setApiError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to VitaGuard backend'
        );
      }
    };

    fetchLatestReading();

    const interval = selectedDeviceId
      ? setInterval(fetchLatestReading, 2000)
      : undefined;

    return () => {
      isActive = false;
      if (interval) clearInterval(interval);
    };
  }, [patient?.id, selectedDeviceId, onUpdateSensor]);


  /*
   * UPDATE "JUST NOW / 5s AGO / 2m AGO"
   */
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - lastPacketTimeRef.current) /
        1000
      );

      if (!apiConnected) {
        setTimeAgoText('No connection');
        return;
      }

      if (elapsedSeconds < 2) {
        setTimeAgoText('Just now');
      } else if (elapsedSeconds < 60) {
        setTimeAgoText(`${elapsedSeconds}s ago`);
      } else {
        setTimeAgoText(
          `${Math.floor(elapsedSeconds / 60)}m ago`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [apiConnected]);

  /*
   * MANUAL REFRESH
   */
  const handleManualRefresh = async () => {
    if (!patient?.id || !selectedDeviceId) {
      setApiConnected(false);
      setApiError('No hardware device connected to this patient');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/hardware/latest/${selectedDeviceId}`
      );

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: HardwareReading = await response.json();

      if (data.patient_id && data.patient_id !== patient.id) {
        throw new Error(
          `Device ${selectedDeviceId} is assigned to ${data.patient_id}, not ${patient.id}`
        );
      }

      setLiveVitals((previous) => ({
        ...previous,
        heartRate: data.heart_rate ?? previous.heartRate,
        spO2: data.spo2 ?? previous.spO2,
        temperature: data.temperature ?? previous.temperature,
        deviceId: data.device_id || selectedDeviceId,
        fallDetected:
          data.fall_detected !== undefined && data.fall_detected !== null
            ? Boolean(data.fall_detected)
            : previous.fallDetected,
        lastUpdated: data.created_at || new Date().toLocaleString(),
      }));

      lastPacketTimeRef.current = Date.now();

      if (onUpdateSensor) {
        const updatePayload: Partial<LiveSensorData> = {};

        if (data.heart_rate !== null) updatePayload.heartRate = data.heart_rate;
        if (data.spo2 !== null) updatePayload.spO2 = data.spo2;
        if (data.temperature !== null) updatePayload.temperature = data.temperature;
        if (data.fall_detected !== undefined) {
          updatePayload.fallDetected = Boolean(data.fall_detected);
        }
        if (data.created_at) updatePayload.lastUpdated = data.created_at;

        onUpdateSensor(patient.id, updatePayload);
      }

      setApiConnected(true);
      setApiError(null);
    } catch (error) {
      console.error('Failed to refresh VitaGuard sensor data:', error);
      setApiConnected(false);
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to refresh data'
      );
    }
  };

  /*
   * VITAL STATUS HELPERS
   */
  const getHRStatus = (
    heartRate: number
  ): 'normal' | 'warning' | 'critical' => {
    if (heartRate < 50 || heartRate > 125) {
      return 'critical';
    }

    if (heartRate < 60 || heartRate > 100) {
      return 'warning';
    }

    return 'normal';
  };

  const getSpO2Status = (
    spo2: number
  ): 'normal' | 'warning' | 'critical' => {
    if (spo2 < 90) {
      return 'critical';
    }

    if (spo2 < 95) {
      return 'warning';
    }

    return 'normal';
  };

  const getTempStatus = (
    temperature: number
  ): 'normal' | 'warning' | 'critical' => {
    if (temperature >= 38.8 || temperature < 35.5) {
      return 'critical';
    }

    if (temperature >= 37.8 || temperature < 36.0) {
      return 'warning';
    }

    return 'normal';
  };

  if (!patient) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-sm my-8 space-y-6">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto text-emerald-700">
          📡
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold font-mono tracking-wider">
            100% PURE REAL-TIME HARDWARE MODE
          </span>
          <h3 className="text-xl font-serif italic text-stone-800">
            No Patients Currently in Ward
          </h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            All mock and simulated data have been removed. The ward is awaiting physical ESP32 sensor connections or new patient admissions.
          </p>
        </div>

        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-xs font-mono text-left space-y-1.5 text-stone-600 max-w-md mx-auto">
          <div className="font-bold text-stone-800 mb-1">🔌 How to stream live data:</div>
          <div>1. Click <strong className="text-emerald-700 font-bold">+ Admit Patient</strong> to register a bed.</div>
          <div>2. Power ON your ESP32 with MAX30102 on Wi-Fi.</div>
          <div>3. Telemetry target: <code className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-800">POST /api/hardware/ingest</code></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (onOpenAdmitModal) {
                onOpenAdmitModal();
              } else {
                onNavigate('vitals-entry');
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-sm flex items-center space-x-2"
          >
            <span>➕ Admit Patient</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* PATIENT SELECTOR */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

        <div className="flex items-center gap-3 w-full md:w-auto">

          <div className="p-2.5 rounded-xl bg-[#6B705C]/15 border border-[#6B705C]/30 text-[#5B6356]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Select Patient Stream
            </label>

            <select
              id="live-monitoring-patient-select"
              value={patient.id}
              onChange={(e) =>
                onSelectPatient(e.target.value)
              }
              className="mt-0.5 block w-full md:w-72 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-semibold focus:outline-none focus:border-[#6B705C]"
            >
              {patients.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.id}: {p.name} (
                  {p.ward} • {p.currentRisk})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">

          <div className="px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
            <span className="text-stone-500">
              Bed:
            </span>

            <span className="text-[#2D312B] font-bold">
              {patient.bed}
            </span>

            <span className="text-stone-300">
              •
            </span>

            <span className="text-stone-500">
              {patient.ward}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
            <span className="text-stone-500">
              Attending:
            </span>

            <span className="text-[#5B6356] font-medium">
              {patient.assignedDoctor}
            </span>
          </div>

          <RiskBadge
            level={patient.currentRisk}
          />

          {/* Segmented View Mode Switcher */}
          <div className="flex items-center p-1 bg-stone-100 border border-stone-200 rounded-xl">
            <button
              id="view-mode-bedside-btn"
              onClick={() => setViewMode('bedside')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'bedside'
                  ? 'bg-[#2D312B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#2D312B]'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Bedside ICU</span>
            </button>
            <button
              id="view-mode-ward-grid-btn"
              onClick={() => setViewMode('ward_grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'ward_grid'
                  ? 'bg-[#2D312B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#2D312B]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ward Monitor ({patients.length})</span>
            </button>
          </div>

        </div>
      </div>

      {/* 1. VIEW MODE: CENTRAL WARD MONITOR GRID */}
      {viewMode === 'ward_grid' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6B705C]" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700">
                Central Nurse Station — Multi-Bed Ward Monitor ({patients.length} Beds Active)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Continuous Autonomous Telemetry Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((pt) => {
              const sensor = liveSensors[pt.id] || (pt.id === 'PT-101' ? liveVitals : undefined);
              const hr = sensor?.heartRate || 72;
              const spo2 = sensor?.spO2 || 98;
              const temp = sensor?.temperature || 36.8;
              const isSelected = pt.id === selectedPatientId;
              const isCrit = pt.currentRisk === 'CRITICAL' || spo2 < 90 || hr > 130;
              const isHigh = pt.currentRisk === 'HIGH_RISK' || spo2 < 94 || hr > 110;

              return (
                <div
                  key={pt.id}
                  id={`ward-card-${pt.id}`}
                  onClick={() => {
                    onSelectPatient(pt.id);
                    setViewMode('bedside');
                  }}
                  className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    isCrit
                      ? 'border-red-400 bg-red-50/25 ring-2 ring-red-400/40 animate-pulse'
                      : isHigh
                      ? 'border-amber-300 bg-amber-50/15'
                      : isSelected
                      ? 'border-[#2D312B] ring-1 ring-[#2D312B]'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-data font-bold text-stone-400">
                          {pt.bed} • {pt.ward}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#2D312B] hover:text-[#6B705C] transition-colors">
                        {pt.name}
                      </h3>
                      <span className="text-[11px] text-stone-500 font-mono-data">
                        ID: {pt.id} ({pt.age}y • {pt.gender})
                      </span>
                    </div>
                    <RiskBadge level={pt.currentRisk} size="sm" />
                  </div>

                  {/* Vitals Mini Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3">
                    {/* HR */}
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 uppercase font-mono-data">
                        <Heart className="w-3 h-3 text-red-500 animate-pulse" />
                        <span>HR</span>
                      </div>
                      <div className={`text-base font-bold font-mono-data mt-0.5 ${
                        hr < 50 || hr > 125 ? 'text-red-600' : 'text-[#2D312B]'
                      }`}>
                        {hr} <span className="text-[9px] font-normal text-stone-400">BPM</span>
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 uppercase font-mono-data">
                        <Activity className="w-3 h-3 text-teal-600" />
                        <span>SpO₂</span>
                      </div>
                      <div className={`text-base font-bold font-mono-data mt-0.5 ${
                        spo2 < 92 ? 'text-red-600' : spo2 < 95 ? 'text-amber-600' : 'text-[#2D312B]'
                      }`}>
                        {spo2}<span className="text-[9px] font-normal text-stone-400">%</span>
                      </div>
                    </div>

                    {/* Temp */}
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 uppercase font-mono-data">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        <span>Temp</span>
                      </div>
                      <div className="text-base font-bold font-mono-data text-[#2D312B] mt-0.5">
                        {temp}°
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis & Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-stone-500 truncate max-w-[140px]" title={pt.primaryDiagnosis}>
                      {pt.primaryDiagnosis}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(pt.id);
                          setViewMode('bedside');
                        }}
                        className="px-2 py-1 rounded-md bg-[#2D312B] hover:bg-[#3a3f37] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Focus</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(pt.id);
                          onNavigate('ai-analysis');
                        }}
                        className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                        title="AI Analysis"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. VIEW MODE: BEDSIDE ICU MONITOR (Single Patient Stream) */
        <>

      {/* LIVE SENSOR SECTION */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs relative overflow-hidden">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              {/* CONNECTION DOT */}
              <span className="flex h-3 w-3 relative">

                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiConnected
                    ? 'bg-emerald-400'
                    : 'bg-red-400'
                    }`}
                />

                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${apiConnected
                    ? 'bg-emerald-600'
                    : 'bg-red-600'
                    }`}
                />

              </span>

              <h2 className="text-sm font-bold uppercase tracking-widest text-[#5B6356] flex items-center gap-2">
                LIVE SENSOR TELEMETRY
              </h2>

              <span className="text-xs px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-mono-data font-semibold">
                {liveVitals.deviceId}
              </span>

            </div>

            <p className="text-xs text-stone-500 mt-0.5">
              Live patient telemetry received from
              the VitaGuard ESP32 monitoring device.
            </p>

          </div>

          {/* CONNECTION STATUS */}
          <div className="flex flex-wrap items-center gap-2.5">

            <div
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${apiConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
                }`}
            >
              {apiConnected
                ? '● DEVICE CONNECTED'
                : '● DEVICE DISCONNECTED'}
            </div>

            <button
              onClick={handleManualRefresh}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[11px] font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <div className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono-data text-stone-600 flex items-center gap-1.5 shadow-2xs">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />

              <span>
                {liveVitals.signalStrengthDbm} dBm
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono-data text-stone-600 flex items-center gap-1.5 shadow-2xs">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />

              <span>
                {liveVitals.batteryLevel}%
              </span>
            </div>

          </div>
        </div>

        {/* API ERROR */}
        {apiError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            Backend connection error: {apiError}
          </div>
        )}

        {/* VITAL CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          <VitalCard
            id="live-vital-heart-rate"
            title="Heart Rate"
            value={liveVitals.heartRate}
            unit="BPM"
            icon={Heart}
            status={getHRStatus(
              liveVitals.heartRate
            )}
            normalRange="60 - 100 BPM"
            trend={
              liveVitals.heartRate > 100
                ? 'up'
                : liveVitals.heartRate < 60
                  ? 'down'
                  : 'steady'
            }
            trendText={
              liveVitals.heartRate > 100
                ? 'Tachycardia'
                : liveVitals.heartRate < 60
                  ? 'Bradycardia'
                  : 'Normal'
            }
            source="ESP32 IoT Sensor (Live)"
            secondaryInfo={`Rhythm: ${liveVitals.ecgRhythm}`}
          />

          <VitalCard
            id="live-vital-spo2"
            title="Blood Oxygen (SpO2)"
            value={liveVitals.spO2}
            unit="%"
            icon={Activity}
            status={getSpO2Status(
              liveVitals.spO2
            )}
            normalRange="95 - 100 %"
            trend={
              liveVitals.spO2 < 95
                ? 'down'
                : 'steady'
            }
            trendText={
              liveVitals.spO2 < 90
                ? 'Hypoxemia'
                : liveVitals.spO2 < 95
                  ? 'Low O2'
                  : 'Optimal'
            }
            source="ESP32 IoT Sensor (Live)"
            secondaryInfo="Continuous monitoring"
          />

          <VitalCard
            id="live-vital-temperature"
            title="Body Temperature"
            value={liveVitals.temperature.toFixed(1)}
            unit="°C"
            icon={Thermometer}
            status={getTempStatus(
              liveVitals.temperature
            )}
            normalRange="36.5 - 37.5 °C"
            trend={
              liveVitals.temperature > 37.8
                ? 'up'
                : 'steady'
            }
            trendText={
              liveVitals.temperature >= 38.5
                ? 'High Fever'
                : liveVitals.temperature > 37.5
                  ? 'Elevated'
                  : 'Normal'
            }
            source="ESP32 IoT Sensor (Live)"
            secondaryInfo={`Fahrenheit: ${(
              liveVitals.temperature * 1.8 +
              32
            ).toFixed(1)} °F`}
          />

        </div>

        {/* MOTION AND FALL DETECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">

            <div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Patient Motion Status
              </span>

              <div className="flex items-center gap-2 mt-1">

                <StatusBadge
                  status={liveVitals.motionStatus}
                  type="motion"
                  size="md"
                />

                <span className="text-xs text-stone-600">
                  {liveVitals.motionStatus ===
                    'AGITATED'
                    ? 'Irregular restless movement detected'
                    : liveVitals.motionStatus ===
                      'BED_REST'
                      ? 'Stable in bed'
                      : liveVitals.motionStatus ===
                        'ACTIVE'
                        ? 'Ambulating safely'
                        : 'Resting / Sleeping'}
                </span>

              </div>
            </div>

            <Zap className="w-5 h-5 text-[#6B705C]" />

          </div>

          <div
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${liveVitals.fallDetected
              ? 'bg-red-50 border-red-300 text-[#D66853]'
              : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
          >

            <div>

              <div className="flex items-center gap-2">

                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  IoT Fall Detection
                </span>

                {liveVitals.fallDetected && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#D66853] text-white font-bold animate-pulse font-mono-data">
                    TRIGGERED
                  </span>
                )}

              </div>

              <p className="text-xs mt-1 text-stone-600">
                {liveVitals.fallDetected
                  ? 'CRITICAL: Fall event detected.'
                  : 'No fall event detected.'}
              </p>

            </div>

            <ShieldAlert
              className={`w-6 h-6 ${liveVitals.fallDetected
                ? 'text-[#D66853] animate-bounce'
                : 'text-emerald-600'
                }`}
            />

          </div>

        </div>

        {/* ECG AND LAST UPDATED */}
        <div className="space-y-2">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

            <div className="flex items-center gap-2">

              <Activity className="w-4 h-4 text-[#5B6356]" />

              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Continuous ECG Waveform Area (
                {liveVitals.ecgLead})
              </h3>

            </div>

            <div
              id="live-monitoring-last-updated"
              className="flex items-center gap-2 text-xs font-mono-data text-stone-600 bg-stone-50 px-3 py-1 rounded-lg border border-stone-200"
            >

              <Clock className="w-3.5 h-3.5 text-[#6B705C]" />

              <span>
                Last Updated:{' '}

                <strong className="text-[#2D312B] font-semibold">
                  {liveVitals.lastUpdated}
                </strong>

              </span>

              <span className="text-stone-300">
                |
              </span>

              <span className="text-[#5B6356] font-semibold">
                {timeAgoText}
              </span>

            </div>

          </div>

          <ECGWaveform
            heartRate={liveVitals.heartRate}
            rhythm={liveVitals.ecgRhythm}
            lead={liveVitals.ecgLead}
            height={190}
            interactive={true}
          />

        </div>

      </div>

      {/* BACKEND DATA CHANNEL */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div className="flex items-start gap-3">

          <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-[#5B6356]">
            <Server className="w-4 h-4" />
          </div>

          <div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              FastAPI Live Data Channel

              <span className="text-[10px] font-mono-data font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                /api/hardware/latest/ESP32-001
              </span>

            </h4>

            <p className="text-xs text-stone-500 mt-0.5">
              Dashboard refreshes automatically every
              2 seconds using the latest VitaGuard
              sensor reading.
            </p>

          </div>

        </div>

      </div>

      {/* CLINICAL DECISION SUPPORT */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">

        <div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Clinical Decision Support Navigation
          </h4>

          <p className="text-xs text-stone-500 mt-0.5">
            Cross-reference live sensor telemetry with
            clinical inputs, deterioration trends, and
            explainable AI.
          </p>

        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">

          <button
            onClick={() =>
              onNavigate('deterioration')
            }
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#2D312B] text-xs font-semibold border border-stone-300 flex items-center justify-center gap-1.5 transition-colors"
          >

            <TrendingDown className="w-3.5 h-3.5 text-[#6B705C]" />

            <span>Deterioration</span>

          </button>

          <button
            onClick={() =>
              onNavigate('ai-analysis')
            }
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >

            <Brain className="w-3.5 h-3.5 text-emerald-400" />

            <span>AI Risk Analysis</span>

            <ArrowRight className="w-3.5 h-3.5" />

          </button>

        </div>

      </div>
      </>
      )}

    </div>
  );
};