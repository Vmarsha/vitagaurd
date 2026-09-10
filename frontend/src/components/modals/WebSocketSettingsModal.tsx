import React, { useState } from 'react';
import {
  X,
  Server,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Radio,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { WsConnectionStatus, TelemetryStreamPacket } from '../../types';
import {
  telemetryStreamService,
  FASTAPI_WEBSOCKET_BACKEND_CODE,
} from '../../services/websocket';

interface WebSocketSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  currentStatus: WsConnectionStatus;
  statusMessage: string;
  isEmulated: boolean;
  lastPacket: TelemetryStreamPacket | null;
  onManualReconnect: () => void;
}

export const WebSocketSettingsModal: React.FC<WebSocketSettingsModalProps> = ({
  isOpen,
  onClose,
  patientId,
  currentStatus,
  statusMessage,
  isEmulated,
  lastPacket,
  onManualReconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'backend-code' | 'json-stream'>('status');
  const [customWsUrl, setCustomWsUrl] = useState<string>(() =>
    telemetryStreamService.buildEndpointUrl(patientId)
  );
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    telemetryStreamService.updateConfig({
      autoFallbackToMock: false, // Force real connection attempt
    });
    telemetryStreamService.connect(patientId, customWsUrl);
  };

  const handleToggleEmulatedMode = (enableEmulated: boolean) => {
    if (enableEmulated) {
      telemetryStreamService.updateConfig({ autoFallbackToMock: true });
      telemetryStreamService.startFallbackStream(patientId);
    } else {
      telemetryStreamService.updateConfig({ autoFallbackToMock: false });
      telemetryStreamService.connect(patientId, customWsUrl);
    }
  };

  const copyBackendCode = () => {
    navigator.clipboard.writeText(FASTAPI_WEBSOCKET_BACKEND_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="ws-stream-settings-modal"
        className="w-full max-w-3xl max-h-[90vh] bg-white border border-stone-300 rounded-2xl shadow-2xl flex flex-col text-[#2D312B] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6B705C]/15 text-[#6B705C] border border-[#6B705C]/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-semibold text-lg text-[#2D312B]">
                WebSocket Streaming & Backend Integration
              </h3>
              <p className="text-xs text-stone-500">
                Patient: <span className="font-mono-data font-bold text-stone-700">{patientId}</span> • Real-Time Biosignal Ingestion Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-white border-t-2 border-t-[#6B705C] text-[#2D312B] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Connection & Stream Config</span>
          </button>

          <button
            onClick={() => setActiveTab('json-stream')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'json-stream'
                ? 'bg-white border-t-2 border-t-[#6B705C] text-[#2D312B] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Packet Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('backend-code')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'backend-code'
                ? 'bg-white border-t-2 border-t-[#6B705C] text-[#2D312B] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>FastAPI Backend WS Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: STATUS & CONFIG */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                    Current Telemetry Status
                  </span>
                  <span
                    className={`font-mono-data font-bold px-2.5 py-0.5 rounded text-xs border ${
                      currentStatus === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : currentStatus === 'CONNECTING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : currentStatus === 'NO_RECENT_DATA'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : currentStatus === 'ERROR'
                        ? 'bg-red-50 text-[#D66853] border-red-300'
                        : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200 text-stone-600">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Stream Mode:</span>
                    <span className="font-semibold text-[#2D312B]">
                      {isEmulated ? 'Mock Baseline / REST Fallback' : 'Direct FastAPI WebSocket'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Last Server Packet:</span>
                    <span className="font-mono-data text-[#2D312B]">
                      {lastPacket?.timestamp || 'None yet'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 italic">
                  Status message: {statusMessage}
                </p>
              </div>

              {/* Endpoint Connection Form */}
              <form onSubmit={handleApplyCustomUrl} className="space-y-3">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[11px] block">
                  Target FastAPI WebSocket Endpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customWsUrl}
                    onChange={(e) => setCustomWsUrl(e.target.value)}
                    placeholder="ws://localhost:8000/ws/patients/{patientId}"
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono-data text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                </div>
                <p className="text-stone-500 text-[11px]">
                  Configurable pattern (from <code className="font-mono-data bg-stone-100 px-1 py-0.5 rounded">VITE_WS_BASE_URL</code>): <code className="font-mono-data bg-stone-100 px-1 py-0.5 rounded">/ws/patients/{'{patientId}'}</code>
                </p>
              </form>

              {/* Stream Switcher */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-800">Stream Mode Toggle</h4>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Toggle to mock fallback stream if your FastAPI WebSocket endpoint is still being deployed.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleEmulatedMode(true)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                      isEmulated
                        ? 'bg-[#2D312B] text-white shadow-xs'
                        : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    Mock / REST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEmulatedMode(false)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                      !isEmulated
                        ? 'bg-[#2D312B] text-white shadow-xs'
                        : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    Live WebSocket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE JSON PACKET MONITOR */}
          {activeTab === 'json-stream' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-600 uppercase tracking-wider text-[11px]">
                  Latest Decoded Telemetry Packet
                </span>
                <span className="font-mono-data text-stone-400 text-[11px]">
                  Payload format: JSON (ESP32 Lead II & Vitals)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#252823] text-[#A3B18A] font-mono-data text-xs overflow-x-auto border border-[#3a3f37] max-h-72">
                {lastPacket ? (
                  <pre>{JSON.stringify(lastPacket, null, 2)}</pre>
                ) : (
                  <div className="text-stone-400 italic">Waiting for incoming packet...</div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 flex items-center gap-2 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  The WebSocket payload automatically binds to Heart Rate, SpO2, Temperature, ECG Lead-II, Motion, and Fall detection states.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: FASTAPI BACKEND CODE */}
          {activeTab === 'backend-code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-800">Required FastAPI Backend Implementation</h4>
                  <p className="text-stone-500 text-[11px]">
                    Drop this into your FastAPI service to enable real-time WebSocket telemetry for all patients.
                  </p>
                </div>
                <button
                  onClick={copyBackendCode}
                  className="px-3 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Python Code'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#252823] text-stone-200 font-mono-data text-xs overflow-x-auto border border-[#3a3f37] max-h-80">
                <pre>{FASTAPI_WEBSOCKET_BACKEND_CODE}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-stone-500 font-mono-data">
            WebSocket Client Service v2.4 • Isolated Module
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
