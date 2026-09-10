import React from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  HeartPulse,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  Patient,
  OverviewMetrics,
  ClinicalAlert,
  DeteriorationData,
  NavigationPage,
} from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OverviewPageProps {
  metrics: OverviewMetrics;
  patients: Patient[];
  alerts: ClinicalAlert[];
  deteriorationMap: Record<string, DeteriorationData>;
  onNavigate: (page: NavigationPage) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenAcknowledge: (alert: ClinicalAlert) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metrics,
  patients,
  alerts,
  deteriorationMap,
  onNavigate,
  onSelectPatient,
  onOpenAcknowledge,
}) => {
  // Risk distribution data for chart
  const riskDistributionData = [
    { name: 'Stable', value: metrics.stablePatients, color: '#5B6356' },
    { name: 'Monitoring', value: metrics.monitoringRequired, color: '#a8a29e' },
    { name: 'High Risk', value: metrics.highRiskPatients, color: '#d97706' },
    { name: 'Critical', value: metrics.criticalPatients, color: '#D66853' },
  ];

  // Recent deterioration events sorted by score
  const deteriorationEvents: DeteriorationData[] = (Object.values(deteriorationMap) as DeteriorationData[])
    .filter((d: DeteriorationData) => d.deteriorationScore > 30)
    .sort((a: DeteriorationData, b: DeteriorationData) => b.deteriorationScore - a.deteriorationScore);

  // Active unacknowledged alerts
  const unackedAlerts = alerts.filter(
    (a) => a.ackStatus === 'PENDING' || a.ackStatus === 'SENT'
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Clinical Metric Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Patients */}
        <div
          id="stat-card-total-patients"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white p-3.5 rounded-xl shadow-xs border border-stone-200 hover:border-stone-300 transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Total Patients</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif text-[#2D312B]">{metrics.totalPatients}</div>
          <div className="text-[10px] text-stone-400 mt-1 font-mono-data">Active Beds</div>
        </div>

        {/* Stable Patients */}
        <div
          id="stat-card-stable-patients"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white p-3.5 rounded-xl shadow-xs border border-stone-200 hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Stable</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif text-emerald-700">{metrics.stablePatients}</div>
          <div className="text-[10px] text-stone-400 mt-1 font-mono-data">Normal Vitals</div>
        </div>

        {/* Monitoring Required */}
        <div
          id="stat-card-monitoring-patients"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white p-3.5 rounded-xl shadow-xs border border-stone-200 hover:border-stone-300 transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Monitoring</span>
            <Activity className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-serif text-stone-700">{metrics.monitoringRequired}</div>
          <div className="text-[10px] text-stone-400 mt-1 font-mono-data">Borderline Drift</div>
        </div>

        {/* High Risk Patients */}
        <div
          id="stat-card-highrisk-patients"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white p-3.5 rounded-xl shadow-xs border border-stone-200 hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif text-amber-700">{metrics.highRiskPatients}</div>
          <div className="text-[10px] text-stone-400 mt-1 font-mono-data">Escalation Pending</div>
        </div>

        {/* Critical Patients */}
        <div
          id="stat-card-critical-patients"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer bg-white p-3.5 rounded-xl shadow-xs border border-stone-200 border-l-4 border-l-[#D66853] hover:border-stone-300 transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Critical</span>
            <HeartPulse className="w-4 h-4 text-[#D66853]" />
          </div>
          <div className="text-2xl font-serif text-[#D66853]">{metrics.criticalPatients}</div>
          <div className="text-[10px] text-stone-400 mt-1 font-mono-data">Immediate ICU</div>
        </div>

        {/* Active Alerts */}
        <div
          id="stat-card-active-alerts"
          onClick={() => onNavigate('clinical-alerts')}
          className="cursor-pointer bg-[#D66853] p-3.5 rounded-xl shadow-xs hover:bg-[#c25844] transition-all text-white"
        >
          <div className="flex items-center justify-between text-white/80 mb-1">
            <span className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-serif text-white">{unackedAlerts.length}</div>
          <div className="text-[10px] text-white/80 mt-1 font-mono-data font-medium">
            {metrics.acknowledgedAlertsToday} Acked Today
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Distribution & Quick Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600">Risk Distribution</h3>
              <p className="text-xs text-stone-400">Current triage stratification across all units</p>
            </div>
            <span className="text-[10px] font-mono-data text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200 font-bold">
              N = {metrics.totalPatients}
            </span>
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-stone-100 text-xs">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-[#2D312B] font-mono-data">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Clinical Escalations / Unacknowledged Alerts */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D66853]" />
                  Critical Clinical Alerts
                </h3>
                <p className="text-xs text-stone-400">
                  Real-time alerts triggered by deterioration trend or Random Forest inference
                </p>
              </div>
              <button
                onClick={() => onNavigate('clinical-alerts')}
                className="text-xs text-[#6B705C] hover:text-[#2D312B] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>All Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {unackedAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <RiskBadge level={alert.riskLevel} size="sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2D312B]">
                          {alert.patientName} ({alert.patientId})
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {alert.ward} • {alert.bed}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                        {alert.alertReason}
                      </p>
                      <div className="text-[10px] text-stone-400 font-mono-data mt-0.5">
                        Assigned: {alert.assignedDoctor} • Det. Score: <span className="font-bold text-[#D66853]">{alert.deteriorationScore}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      id={`overview-ack-btn-${alert.id}`}
                      onClick={() => onOpenAcknowledge(alert)}
                      className="px-3 py-1 bg-[#2D312B] hover:bg-[#3a3f37] text-white font-bold text-xs rounded-md shadow-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}

              {unackedAlerts.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-100">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                  All active clinical alerts have been acknowledged.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span className="font-mono-data text-[10px]">ESP32 Telemetry Polling Rate: 250 Hz</span>
            <span className="text-[#6B705C] font-medium text-[11px]">Physician Pager Escalation Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Deterioration Events & Recent Patient Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deterioration Events */}
        <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Recent Deterioration Events
              </h3>
              <p className="text-xs text-stone-400">Patients exhibiting multi-vital negative trending</p>
            </div>
            <button
              onClick={() => onNavigate('deterioration')}
              className="text-xs text-[#6B705C] hover:text-[#2D312B] font-semibold flex items-center gap-1"
            >
              <span>Trends</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {deteriorationEvents.slice(0, 4).map((event) => (
              <div
                key={event.patientId}
                onClick={() => {
                  onSelectPatient(event.patientId);
                  onNavigate('deterioration');
                }}
                className="cursor-pointer p-3 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#2D312B]">{event.patientName}</span>
                    <span className="text-[11px] font-mono-data text-stone-400">({event.patientId})</span>
                    <StatusBadge status={event.status} size="sm" />
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                    {event.flaggedReasons[0] || 'Multi-vital deviation observed'}
                  </p>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-[10px] text-stone-400 font-mono-data uppercase">Score</div>
                  <div
                    className={`text-lg font-bold font-mono-data ${
                      event.deteriorationScore >= 75
                        ? 'text-[#D66853]'
                        : event.deteriorationScore >= 50
                        ? 'text-amber-700'
                        : 'text-stone-700'
                    }`}
                  >
                    {event.deteriorationScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patient Activity & Admission Status */}
        <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6B705C]" />
                Recent Patient Activity & Registry
              </h3>
              <p className="text-xs text-stone-400">Active telemetry and assigned clinical teams</p>
            </div>
            <button
              onClick={() => onNavigate('patients')}
              className="text-xs text-[#6B705C] hover:text-[#2D312B] font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {patients.slice(0, 4).map((pt) => (
              <div
                key={pt.id}
                onClick={() => {
                  onSelectPatient(pt.id);
                  onNavigate('live-monitoring');
                }}
                className="cursor-pointer p-3 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#6B705C]/50 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#2D312B]">{pt.name}</span>
                    <span className="text-[11px] text-stone-400">
                      {pt.age}y {pt.gender} • {pt.ward} ({pt.bed})
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Diagnosis: <span className="text-[#2D312B] font-medium">{pt.primaryDiagnosis}</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-mono-data">
                    Doctor: {pt.assignedDoctor} • Last Sync: {pt.lastUpdated}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                  <RiskBadge level={pt.currentRisk} size="sm" />
                  <span className="text-[10px] text-[#6B705C] hover:underline flex items-center gap-0.5 font-medium">
                    Live Stream <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
