import React, { useState } from 'react';
import {
  FilePlus2,
  Radio,
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  Patient,
  LiveSensorData,
  ClinicalInputData,
  MotionStatus,
  NavigationPage,
} from '../types';

interface VitalsEntryPageProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  liveSensors: Record<string, LiveSensorData>;
  clinicalInputs: Record<string, ClinicalInputData>;
  onSubmitEntry: (entry: ClinicalInputData) => void;
  onUpdateLiveSensor: (patientId: string, data: Partial<LiveSensorData>) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const VitalsEntryPage: React.FC<VitalsEntryPageProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  liveSensors,
  clinicalInputs,
  onSubmitEntry,
  onUpdateLiveSensor,
  onNavigate,
}) => {
  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const currentSensor = liveSensors[patient?.id] || liveSensors['PT-101'];
  const currentClinical = clinicalInputs[patient?.id] || clinicalInputs['PT-101'];

  // Form State - Live Sensor Data
  const [heartRate, setHeartRate] = useState<number>(currentSensor?.heartRate || 75);
  const [spO2, setSpO2] = useState<number>(currentSensor?.spO2 || 98);
  const [temperature, setTemperature] = useState<number>(currentSensor?.temperature || 37.0);
  const [ecgRhythm, setEcgRhythm] = useState<string>(currentSensor?.ecgRhythm || 'Sinus Rhythm');
  const [motionStatus, setMotionStatus] = useState<MotionStatus>(currentSensor?.motionStatus || 'RESTING');
  const [fallDetected, setFallDetected] = useState<boolean>(currentSensor?.fallDetected || false);

  // Form State - Clinical Input Data
  const [age, setAge] = useState<number>(patient?.age || 50);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(currentClinical?.respiratoryRate || 16);
  const [systolicBP, setSystolicBP] = useState<number>(currentClinical?.systolicBP || 120);
  const [diastolicBP, setDiastolicBP] = useState<number>(currentClinical?.diastolicBP || 80);
  const [avpu, setAvpu] = useState<'Alert' | 'Verbal' | 'Pain' | 'Unresponsive'>(currentClinical?.avpuConsciousness || 'Alert');
  const [supplementalO2, setSupplementalO2] = useState<number>(currentClinical?.supplementalO2LMin || 0);
  const [recordedBy, _setRecordedBy] = useState<string>('Nurse R. Martinez, RN');
  const [notes, setNotes] = useState<string>('');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Handle patient change in dropdown
  const handlePatientSelect = (pid: string) => {
    onSelectPatient(pid);
    const p = patients.find((item) => item.id === pid);
    const s = liveSensors[pid];
    const c = clinicalInputs[pid];
    if (p) setAge(p.age);
    if (s) {
      setHeartRate(s.heartRate);
      setSpO2(s.spO2);
      setTemperature(s.temperature);
      setEcgRhythm(s.ecgRhythm);
      setMotionStatus(s.motionStatus);
      setFallDetected(s.fallDetected);
    }
    if (c) {
      setRespiratoryRate(c.respiratoryRate);
      setSystolicBP(c.systolicBP);
      setDiastolicBP(c.diastolicBP);
      setAvpu(c.avpuConsciousness);
      setSupplementalO2(c.supplementalO2LMin);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update Live Sensor Telemetry Store
    onUpdateLiveSensor(patient.id, {
      heartRate: Number(heartRate),
      spO2: Number(spO2),
      temperature: Number(temperature),
      ecgRhythm: ecgRhythm as any,
      motionStatus: motionStatus,
      fallDetected: fallDetected,
    });

    // 2. Submit Clinical Input Data
    const map = Math.round(Number(diastolicBP) + (Number(systolicBP) - Number(diastolicBP)) / 3);
    const newEntry: ClinicalInputData = {
      patientId: patient.id,
      patientAge: Number(age),
      respiratoryRate: Number(respiratoryRate),
      systolicBP: Number(systolicBP),
      diastolicBP: Number(diastolicBP),
      map: map,
      avpuConsciousness: avpu,
      supplementalO2LMin: Number(supplementalO2),
      recordedBy: recordedBy,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      clinicalNotes: notes,
    };

    onSubmitEntry(newEntry);

    setFeedbackMessage(
      `Successfully synchronized live sensor stream and logged clinical entry for ${patient?.name || ''} (${patient?.id || ''}). Deterioration and AI models re-evaluated.`
    );
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  if (!patient) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm my-12 space-y-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto text-emerald-700">
          📝
        </div>
        <h3 className="text-lg font-serif italic text-stone-800">
          No Patient Selected for Vitals Logging
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Admit a patient or switch to <strong>Demo Ward Mode</strong> in the top header to manually log clinical observations or calibrate sensor streams.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('patients')}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
          >
            Go to Patient Registry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header banner */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-[#6B705C]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#5B6356]">
              Patient & Vitals Entry Station
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Clearly separates ESP32 hardware streaming parameters from manual clinical bedside measurements.
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
            Target Admitted Patient
          </label>
          <select
            id="vitals-entry-patient-select"
            value={patient.id}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}: {p.name} ({p.ward} • {p.bed})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success / Feedback notification */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => onNavigate('deterioration')}
            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <span>View Deterioration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 1: LIVE SENSOR DATA */}
          <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#5B6356]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#5B6356]">
                    LIVE SENSOR DATA
                  </h3>
                  <p className="text-[11px] text-stone-500">ESP32 IoT Wearable Node Telemetry Stream</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono-data bg-stone-100 border border-stone-200 text-stone-700 font-bold">
                IoT SENSOR FEED
              </span>
            </div>

            {/* Heart Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#D66853]" />
                  Heart Rate (BPM)
                </label>
                <span className="text-[11px] text-stone-400 font-mono-data">Normal: 60 - 100</span>
              </div>
              <input
                id="input-live-heart-rate"
                type="number"
                min={30}
                max={240}
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                required
              />
            </div>

            {/* SpO2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#5B6356]" />
                  SpO2 - Blood Oxygen (%)
                </label>
                <span className="text-[11px] text-stone-400 font-mono-data">Normal: 95 - 100%</span>
              </div>
              <input
                id="input-live-spo2"
                type="number"
                min={50}
                max={100}
                value={spO2}
                onChange={(e) => setSpO2(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                required
              />
            </div>

            {/* Body Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-700" />
                  Body Temperature (°C)
                </label>
                <span className="text-[11px] text-stone-400 font-mono-data">Normal: 36.5 - 37.5°C</span>
              </div>
              <input
                id="input-live-temperature"
                type="number"
                step="0.1"
                min={30}
                max={44}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                required
              />
            </div>

            {/* ECG Rhythm Classification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#6B705C]" />
                  ECG Rhythm Pattern (Lead II)
                </label>
                <span className="text-[11px] text-stone-400 font-mono-data">ESP32 ECG input</span>
              </div>
              <select
                id="input-live-ecg-rhythm"
                value={ecgRhythm}
                onChange={(e) => setEcgRhythm(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] font-medium focus:outline-none focus:border-[#6B705C]"
              >
                <option value="Sinus Rhythm">Normal Sinus Rhythm (NSR)</option>
                <option value="Sinus Tachycardia">Sinus Tachycardia (&gt;100 bpm)</option>
                <option value="Sinus Bradycardia">Sinus Bradycardia (&lt;60 bpm)</option>
                <option value="Atrial Fibrillation">Atrial Fibrillation with RVR</option>
                <option value="Ventricular Ectopy">Ventricular Ectopy / Frequent PVCs</option>
              </select>
            </div>

            {/* Motion Status & Fall Toggle */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motion Status (IMU)
                </label>
                <select
                  id="input-live-motion-status"
                  value={motionStatus}
                  onChange={(e) => setMotionStatus(e.target.value as MotionStatus)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] font-medium focus:outline-none focus:border-[#6B705C]"
                >
                  <option value="RESTING">RESTING</option>
                  <option value="BED_REST">BED_REST</option>
                  <option value="ACTIVE">ACTIVE / AMBULATING</option>
                  <option value="AGITATED">AGITATED / RESTLESS</option>
                  <option value="FALL_EVENT">FALL_EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Fall Detection Alert
                </label>
                <button
                  type="button"
                  id="input-live-fall-toggle-btn"
                  onClick={() => setFallDetected(!fallDetected)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    fallDetected
                      ? 'bg-[#D66853] text-white border-[#c25844] animate-pulse'
                      : 'bg-stone-50 text-stone-600 border-stone-300 hover:text-[#2D312B]'
                  }`}
                >
                  {fallDetected ? 'FALL DETECTED (TRIGGERED)' : 'Normal (No Fall)'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: CLINICAL INPUT DATA */}
          <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#5B6356]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#5B6356]">
                    CLINICAL INPUT DATA
                  </h3>
                  <p className="text-[11px] text-stone-500">Bedside Clinical Examination & Triage Measurements</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono-data bg-stone-100 border border-stone-200 text-stone-700 font-bold">
                CLINICAL TRIAGE
              </span>
            </div>

            {/* Patient Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700">Patient Age (Years)</label>
                <span className="text-[11px] text-stone-400 font-mono-data">Demographic Factor</span>
              </div>
              <input
                id="input-clinical-age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                required
              />
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-stone-700">Respiratory Rate (breaths/min)</label>
                <span className="text-[11px] text-stone-400 font-mono-data">Normal: 12 - 20 bpm</span>
              </div>
              <input
                id="input-clinical-respiratory-rate"
                type="number"
                min={4}
                max={60}
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                required
              />
            </div>

            {/* Blood Pressure (Systolic / Diastolic) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-stone-700">Systolic BP (mmHg)</label>
                </div>
                <input
                  id="input-clinical-systolic-bp"
                  type="number"
                  min={40}
                  max={260}
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-stone-700">Diastolic BP (mmHg)</label>
                </div>
                <input
                  id="input-clinical-diastolic-bp"
                  type="number"
                  min={20}
                  max={160}
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-mono-data font-bold focus:outline-none focus:border-[#6B705C]"
                  required
                />
              </div>
            </div>

            {/* Supplemental O2 & Consciousness */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Supplemental O2 (L/min)
                </label>
                <input
                  id="input-clinical-supplemental-o2"
                  type="number"
                  step="0.5"
                  min={0}
                  max={15}
                  value={supplementalO2}
                  onChange={(e) => setSupplementalO2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] font-mono-data focus:outline-none focus:border-[#6B705C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  AVPU Consciousness
                </label>
                <select
                  id="input-clinical-avpu"
                  value={avpu}
                  onChange={(e) => setAvpu(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] font-medium focus:outline-none focus:border-[#6B705C]"
                >
                  <option value="Alert">Alert (A)</option>
                  <option value="Verbal">Responds to Voice (V)</option>
                  <option value="Pain">Responds to Pain (P)</option>
                  <option value="Unresponsive">Unresponsive (U)</option>
                </select>
              </div>
            </div>

            {/* Recorded by & Bedside Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Bedside Clinical Observations</label>
              <textarea
                id="input-clinical-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes on patient appearance, mental state, capillary refill, urine output..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B705C]" />
            <span>
              Entry will be time-stamped and sent to FastAPI REST API endpoint{' '}
              <code className="px-1.5 py-0.5 rounded bg-stone-100 text-[#2D312B] font-mono-data">
                POST /api/v1/vitals/clinical-entry
              </code>
            </span>
          </div>

          <button
            type="submit"
            id="submit-vitals-entry-btn"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Store & Re-Evaluate Clinical AI Risk</span>
          </button>
        </div>
      </form>
    </div>
  );
};
