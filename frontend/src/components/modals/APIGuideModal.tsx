import React, { useState } from 'react';
import {
  X,
  Code2,
  Database,
  FileCode,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';

interface APIGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APIGuideModal: React.FC<APIGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const projectTree = `vitaguard-frontend/
├── src/
│   ├── types/               # TypeScript interfaces matching FastAPI Pydantic models
│   │   └── index.ts
│   ├── services/
│   │   ├── api.ts           # REST API client: Set VITE_API_BASE_URL here
│   │   ├── websocket.ts     # ⭐️ WEBSOCKET STREAM SERVICE: ESP32 telemetry stream
│   │   └── mockData.ts      # Clinical mock datasets for zero-config preview
│   ├── components/
│   │   ├── common/          # VitalCard, ECGWaveform, DeviceConnectionIndicator, Badges
│   │   ├── layout/          # Clinical Sidebar, Header, Emergency Banner
│   │   └── modals/          # AcknowledgeModal, APIGuideModal, WebSocketSettingsModal
│   ├── pages/               # 10 clinical pages
│   │   ├── OverviewPage.tsx
│   │   ├── LiveMonitoringPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── VitalsEntryPage.tsx
│   │   ├── AIAnalysisPage.tsx
│   │   ├── DeteriorationPage.tsx
│   │   ├── ExplainableRiskPage.tsx
│   │   ├── ClinicalAlertsPage.tsx
│   │   ├── AlertHistoryPage.tsx
│   │   └── DoctorsPage.tsx
│   └── App.tsx              # Main application shell with navigation state
├── .env.example             # Defines VITE_API_BASE_URL and VITE_WS_BASE_URL
└── package.json`;

  const fastApiEndpoints = `# FastAPI Endpoint Signatures matching VitaGuard Frontend:

1. GET  /api/v1/overview/metrics
   Returns summary counts (total, stable, monitoring, high_risk, critical, active_alerts)

2. WS   /api/v1/sensors/live/{patient_id}/ws  ⭐️ REAL-TIME WEBSOCKET STREAM
   Continuous WebSocket stream for ESP32 live biosignals (HR, SpO2, Temp, ECG Lead II, Motion, Fall)

3. GET  /api/v1/sensors/live/{patient_id}
   REST snapshot of latest ESP32 IoT telemetry

4. GET  /api/v1/patients
   Returns patient registry with current risk triage

5. POST /api/v1/vitals/clinical-entry
   Accepts manual triage vitals (Age, RR, Systolic BP, Diastolic BP, Consciousness)

6. GET  /api/v1/ai/analysis/{patient_id}
   Executes Random Forest classification & returns prediction, confidence %, and attribution

7. GET  /api/v1/deterioration/{patient_id}
   Calculates deterioration score (0-100) and historical trend curves

8. GET  /api/v1/ai/explain/{patient_id}
   Returns explainable feature divergence ("Why was this patient flagged?")

9. GET  /api/v1/alerts
   Returns active escalation alerts (PENDING, SENT, COOLDOWN, ACKNOWLEDGED)

10. POST /api/v1/alerts/{alert_id}/acknowledge
    Updates escalation status, logs attending doctor name, time, and clinical note

11. GET /api/v1/doctors
    Returns doctor roster, active cases, and escalation pager status`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="fastapi-integration-guide-modal"
        className="w-full max-w-4xl max-h-[90vh] bg-white border border-stone-300 rounded-2xl shadow-2xl flex flex-col text-[#2D312B] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6B705C]/15 text-[#6B705C] border border-[#6B705C]/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-semibold text-lg text-[#2D312B]">
                VitaGuard Project Structure & FastAPI Integration
              </h3>
              <p className="text-xs text-stone-500">
                Plug-and-play architecture connecting Frontend ↔ FastAPI ↔ Random Forest ML ↔ ESP32 IoT Nodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D312B] hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick instructions banner */}
          <div className="p-4 rounded-xl bg-[#F8F9F5] border border-stone-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6356] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6B705C]" />
              How to Connect Your FastAPI Backend
            </h4>
            <p className="text-xs text-stone-700 leading-relaxed">
              VitaGuard was built with a clean separation of concerns. All network calls pass through{' '}
              <code className="px-1.5 py-0.5 rounded bg-stone-200 text-[#2D312B] font-mono-data">
                /src/services/api.ts
              </code>
              . Simply set the environment variable:
            </p>
            <div className="bg-[#2D312B] px-3 py-2 rounded-lg font-mono-data text-xs text-stone-200 border border-[#3a3f37] flex items-center justify-between">
              <code>VITE_API_BASE_URL="http://localhost:8000/api/v1"</code>
              <button
                onClick={() => copyCode('VITE_API_BASE_URL="http://localhost:8000/api/v1"', 'env')}
                className="text-stone-400 hover:text-white transition-colors"
              >
                {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Project Directory Tree */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#6B705C]" />
                Frontend Project Structure
              </label>
              <button
                onClick={() => copyCode(projectTree, 'tree')}
                className="text-xs text-stone-500 hover:text-[#2D312B] flex items-center gap-1 font-mono-data"
              >
                {copiedSection === 'tree' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Tree</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#2D312B] border border-[#3a3f37] text-xs font-mono-data text-stone-300 overflow-x-auto leading-relaxed">
              {projectTree}
            </pre>
          </div>

          {/* FastAPI REST Endpoints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6B705C]" />
                FastAPI REST Endpoints Mapping
              </label>
              <button
                onClick={() => copyCode(fastApiEndpoints, 'endpoints')}
                className="text-xs text-stone-500 hover:text-[#2D312B] flex items-center gap-1 font-mono-data"
              >
                {copiedSection === 'endpoints' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Endpoints</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#2D312B] border border-[#3a3f37] text-xs font-mono-data text-stone-200 overflow-x-auto leading-relaxed">
              {fastApiEndpoints}
            </pre>
          </div>

          {/* System Pipeline Diagram */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Complete VitaGuard System Architecture Workflow
            </h5>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-data text-stone-700">
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-emerald-800 font-semibold">
                ESP32 Sensor Telemetry
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-[#5B6356] font-semibold">
                Clinical Inputs (RR, BP)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-stone-800 font-semibold">
                FastAPI SQLite Storage
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-amber-800 font-semibold">
                Deterioration Trend Engine
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-[#6B705C] font-semibold">
                Random Forest AI Classifier
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2.5 py-1 rounded bg-white border border-stone-200 text-[#D66853] font-semibold">
                Explainable Risk & Doctor Alert
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold transition-colors shadow-xs"
          >
            Close Architecture Guide
          </button>
        </div>
      </div>
    </div>
  );
};
