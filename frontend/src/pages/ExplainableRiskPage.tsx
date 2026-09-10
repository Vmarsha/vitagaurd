import React from 'react';
import {
  FileText,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  Patient,
  ExplainableRiskData,
  NavigationPage,
} from '../types';
import { RiskBadge } from '../components/common/RiskBadge';

interface ExplainableRiskPageProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  explainableRiskMap: Record<string, ExplainableRiskData>;
  onNavigate: (page: NavigationPage) => void;
}

export const ExplainableRiskPage: React.FC<ExplainableRiskPageProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  explainableRiskMap,
  onNavigate,
}) => {
  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const explain = patient ? (explainableRiskMap[patient.id] || {
    patientId: patient.id,
    riskLevel: patient.currentRisk || 'STABLE',
    deteriorationScore: 12,
    clinicalInterpretation: 'Patient exhibits normal, stable physiological baselines without significant risk elevation.',
    vitalContributions: [
      { vital: 'Heart Rate', value: '74 BPM', contributionScore: 18, direction: 'NEUTRAL' as const, clinicalMeaning: 'Within normal resting limits' },
      { vital: 'Blood Oxygen (SpO2)', value: '98%', contributionScore: 24, direction: 'SAFE' as const, clinicalMeaning: 'Optimal tissue oxygenation' },
      { vital: 'Temperature', value: '98.6°F', contributionScore: 14, direction: 'SAFE' as const, clinicalMeaning: 'Normothermic baseline' },
      { vital: 'Blood Pressure', value: '120/80', contributionScore: 16, direction: 'NEUTRAL' as const, clinicalMeaning: 'Adequate systemic perfusion' },
    ],
    shapValues: [
      { featureName: 'Temperature (°F)', shapValue: 0.22, baselineValue: 98.6 },
      { featureName: 'SpO2 (%)', shapValue: 0.20, baselineValue: 98.0 },
      { featureName: 'Heart Rate (BPM)', shapValue: 0.16, baselineValue: 74.0 },
      { featureName: 'Systolic BP (mmHg)', shapValue: 0.15, baselineValue: 120.0 },
    ],
  }) : null;

  if (!patient || !explain) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm my-12 space-y-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto text-emerald-700">
          🔍
        </div>
        <h3 className="text-lg font-serif italic text-stone-800">
          No Patient Selected for Explainable AI (XAI)
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Admit a patient or switch to <strong>Demo Ward Mode</strong> in the top header to inspect feature attributions and SHAP importance rankings.
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
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Select Patient for Explainable AI (XAI) Audit
            </label>
            <select
              id="explainable-risk-patient-select"
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

        <div className="flex items-center gap-3 text-xs">
          <span className="text-stone-500 font-mono-data">Deterioration Score: {explain?.deteriorationScore}/100</span>
          {explain && <RiskBadge level={explain.riskLevel} />}
        </div>
      </div>

      {/* Primary Flagged Box: WHY WAS THIS PATIENT FLAGGED? */}
      <div className="rounded-2xl bg-white border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-mono-data font-bold uppercase">
                EXPLAINABLE RISK ATTRIBUTION (XAI)
              </span>
              <span className="text-xs text-stone-400 font-mono-data">
                Persistence Window: {explain?.abnormalDurationMinutes} mins
              </span>
            </div>
            <h2 className="text-xl font-serif text-[#2D312B] mt-1 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#D66853]" />
              Why Was This Patient Flagged?
            </h2>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-mono-data block">
              FastAPI REST API Source
            </span>
            <code className="text-[#5B6356] font-mono-data">{explain?.backendEndpoint || 'GET /api/v1/ai/explain'}</code>
          </div>
        </div>

        {/* Backend Note Callout */}
        <div className="p-3.5 rounded-xl bg-[#F8F9F5] border border-[#6B705C]/30 text-xs text-stone-700 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#5B6356] flex-shrink-0" />
          <span>
            <strong>Note:</strong> This clinical explanation data is formatted according to the VitaGuard FastAPI schema and will be served dynamically by your Random Forest tree feature weights & physiological delta engine.
          </span>
        </div>

        {/* Highlighted Reason List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-600">
            Primary Escalation Triggers:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {explain?.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs"
              >
                <div className="p-1 rounded bg-red-100 text-[#D66853] mt-0.5 flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[#2D312B] font-medium leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physiological Delta Matrix Table (Baseline vs Current vs Delta) */}
        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-600">
            Physiological Delta Matrix (Baseline vs Current Drift)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-mono-data uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Pre-Admission Baseline</th>
                  <th className="py-2.5 px-3">Current Value</th>
                  <th className="py-2.5 px-3">Net Delta Drift</th>
                  <th className="py-2.5 px-3">Clinical Severity</th>
                  <th className="py-2.5 px-3">Explanation Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[#2D312B]">
                {explain?.factors.map((f, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#2D312B] whitespace-nowrap">{f.parameter}</td>
                    <td className="py-3 px-3 font-mono-data text-stone-500">{f.baseline}</td>
                    <td className="py-3 px-3 font-mono-data font-bold text-[#5B6356]">{f.current}</td>
                    <td className="py-3 px-3 font-mono-data font-bold">
                      <span
                        className={
                          f.severity === 'CRITICAL'
                            ? 'text-[#D66853]'
                            : f.severity === 'MODERATE'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }
                      >
                        {f.delta}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono-data px-2 py-0.5 rounded font-bold uppercase ${
                          f.severity === 'CRITICAL'
                            ? 'bg-red-50 text-[#D66853] border border-red-200'
                            : f.severity === 'MODERATE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600 max-w-sm">{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Attribution Notes */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
          <span className="font-bold text-stone-500 uppercase tracking-wider block">
            AI Model Attribution Summary
          </span>
          <p className="leading-relaxed">{explain?.aiAttributionNotes}</p>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="text-xs text-stone-600">
          Ready to dispatch or review active doctor notifications?
        </div>
        <button
          onClick={() => onNavigate('clinical-alerts')}
          className="px-4 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <span>View Clinical Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
