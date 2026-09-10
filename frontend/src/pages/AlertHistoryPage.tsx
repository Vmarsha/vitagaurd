import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
} from 'lucide-react';
import { ClinicalAlert } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

interface AlertHistoryPageProps {
  alerts: ClinicalAlert[];
}

export const AlertHistoryPage: React.FC<AlertHistoryPageProps> = ({ alerts }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredHistory = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.ackStatus === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      a.id.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      a.patientId.toLowerCase().includes(q) ||
      a.predictedCondition.toLowerCase().includes(q) ||
      a.assignedDoctor.toLowerCase().includes(q) ||
      (a.acknowledgedBy && a.acknowledgedBy.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const exportCSV = () => {
    const headers = [
      'Time',
      'Alert ID',
      'Patient ID',
      'Patient Name',
      'Condition',
      'Risk',
      'Det. Score',
      'Doctor',
      'Email Status',
      'Ack Status',
      'Ack By',
      'Ack Time',
      'Notes',
    ];
    const rows = filteredHistory.map((a) => [
      `"${a.timestamp}"`,
      `"${a.id}"`,
      `"${a.patientId}"`,
      `"${a.patientName}"`,
      `"${a.predictedCondition}"`,
      `"${a.riskLevel}"`,
      `"${a.deteriorationScore}"`,
      `"${a.assignedDoctor}"`,
      `"${a.emailStatus}"`,
      `"${a.ackStatus}"`,
      `"${a.acknowledgedBy || 'N/A'}"`,
      `"${a.acknowledgedAt || 'N/A'}"`,
      `"${(a.clinicalActionNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vitaguard_alert_history_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="alert-history-search-input"
            type="text"
            placeholder="Search history by patient, condition, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'ACKNOWLEDGED', 'PENDING', 'SENT', 'COOLDOWN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#2D312B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-[#2D312B] border border-stone-200'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={exportCSV}
            className="ml-auto md:ml-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#5B6356]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Alert History Table */}
      <div className="rounded-2xl bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#5B6356]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600">
              Clinical Alert History Log ({filteredHistory.length} Records)
            </h3>
          </div>
          <span className="text-xs font-mono-data text-stone-400">Audit Trail Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-mono-data border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Email Status</th>
                <th className="py-3 px-4">Acknowledgement Status</th>
                <th className="py-3 px-4">Audit / Bedside Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[#2D312B]">
              {filteredHistory.map((alt) => (
                <tr key={alt.id} className="hover:bg-stone-50 transition-colors">
                  {/* Time */}
                  <td className="py-3.5 px-4 font-mono-data text-stone-500 whitespace-nowrap">
                    {alt.timestamp}
                  </td>

                  {/* Patient */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-[#2D312B]">{alt.patientName}</div>
                    <div className="text-[11px] font-mono-data text-stone-400">
                      {alt.patientId} • {alt.ward}
                    </div>
                  </td>

                  {/* Condition */}
                  <td className="py-3.5 px-4 font-semibold text-[#2D312B] max-w-xs">
                    {alt.predictedCondition}
                  </td>

                  {/* Risk */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={alt.riskLevel} size="sm" />
                  </td>

                  {/* Doctor */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-stone-700">{alt.assignedDoctor}</div>
                  </td>

                  {/* Email Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={alt.emailStatus} type="email" size="sm" />
                  </td>

                  {/* Acknowledgement Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={alt.ackStatus} type="alert" size="sm" />
                  </td>

                  {/* Notes / Acknowledged Info */}
                  <td className="py-3.5 px-4 max-w-sm text-stone-600 text-xs">
                    {alt.acknowledgedBy ? (
                      <div>
                        <div className="text-[11px] text-[#5B6356] font-medium">
                          Acked by {alt.acknowledgedBy} at {alt.acknowledgedAt}
                        </div>
                        <p className="text-stone-700 italic mt-0.5 line-clamp-2">
                          "{alt.clinicalActionNote}"
                        </p>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Pending clinical sign-off</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                    No alert history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
