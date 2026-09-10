import React, { useState } from 'react';
import {
  TrendingDown,
  Activity,
  Heart,
  Thermometer,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Printer,
  FileText,
} from 'lucide-react';
import {
  Patient,
  DeteriorationData,
  NavigationPage,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ClinicalReportModal } from '../components/modals/ClinicalReportModal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DeteriorationPageProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  deteriorationMap: Record<string, DeteriorationData>;
  onNavigate: (page: NavigationPage) => void;
}

export const DeteriorationPage: React.FC<DeteriorationPageProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  deteriorationMap,
  onNavigate,
}) => {
  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const det = patient ? (deteriorationMap[patient.id] || {
    patientId: patient.id,
    deteriorationScore: 12,
    trendDirection: 'STABLE' as const,
    riskTrajectory: 'Stable baseline',
    primaryDriver: 'Resting vital signs',
    historicalTrends: [
      { time: '10:00', heartRate: 72, spO2: 98, temperature: 98.6, respiratoryRate: 16, systolicBP: 120, diastolicBP: 80, deteriorationIndex: 10 },
      { time: '11:00', heartRate: 74, spO2: 98, temperature: 98.6, respiratoryRate: 16, systolicBP: 122, diastolicBP: 80, deteriorationIndex: 12 },
    ],
    currentValues: {
      heartRate: 74,
      spO2: 98,
      temperature: 98.6,
      respRate: 16,
      bloodPressure: '120/80 mmHg',
    },
    lastCalculated: new Date().toISOString(),
  }) : null;

  if (!patient || !det) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm my-12 space-y-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto text-emerald-700">
          📈
        </div>
        <h3 className="text-lg font-serif italic text-stone-800">
          No Patient Selected for Deterioration Analysis
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Admit a patient or switch to <strong>Demo Ward Mode</strong> in the top header to view historical deterioration trends and vital trajectories.
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

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[#D66853] border-red-200 bg-red-50';
    if (score >= 50) return 'text-amber-800 border-amber-200 bg-amber-50';
    if (score >= 25) return 'text-stone-700 border-stone-300 bg-stone-100';
    return 'text-emerald-800 border-emerald-200 bg-emerald-50';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Patient Selector Banner */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-[#6B705C]/15 border border-[#6B705C]/30 text-[#5B6356]">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Select Patient for Trend & Deterioration Review
            </label>
            <select
              id="deterioration-patient-select"
              value={patient.id}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="mt-0.5 block w-full md:w-72 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-semibold focus:outline-none focus:border-[#6B705C]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.name} ({p.ward})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-500 font-mono-data hidden sm:inline">Last Computed: {det.lastCalculated}</span>
          <StatusBadge status={det.status} size="md" />
          <button
            id="export-clinical-pdf-btn"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Deterioration Score Gauge & Key Flags Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deterioration Score Tile */}
        <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Deterioration Score
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono-data bg-stone-50 border border-stone-200 text-stone-500">
                0 - 100 Index
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-4">
              <span
                className={`text-5xl font-serif font-bold px-3 py-1 rounded-xl border ${getScoreColor(
                  det.deteriorationScore
                )}`}
              >
                {det.deteriorationScore}
              </span>
              <span className="text-sm font-semibold text-stone-400">/ 100</span>
            </div>

            {/* Score progress bar with threshold steps */}
            <div className="mt-6 space-y-1.5">
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200 flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    det.deteriorationScore >= 75
                      ? 'bg-[#D66853]'
                      : det.deteriorationScore >= 50
                      ? 'bg-amber-600'
                      : det.deteriorationScore >= 25
                      ? 'bg-stone-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${det.deteriorationScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono-data">
                <span>0 Stable</span>
                <span>25 Monit</span>
                <span>50 Deter</span>
                <span>75+ Crit</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Velocity:</span>
              <strong className="text-[#2D312B] font-mono-data">{det.deteriorationVelocity}</strong>
            </div>
            <div className="flex justify-between text-stone-500 mt-1">
              <span>Clinical Status:</span>
              <strong className="text-[#5B6356]">{det.status}</strong>
            </div>
          </div>
        </div>

        {/* Flagged Deterioration Reasons */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600">
                Flagged Deterioration Drivers & Persistence
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Real-time physiological boundary excursions analyzed over moving clinical time windows.
            </p>

            <div className="space-y-2.5">
              {det.flaggedReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs"
                >
                  <div className="p-1 rounded bg-amber-100 text-amber-800 mt-0.5 flex-shrink-0">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[#2D312B] font-medium leading-relaxed">{reason}</span>
                </div>
              ))}

              {det.flaggedReasons.length === 0 && (
                <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  No deterioration triggers active. Patient vitals reside securely within baseline thresholds.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>FastAPI: <code className="text-[#5B6356] font-mono-data">GET /api/v1/deterioration/{patient.id}</code></span>
            <button
              onClick={() => onNavigate('explainable-risk')}
              className="text-[#6B705C] hover:text-[#2D312B] font-bold flex items-center gap-1 transition-colors"
            >
              <span>Explainable Factors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Interactive Clinical Trend Charts */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#5B6356]" />
          Multi-Vital Historical Trend Curves (Time Series)
        </h3>

        {/* 1. Heart Rate Trend Chart */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#D66853]" />
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Heart Rate Trend (BPM)
                </h4>
                <p className="text-[11px] text-stone-400">Normal Range: 60 - 100 BPM</p>
              </div>
            </div>
            <div className="text-xs font-mono-data text-[#D66853] font-bold">
              Current: {det.currentValues.heartRate} BPM (Baseline: {det.baselineValues.heartRate} BPM)
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={det.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="time" stroke="#78716c" fontSize={11} />
                <YAxis domain={[50, 160]} stroke="#78716c" fontSize={11} unit=" bpm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e7e5e4',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#2D312B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <ReferenceLine y={100} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Tachycardia (100)', fill: '#d97706', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#78716c" strokeDasharray="3 3" label={{ value: 'Bradycardia (60)', fill: '#78716c', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#D66853"
                  strokeWidth={2.5}
                  dot={{ fill: '#D66853', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Heart Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. SpO2 Trend Chart */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5B6356]" />
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  SpO2 Trend (%)
                </h4>
                <p className="text-[11px] text-stone-400">Target Range: ≥ 95%</p>
              </div>
            </div>
            <div className="text-xs font-mono-data text-[#5B6356] font-bold">
              Current: {det.currentValues.spO2}% (Baseline: {det.baselineValues.spO2}%)
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={det.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="time" stroke="#78716c" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#78716c" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e7e5e4',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#2D312B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <ReferenceLine y={95} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Target (95%)', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={90} stroke="#D66853" strokeDasharray="3 3" label={{ value: 'Hypoxemia Cutoff (90%)', fill: '#D66853', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="spO2"
                  stroke="#5B6356"
                  strokeWidth={2.5}
                  dot={{ fill: '#5B6356', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="SpO2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Temperature Trend Chart */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-700" />
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Body Temperature Trend (°C)
                </h4>
                <p className="text-[11px] text-stone-400">Normal Range: 36.5 - 37.5 °C</p>
              </div>
            </div>
            <div className="text-xs font-mono-data text-amber-700 font-bold">
              Current: {det.currentValues.temperature.toFixed(1)}°C (Baseline: {det.baselineValues.temperature.toFixed(1)}°C)
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={det.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="time" stroke="#78716c" fontSize={11} />
                <YAxis domain={[36.0, 40.0]} stroke="#78716c" fontSize={11} unit="°C" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e7e5e4',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#2D312B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <ReferenceLine y={37.5} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Fever (37.5°C)', fill: '#d97706', fontSize: 10 }} />
                <ReferenceLine y={38.5} stroke="#D66853" strokeDasharray="3 3" label={{ value: 'High Pyrexia (38.5°C)', fill: '#D66853', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ fill: '#d97706', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Temperature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clinical Deterioration PDF Export Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={patient}
        deterioration={det}
      />
    </div>
  );
};
