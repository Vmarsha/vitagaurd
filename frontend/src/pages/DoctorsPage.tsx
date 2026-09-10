import React, { useState } from 'react';
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  Search,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { Doctor, Patient, NavigationPage } from '../types';

interface DoctorsPageProps {
  doctors: Doctor[];
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({
  doctors,
  patients,
  onSelectPatient,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  const departments = ['ALL', 'Cardiology', 'Pulmonology', 'Critical Care / ICU', 'Internal Medicine', 'Emergency Medicine', 'Infectious Disease'];

  const filteredDoctors = (doctors || []).filter((doc) => {
    const matchesDept = departmentFilter === 'ALL' || doc.department === departmentFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      doc.name.toLowerCase().includes(q) ||
      (doc.specialization || (doc as any).specialty || '').toLowerCase().includes(q) ||
      doc.department.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner and Filters */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#5B6356]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#5B6356]">
              Attending Physicians & Escalation Directory
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Clinical team pager status, active patient load, and automated escalation routing directory.
          </p>
        </div>

        {/* Search & Dept */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="doctors-search-input"
              type="text"
              placeholder="Search physicians..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
            />
          </div>

          <select
            id="doctors-dept-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => {
          const docPatients = (patients || []).filter((p) =>
            p.assignedDoctor?.toLowerCase().includes(doc.name.toLowerCase()) ||
            doc.name.toLowerCase().includes(p.assignedDoctor?.toLowerCase() || '') ||
            ((doc as any).assignedPatientIds || []).includes(p.id)
          );
          const hasCriticalPatient = docPatients.some((p) => p.currentRisk === 'CRITICAL');
          const isOnCall = Boolean(doc.onCall ?? (doc as any).onCallStatus === 'ON_CALL');

          return (
            <div
              key={doc.id}
              id={`doctor-card-${doc.id}`}
              className={`rounded-2xl bg-white border p-5 shadow-xs flex flex-col justify-between transition-all ${
                hasCriticalPatient
                  ? 'border-red-300 ring-1 ring-red-200'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Doctor Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-[#5B6356] text-sm">
                      {doc.avatarInitials || doc.name.split(' ').map((n) => n[0]).join('').substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D312B] text-sm">{doc.name}</h3>
                      <div className="text-xs text-stone-500">{doc.specialization || (doc as any).specialty || 'Critical Care Lead'}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border uppercase ${
                      isOnCall
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {isOnCall ? 'ON CALL' : 'OFF DUTY'}
                  </span>
                </div>

                {/* Department & Contact Info */}
                <div className="space-y-1.5 py-3 border-y border-stone-100 text-xs text-[#2D312B]">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Building className="w-3.5 h-3.5 text-[#5B6356]" />
                    <span>{doc.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Mail className="w-3.5 h-3.5 text-[#5B6356]" />
                    <span className="font-mono-data">{doc.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Phone className="w-3.5 h-3.5 text-[#5B6356]" />
                    <span className="font-mono-data">Pager: {doc.pager || '#4412'}</span>
                  </div>
                </div>

                {/* Assigned Patients Summary */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-stone-500 uppercase text-[10px] tracking-wider">
                      Assigned Patients ({docPatients.length})
                    </span>
                    <span className="text-[11px] font-mono-data text-[#5B6356]">
                      Active Cases: {doc.activeCases ?? docPatients.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {docPatients.map((pt) => (
                      <div
                        key={pt.id}
                        onClick={() => {
                          onSelectPatient(pt.id);
                          onNavigate('live-monitoring');
                        }}
                        className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:border-[#6B705C] transition-all flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2D312B]">{pt.name}</span>
                          <span className="text-[10px] font-mono-data text-stone-400">
                            {pt.bed}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono-data font-bold px-1.5 py-0.5 rounded uppercase ${
                            pt.currentRisk === 'CRITICAL'
                              ? 'bg-red-100 text-[#D66853]'
                              : pt.currentRisk === 'HIGH_RISK'
                              ? 'bg-amber-100 text-amber-900'
                              : pt.currentRisk === 'MONITORING'
                              ? 'bg-stone-200 text-stone-800'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {(pt.currentRisk || 'STABLE').replace('_', ' ')}
                        </span>
                      </div>
                    ))}

                    {docPatients.length === 0 && (
                      <div className="text-stone-400 text-xs py-2 italic text-center">
                        No patients currently assigned to this physician.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono-data">Escalation Pager Active</span>
                <button
                  onClick={() => onNavigate('patients')}
                  className="text-[#5B6356] hover:text-[#2D312B] font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

