import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  ClinicalAlert,
  NavigationPage,
} from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { InterHospitalTransferModal } from '../components/modals/InterHospitalTransferModal';

interface ClinicalAlertsPageProps {
  alerts: ClinicalAlert[];
  onOpenAcknowledge: (alert: ClinicalAlert) => void;
  onNavigate: (page: NavigationPage) => void;
  onSelectPatient: (patientId: string) => void;
}

export const ClinicalAlertsPage: React.FC<ClinicalAlertsPageProps> = ({
  alerts,
  onOpenAcknowledge,
  onNavigate,
  onSelectPatient,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [selectedAlertForTransfer, setSelectedAlertForTransfer] = useState<ClinicalAlert | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedStatus === 'ALL') return true;
    return a.ackStatus === selectedStatus || a.emailStatus === selectedStatus;
  });

  const pendingCount = alerts.filter((a) => a.ackStatus === 'PENDING').length;
  const sentCount = alerts.filter((a) => a.emailStatus === 'SENT' && a.ackStatus !== 'ACKNOWLEDGED').length;
  const cooldownCount = alerts.filter((a) => a.ackStatus === 'COOLDOWN').length;
  const ackedCount = alerts.filter((a) => a.ackStatus === 'ACKNOWLEDGED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Status Tabs */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D66853]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#5B6356]">
              Clinical Escalation & Doctor Notification Center
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time escalation dispatch with SMTP email alerts and attending physician acknowledgement tracking.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-[#2D312B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-[#2D312B] border border-stone-200'
            }`}
          >
            ALL ({alerts.length})
          </button>
          <button
            onClick={() => setSelectedStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedStatus === 'PENDING'
                ? 'bg-[#2D312B] text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:text-amber-950 border border-amber-200'
            }`}
          >
            <span>PENDING</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200/60 text-[10px] font-mono-data font-bold">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedStatus('SENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedStatus === 'SENT'
                ? 'bg-[#2D312B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:text-[#2D312B] border border-stone-200'
            }`}
          >
            <span>SENT</span>
            <span className="px-1.5 py-0.2 rounded bg-stone-200 text-[10px] font-mono-data font-bold">
              {sentCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedStatus('COOLDOWN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedStatus === 'COOLDOWN'
                ? 'bg-[#2D312B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:text-[#2D312B] border border-stone-200'
            }`}
          >
            <span>COOLDOWN</span>
            <span className="px-1.5 py-0.2 rounded bg-stone-200 text-[10px] font-mono-data font-bold">
              {cooldownCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedStatus('ACKNOWLEDGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedStatus === 'ACKNOWLEDGED'
                ? 'bg-[#2D312B] text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 hover:text-emerald-950 border border-emerald-200'
            }`}
          >
            <span>ACKNOWLEDGED</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 text-[10px] font-mono-data font-bold">
              {ackedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D66853]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600">
              Active Alerts Register ({filteredAlerts.length})
            </h3>
          </div>
          <span className="text-xs font-mono-data text-stone-400">
            FastAPI: POST /api/v1/alerts/{'{alert_id}'}/acknowledge
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-mono-data border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Predicted Condition</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Det. Score</th>
                <th className="py-3 px-4">Alert Reason / Trigger</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-4">Email Status</th>
                <th className="py-3 px-4">Ack Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[#2D312B]">
              {filteredAlerts.map((alt) => {
                const isAcked = alt.ackStatus === 'ACKNOWLEDGED';
                return (
                  <tr
                    key={alt.id}
                    id={`clinical-alert-row-${alt.id}`}
                    className={`hover:bg-stone-50 transition-colors ${
                      alt.riskLevel === 'CRITICAL' && !isAcked ? 'bg-red-50/40' : ''
                    }`}
                  >
                    {/* Alert ID */}
                    <td className="py-3.5 px-4 font-mono-data font-bold text-stone-700 whitespace-nowrap">
                      {alt.id}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div
                        onClick={() => {
                          onSelectPatient(alt.patientId);
                          onNavigate('live-monitoring');
                        }}
                        className="font-bold text-[#2D312B] hover:text-[#5B6356] cursor-pointer"
                      >
                        {alt.patientName}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {alt.patientId} • {alt.ward} ({alt.bed})
                      </div>
                    </td>

                    {/* Predicted Condition */}
                    <td className="py-3.5 px-4 max-w-xs font-semibold text-[#2D312B]">
                      {alt.predictedCondition}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskBadge level={alt.riskLevel} size="sm" showPulse={!isAcked} />
                    </td>

                    {/* Deterioration Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-mono-data font-bold px-2 py-0.5 rounded text-xs border ${
                          alt.deteriorationScore >= 75
                            ? 'bg-red-50 border-red-200 text-[#D66853]'
                            : alt.deteriorationScore >= 50
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        {alt.deteriorationScore}/100
                      </span>
                    </td>

                    {/* Alert Reason */}
                    <td className="py-3.5 px-4 max-w-sm text-stone-600">
                      <div className="line-clamp-2">{alt.alertReason}</div>
                    </td>

                    {/* Assigned Doctor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#2D312B]">{alt.assignedDoctor}</div>
                    </td>

                    {/* Email Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={alt.emailStatus} type="email" size="sm" />
                    </td>

                    {/* Acknowledgement Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={alt.ackStatus} type="alert" size="sm" />
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono-data text-stone-400 text-[11px] whitespace-nowrap">
                      {alt.timestamp}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAlertForTransfer(alt);
                            setIsTransferModalOpen(true);
                          }}
                          title="Initiate Inter-Hospital Transfer if local treatment is unavailable"
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <span>🚑</span>
                          <span className="hidden sm:inline">Transfer</span>
                        </button>

                        {isAcked ? (
                          <span className="text-[11px] font-mono-data text-emerald-700 flex items-center gap-1 font-semibold pl-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Acked</span>
                          </span>
                        ) : (
                          <button
                            id={`alert-ack-btn-${alt.id}`}
                            onClick={() => onOpenAcknowledge(alt)}
                            className="px-3 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ACK</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-stone-400 text-xs">
                    No clinical alerts found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inter-Hospital Transfer Modal */}
      {selectedAlertForTransfer && (
        <InterHospitalTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setSelectedAlertForTransfer(null);
          }}
          patient={{
            id: selectedAlertForTransfer.patientId,
            name: selectedAlertForTransfer.patientName,
            age: selectedAlertForTransfer.age || 65,
            gender: 'M',
            mrn: selectedAlertForTransfer.patientId,
            ward: selectedAlertForTransfer.ward || 'General Ward',
            bed: selectedAlertForTransfer.bed || '—',
            currentRisk: selectedAlertForTransfer.riskLevel,
            currentStatus: 'CRITICAL',
            assignedDoctor: selectedAlertForTransfer.assignedDoctor,
            doctorId: selectedAlertForTransfer.doctorId,
            department: 'Cardiology',
            admissionDate: selectedAlertForTransfer.timestamp,
            primaryDiagnosis: selectedAlertForTransfer.condition,
            lastUpdated: selectedAlertForTransfer.timestamp,
          }}
          clinicalCondition={selectedAlertForTransfer.condition}
        />
      )}
    </div>
  );
};
