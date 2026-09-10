import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ArrowRight,
  Printer,
  FileText,
} from 'lucide-react';
import {
  Patient,
  AIAnalysisData,
  NavigationPage,
} from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { ClinicalReportModal } from '../components/modals/ClinicalReportModal';
import { InterHospitalTransferModal } from '../components/modals/InterHospitalTransferModal';

interface AIAnalysisPageProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  aiAnalysisMap: Record<string, AIAnalysisData>;
  onNavigate: (page: NavigationPage) => void;
}

export const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  aiAnalysisMap,
  onNavigate,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const analysis = patient ? (aiAnalysisMap[patient.id] || {
    patientId: patient.id,
    riskLevel: patient.currentRisk || 'STABLE',
    confidenceScore: 0.94,
    primaryCondition: patient.primaryDiagnosis || 'Normal Resting Baseline',
    predictionClass: 0,
    features: {
      heartRate: 75,
      spO2: 98,
      temperature: 98.6,
      respiratoryRate: 16,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
    },
    topRiskFactors: ['Normal resting physiology'],
    clinicalAnalysis: 'Patient vitals are within normal stable baseline limits. Continuous telemetry active.',
    recommendedActions: ['Continue standard ward monitoring protocol.'],
    timestamp: new Date().toISOString(),
  }) : null;

  if (!patient || !analysis) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm my-12 space-y-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto text-emerald-700">
          🧠
        </div>
        <h3 className="text-lg font-serif italic text-stone-800">
          No Patient Selected for AI Risk Analysis
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Admit a patient or switch to <strong>Demo Ward Mode</strong> in the top header to evaluate the Random Forest clinical inference model.
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
      {/* Patient Selector Banner */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-[#6B705C]/15 border border-[#6B705C]/30 text-[#5B6356]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Select Patient for AI Risk Analysis
            </label>
            <select
              id="ai-analysis-patient-select"
              value={patient.id}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="mt-0.5 block w-full md:w-72 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-[#2D312B] font-semibold focus:outline-none focus:border-[#6B705C]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.name} ({p.currentRisk})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-500 font-mono-data hidden sm:inline">
            Model: <strong className="text-[#5B6356]">FastAPI Random Forest v2.4</strong>
          </span>
          <RiskBadge level={analysis.riskLevel} />
          <button
            id="ai-analysis-export-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Primary AI Decision Support Card */}
      <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-mono-data font-bold uppercase">
                CLINICAL DECISION SUPPORT
              </span>
              <span className="text-xs text-stone-400 font-mono-data">
                Inference Timestamp: {analysis.analysisTimestamp}
              </span>
            </div>
            <h2 className="text-xl font-serif text-[#2D312B] mt-1">
              AI Risk & Diagnostic Classification
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-400 font-mono-data uppercase">FastAPI Endpoint</span>
            <div className="text-xs font-mono-data text-[#5B6356] bg-stone-50 px-2.5 py-1 rounded border border-stone-200">
              GET /api/v1/ai/analysis/{patient.id}
            </div>
          </div>
        </div>

        {/* Core 5 Fields Required by VitaGuard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Predicted Condition */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 lg:col-span-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              1. Predicted Condition
            </div>
            <div className="text-base font-serif text-[#2D312B] leading-tight font-bold">
              {analysis.predictedCondition}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Random Forest multi-class clinical ensemble output
            </p>
          </div>

          {/* 2. Risk Level */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              2. Risk Level
            </div>
            <div className="mt-1">
              <RiskBadge level={analysis.riskLevel} size="lg" showPulse={true} />
            </div>
            <p className="text-[10px] text-stone-400 mt-1 font-mono-data">Triage Priority Flag</p>
          </div>

          {/* 3. Confidence */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              3. Model Confidence
            </div>
            <div className="text-2xl font-serif text-[#5B6356]">
              {analysis.confidence.toFixed(1)}%
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#5B6356] h-full rounded-full"
                style={{ width: `${analysis.confidence}%` }}
              />
            </div>
          </div>

          {/* 4 & 5. Assigned Doctor & Department */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              4. Assigned Doctor & Dept
            </div>
            <div className="font-bold text-[#2D312B] text-xs">{analysis.assignedDoctor}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">{analysis.department}</div>
          </div>
        </div>

        {/* Recommended Action Box */}
        <div className="p-4 rounded-xl bg-[#F8F9F5] border border-[#6B705C]/30 space-y-1.5">
          <div className="flex items-center gap-2 text-[#5B6356] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#6B705C]" />
            <span>Clinical Recommendation Directive</span>
          </div>
          <p className="text-xs text-stone-800 leading-relaxed font-medium">
            {analysis.recommendedAction}
          </p>
        </div>

        {/* Feature Importance Attribution Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Random Forest Feature Importance Attribution
            </h4>
            <span className="text-[11px] text-stone-400 font-mono-data">SHAP Contribution Weights</span>
          </div>

          <div className="space-y-2">
            {analysis.featureAttributions.map((attr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2D312B]">{attr.feature}</span>
                    <span className="text-[11px] font-mono-data text-stone-500">
                      Observed: <strong className="text-[#5B6356]">{attr.clinicalValue}</strong> (Ref: {attr.normalRange})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-56">
                  <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        attr.impactDirection === 'ELEVATES_RISK'
                          ? 'bg-[#D66853]'
                          : attr.impactDirection === 'PROTECTIVE'
                          ? 'bg-emerald-600'
                          : 'bg-stone-400'
                      }`}
                      style={{ width: `${attr.importancePercent}%` }}
                    />
                  </div>
                  <span className="font-mono-data font-bold text-stone-700 w-12 text-right">
                    {attr.importancePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable Rationale */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
          <span className="font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Clinical Rationale
          </span>
          <p className="leading-relaxed">{analysis.clinicalRationale}</p>
        </div>

        {/* Facility Capability & Nearby Hospital Escalation Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-lg">
                🚑
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <span>Hospital Capability & Regional Transfer Network</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    FACILITY MATCHING ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  If current hospital (St. Jude Medical Center) lacks specialized treatment for <strong>{analysis.predictedCondition}</strong>, escalate to regional partner hospital.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-1.5 shrink-0"
            >
              <span>🚨 Transfer to Partner Hospital</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">Recommended Facility</span>
              <div className="font-bold text-white">Metro Cardiac & Vascular Institute</div>
              <div className="text-[11px] text-cyan-300 font-mono">3.4 km • ~8 mins transit</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">Available Specialized Unit</span>
              <div className="font-bold text-emerald-400">Emergency Cath Lab & PCI</div>
              <div className="text-[11px] text-slate-300">3 of 16 ICU Beds Open</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">Emergency Intake Hotline</span>
              <div className="font-bold text-blue-400 font-mono">+1 (800) 555-CARD</div>
              <div className="text-[11px] text-purple-300">Auto-email alerted on transfer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-white border border-stone-200 shadow-xs gap-3">
        <div className="text-xs text-stone-600">
          Want a detailed breakdown of delta drops and triggers?
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('hospital-transfers')}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300"
          >
            <span>🚑 Partner Hospitals Directory</span>
          </button>
          <button
            onClick={() => onNavigate('explainable-risk')}
            className="px-4 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>View Explainable Risk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clinical Deterioration PDF Export Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={patient}
        aiAnalysis={analysis}
      />

      {/* Inter-Hospital Transfer Modal */}
      <InterHospitalTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        patient={patient}
        clinicalCondition={analysis.predictedCondition}
      />
    </div>
  );
};
