import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Radio,
  TrendingDown,
  Brain,
  FilePlus2,
  Stethoscope,
  UserPlus,
  Printer,
} from 'lucide-react';
import { Patient, NavigationPage, Doctor } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { AdmitPatientModal } from '../components/modals/AdmitPatientModal';
import { ClinicalReportModal } from '../components/modals/ClinicalReportModal';

interface PatientsPageProps {
  patients: Patient[];
  doctors?: Doctor[];
  onSelectPatient: (id: string) => void;
  onNavigate: (page: NavigationPage) => void;
  onAdmitPatient?: (patient: Patient, pairedDeviceId?: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({
  patients,
  doctors = [],
  onSelectPatient,
  onNavigate,
  onAdmitPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState<boolean>(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter((p) => {
    const matchesRisk = selectedRisk === 'ALL' || p.currentRisk === selectedRisk;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.assignedDoctor.toLowerCase().includes(q) ||
      p.ward.toLowerCase().includes(q) ||
      p.primaryDiagnosis.toLowerCase().includes(q);
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="patients-page-search-input"
            type="text"
            placeholder="Filter by name, ID, MRN, diagnosis, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs text-stone-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#6B705C]" />
            Risk:
          </span>
          {['ALL', 'CRITICAL', 'HIGH_RISK', 'MONITORING', 'STABLE'].map((risk) => {
            const isActive = selectedRisk === risk;
            return (
              <button
                key={risk}
                id={`filter-risk-btn-${risk.toLowerCase()}`}
                onClick={() => setSelectedRisk(risk)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2D312B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-[#2D312B] hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {risk.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Management Table */}
      <div className="rounded-2xl bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6B705C]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-600">
              Patient Registry ({filteredPatients.length} Admitted)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="admit-new-patient-btn"
              onClick={() => setIsAdmitModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Admit Patient</span>
            </button>
            <button
              onClick={() => onNavigate('vitals-entry')}
              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#2D312B] text-xs font-semibold flex items-center gap-1.5 border border-stone-200 transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-stone-600" />
              <span>Log Vitals</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-mono-data border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Name & Demographics</th>
                <th className="py-3 px-4">Location (Ward/Bed)</th>
                <th className="py-3 px-4">Primary Diagnosis</th>
                <th className="py-3 px-4">Current Risk</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[#2D312B]">
              {filteredPatients.map((pt) => (
                <tr
                  key={pt.id}
                  id={`patient-row-${pt.id}`}
                  className="hover:bg-stone-50 transition-colors group"
                >
                  {/* Patient ID */}
                  <td className="py-3.5 px-4 font-mono-data font-bold text-[#5B6356] whitespace-nowrap">
                    {pt.id}
                    <div className="text-[10px] text-stone-400 font-normal">{pt.mrn}</div>
                  </td>

                  {/* Name & Age */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#2D312B] text-sm">{pt.name}</div>
                    <div className="text-[11px] text-stone-500">
                      {pt.age} yrs • {pt.gender === 'M' ? 'Male' : 'Female'}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-stone-800">{pt.ward}</div>
                    <div className="text-[11px] font-mono-data text-stone-500">{pt.bed}</div>
                  </td>

                  {/* Diagnosis */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="line-clamp-2 text-stone-700">{pt.primaryDiagnosis}</div>
                  </td>

                  {/* Current Risk */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={pt.currentRisk} size="sm" />
                  </td>

                  {/* Current Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={pt.clinicalStatus} size="sm" />
                  </td>

                  {/* Assigned Doctor */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-[#5B6356] flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-stone-400" />
                      {pt.assignedDoctor}
                    </div>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 font-mono-data text-[11px]">
                    {pt.lastUpdated}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`btn-live-${pt.id}`}
                        onClick={() => {
                          onSelectPatient(pt.id);
                          onNavigate('live-monitoring');
                        }}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-[#2D312B] transition-colors"
                        title="Open Live ESP32 Sensor Monitoring"
                      >
                        <Radio className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-trend-${pt.id}`}
                        onClick={() => {
                          onSelectPatient(pt.id);
                          onNavigate('deterioration');
                        }}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-[#2D312B] transition-colors"
                        title="View Deterioration Trend"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-ai-${pt.id}`}
                        onClick={() => {
                          onSelectPatient(pt.id);
                          onNavigate('ai-analysis');
                        }}
                        className="p-1.5 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white transition-colors"
                        title="Run Random Forest AI Prediction"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-report-${pt.id}`}
                        onClick={() => setReportPatient(pt)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-[#2D312B] transition-colors"
                        title="Export Clinical Medical Summary (PDF / Print)"
                      >
                        <Printer className="w-3.5 h-3.5 text-stone-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-stone-400 text-xs">
                    No patients match the search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        doctors={doctors}
        onAdmit={(newPt, deviceId) => {
          if (onAdmitPatient) {
            onAdmitPatient(newPt, deviceId);
          }
          onSelectPatient(newPt.id);
        }}
      />

      {/* Clinical Report PDF Modal */}
      {reportPatient && (
        <ClinicalReportModal
          isOpen={Boolean(reportPatient)}
          onClose={() => setReportPatient(null)}
          patient={reportPatient}
        />
      )}
    </div>
  );
};
