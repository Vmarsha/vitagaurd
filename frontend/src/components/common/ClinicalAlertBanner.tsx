import React from 'react';
import { AlertOctagon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ClinicalAlert } from '../../types';

interface ClinicalAlertBannerProps {
  criticalAlerts: ClinicalAlert[];
  onViewAlerts: () => void;
  onQuickAck: (alert: ClinicalAlert) => void;
}

export const ClinicalAlertBanner: React.FC<ClinicalAlertBannerProps> = ({
  criticalAlerts,
  onViewAlerts,
  onQuickAck,
}) => {
  if (criticalAlerts.length === 0) return null;

  const topAlert = criticalAlerts[0];

  return (
    <div
      id="critical-clinical-alert-banner"
      className="bg-[#D66853] border-b border-[#c25844] px-6 py-2.5 flex items-center justify-between text-white shadow-md animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-white/20 text-white flex-shrink-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-black/20 px-2 py-0.5 rounded font-mono-data">
              CRITICAL ESCALATION ({criticalAlerts.length} Active)
            </span>
            <span className="font-bold text-sm text-white">
              {topAlert.patientName} ({topAlert.patientId} • {topAlert.ward})
            </span>
          </div>
          <p className="text-xs text-white/90 mt-0.5 line-clamp-1">
            {topAlert.predictedCondition} — {topAlert.alertReason}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id={`banner-quick-ack-${topAlert.id}`}
          onClick={() => onQuickAck(topAlert)}
          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-[#2D312B] font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Acknowledge</span>
        </button>
        <button
          id="banner-view-all-alerts-btn"
          onClick={onViewAlerts}
          className="px-3 py-1.5 bg-[#c25844] hover:bg-[#b04d3b] text-white font-semibold text-xs rounded-md border border-white/20 transition-colors flex items-center gap-1"
        >
          <span>View All Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
