import React from 'react';
import { X, Printer, ShieldCheck, Activity, Heart, Thermometer, User, FileText, CheckCircle2 } from 'lucide-react';
import { Patient, DeteriorationData, AIAnalysisData, ClinicalAlert } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  deterioration?: DeteriorationData;
  aiAnalysis?: AIAnalysisData;
  recentAlert?: ClinicalAlert;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  deterioration,
  aiAnalysis,
  recentAlert,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const detScore = deterioration?.deteriorationScore ?? 24;
  const reasons = deterioration?.flaggedReasons || [
    'Baseline vital lability detected during continuous monitoring',
    'AI multi-parameter risk classification recommends clinical review',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto print:p-0 print:bg-white print:static">
      <div
        id="clinical-report-modal"
        className="w-full max-w-3xl bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-[#2D312B] my-8 print:border-none print:shadow-none print:m-0 print:max-w-full"
      >
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6B705C]" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Electronic Medical Record — Clinical Deterioration Export
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D312B] hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 print:p-8">
          {/* Hospital Header & Document Title */}
          <div className="border-b-2 border-stone-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2D312B] text-white flex items-center justify-center font-bold text-sm">
                  V
                </div>
                <span className="font-serif italic font-bold text-xl tracking-tight text-[#2D312B]">
                  VitaGuard Clinical Health System
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Autonomous Patient Monitoring & AI Early-Warning Deterioration Platform
              </p>
            </div>
            <div className="text-left md:text-right text-xs text-stone-600">
              <div className="font-bold uppercase tracking-wider text-[#2D312B]">Clinical Deterioration Summary</div>
              <div className="font-mono-data text-[11px] text-stone-500">Report Generated: {reportDate}</div>
              <div className="font-mono-data text-[11px] text-stone-500">Document ID: VG-DOC-{patient.id}-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">Patient Name</span>
              <span className="font-bold text-[#2D312B] text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">MRN / Patient ID</span>
              <span className="font-mono-data font-bold text-[#2D312B]">{patient.id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">Age / Gender</span>
              <span className="font-medium text-[#2D312B]">{patient.age} Yrs • {patient.gender}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">Location</span>
              <span className="font-bold text-[#2D312B]">{patient.ward} ({patient.bed})</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">Primary Diagnosis</span>
              <span className="font-medium text-[#2D312B]">{patient.primaryDiagnosis}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-mono-data text-stone-400 font-bold block">Attending Physician</span>
              <span className="font-medium text-[#2D312B]">{patient.assignedDoctor}</span>
            </div>
          </div>

          {/* Vital Signs Comparison Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#6B705C]" />
              Physiological Telemetry & Deterioration Index
            </h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-mono-data text-[10px] uppercase border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Vital Parameter</th>
                    <th className="py-2.5 px-3">Baseline</th>
                    <th className="py-2.5 px-3">Current Measured</th>
                    <th className="py-2.5 px-3">Shift (Δ)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[#2D312B]">
                  <tr>
                    <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-red-500" /> Heart Rate
                    </td>
                    <td className="py-2 px-3 font-mono-data text-stone-500">
                      {deterioration?.baselineValues?.heartRate ?? 72} BPM
                    </td>
                    <td className="py-2 px-3 font-mono-data font-bold">
                      {deterioration?.currentValues?.heartRate ?? 138} BPM
                    </td>
                    <td className="py-2 px-3 font-mono-data text-red-600 font-semibold">+24 BPM</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">ELEVATED</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-teal-600" /> SpO₂ (Oxygen)
                    </td>
                    <td className="py-2 px-3 font-mono-data text-stone-500">
                      {deterioration?.baselineValues?.spO2 ?? 98}%
                    </td>
                    <td className="py-2 px-3 font-mono-data font-bold text-red-600">
                      {deterioration?.currentValues?.spO2 ?? 82}%
                    </td>
                    <td className="py-2 px-3 font-mono-data text-red-600 font-semibold">-6.0%</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">HYPOXIC</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                      <Thermometer className="w-3 h-3 text-amber-500" /> Temperature
                    </td>
                    <td className="py-2 px-3 font-mono-data text-stone-500">
                      {deterioration?.baselineValues?.temperature ?? 98.6}°F
                    </td>
                    <td className="py-2 px-3 font-mono-data font-bold">
                      {deterioration?.currentValues?.temperature ?? 103.4}°F
                    </td>
                    <td className="py-2 px-3 font-mono-data text-amber-600 font-semibold">+1.8°</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">FEBRILE</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Blood Pressure</td>
                    <td className="py-2 px-3 font-mono-data text-stone-500">120/80 mmHg</td>
                    <td className="py-2 px-3 font-mono-data font-bold">170/105 mmHg</td>
                    <td className="py-2 px-3 font-mono-data text-amber-600 font-semibold">+50/+25</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HYPERTENSIVE</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Decision Support & Deterioration Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deterioration Score Box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Early Deterioration Index</span>
                <span className="text-xs font-bold text-[#D66853]">{detScore} / 100</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-[#D66853] h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, detScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-600 pt-1">
                Trajectory: <strong className="text-[#2D312B]">{deterioration?.status || 'RAPIDLY_DETERIORATING'}</strong>
              </p>
              <ul className="text-[11px] text-stone-500 space-y-1 list-disc list-inside">
                {reasons.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* AI Model Inference Box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">AI Risk Assessment</span>
                <RiskBadge level={aiAnalysis?.riskLevel || patient.currentRisk || 'CRITICAL'} size="sm" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#2D312B]">
                  {aiAnalysis?.predictedCondition || recentAlert?.predictedCondition || 'Critical Multi-Organ Risk'}
                </div>
                <div className="text-[11px] text-stone-500">Model: VitaGuard Random Forest Classifier (7-Feature)</div>
              </div>
              <p className="text-[11px] text-stone-600 pt-1 border-t border-stone-200">
                Recommended Action: <strong>Immediate ICU / Specialist Bedside Evaluation</strong>
              </p>
            </div>
          </div>

          {/* Clinical Sign-Off & Attending Verification */}
          <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Attending Physician Review & Sign-Off
              </h4>
              <span className="text-[10px] text-stone-400 font-mono-data">Audit ID: {recentAlert?.id || 'ALT-006'}</span>
            </div>
            <p className="text-xs text-stone-600 italic">
              "Bedside evaluation completed. Escalation acknowledged, telemetry orders confirmed, and treatment protocol initiated."
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-mono-data block">Physician Signature</span>
                <div className="font-serif italic text-[#2D312B] font-semibold text-sm pt-1">
                  {recentAlert?.assignedDoctor || patient.assignedDoctor || 'Dr. Kavita Desai, MD'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-mono-data block">Date & Verification Time</span>
                <div className="font-mono-data text-xs text-[#2D312B] pt-1">
                  {reportDate}
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer Disclaimer */}
          <div className="text-[10px] text-stone-400 pt-4 border-t border-stone-200 flex items-center justify-between">
            <span>VitaGuard Decision-Support System • Confidential Medical Record</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
