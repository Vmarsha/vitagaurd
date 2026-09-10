import React, { useState, useEffect } from 'react';
import { Patient, NearbyHospital, HospitalTransfer } from '../types';
import { VitaGuardAPI } from '../services/api';
import { InterHospitalTransferModal } from '../components/modals/InterHospitalTransferModal';
import { IndiaHospitalMap } from '../components/common/IndiaHospitalMap';

interface HospitalTransfersPageProps {
  patients: Patient[];
}

export const HospitalTransfersPage: React.FC<HospitalTransfersPageProps> = ({ patients }) => {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [transfers, setTransfers] = useState<HospitalTransfer[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [selectedPatientForTransfer, setSelectedPatientForTransfer] = useState<Patient | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hospData, trfData] = await Promise.all([
        VitaGuardAPI.getNearbyHospitals(),
        VitaGuardAPI.getTransfers(),
      ]);
      setHospitals(hospData);
      setTransfers(trfData);
    } catch (err) {
      console.error('Failed to load transfer network data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTransferModal = (patient?: Patient) => {
    if (patient) {
      setSelectedPatientForTransfer(patient);
    } else if (patients.length > 0) {
      // Pick first critical or high risk patient, or first in list
      const criticalPt = patients.find((p) => p.currentRisk === 'CRITICAL' || p.currentRisk === 'HIGH_RISK') || patients[0];
      setSelectedPatientForTransfer(criticalPt);
    }
    setIsTransferModalOpen(true);
  };

  const handleTransferSuccess = (newTransfer: HospitalTransfer) => {
    setTransfers((prev) => [newTransfer, ...prev]);
  };

  const filteredHospitals = selectedSpecialty === 'ALL'
    ? hospitals
    : hospitals.filter((h) =>
        h.primary_specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
        h.matched_conditions.some((c) => c.toLowerCase().includes(selectedSpecialty.toLowerCase()))
      );

  const totalIcuAvailable = hospitals.reduce((acc, h) => acc + (h.available_icu_beds || 0), 0);
  const totalIcuBeds = hospitals.reduce((acc, h) => acc + (h.total_icu_beds || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚑</span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Inter-Hospital Emergency Escalation Network
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Regional partner hospital directory, specialized treatment capability matching, and automated patient transfer dispatches when local facilities are unavailable.
          </p>
        </div>

        <button
          onClick={() => handleOpenTransferModal()}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2 shrink-0"
        >
          <span>🚨 Initiate Patient Transfer</span>
        </button>
      </div>

      {/* Network Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partner Hospitals</div>
          <div className="text-2xl font-black text-white mt-1">{hospitals.length} <span className="text-xs font-normal text-emerald-400">Accredited</span></div>
          <p className="text-[11px] text-slate-400 mt-1">Within 15-minute priority transit</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regional ICU Beds</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalIcuAvailable} <span className="text-xs font-normal text-slate-400">/ {totalIcuBeds} open</span></div>
          <p className="text-[11px] text-slate-400 mt-1">Real-time bed availability stream</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Transfer ETA</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">9.8 mins</div>
          <p className="text-[11px] text-slate-400 mt-1">Via Level-1 Critical Care Ambulance</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Dispatches</div>
          <div className="text-2xl font-black text-purple-400 mt-1">{transfers.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">With automated doctor alert emails</p>
        </div>
      </div>

      {/* Interactive India Emergency Medical Corridor Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">🗺️</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Bengaluru Emergency Transit Corridor & Partner Facility Map
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Real-time GPS routing & traffic-optimized transit lines
          </span>
        </div>
        <IndiaHospitalMap
          hospitals={filteredHospitals}
          selectedHospitalId={selectedHospitalId}
          onSelectHospital={(hosp) => setSelectedHospitalId(hosp.id)}
        />
      </div>

      {/* Specialty Filter Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-400 mr-2">Filter Facility:</span>
        {['ALL', 'Cardiology', 'Pulmonology', 'Sepsis', 'Infectious', 'Trauma'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedSpecialty(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              selectedSpecialty === cat
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat === 'ALL' ? 'All Partner Facilities' : cat}
          </button>
        ))}
      </div>

      {/* Partner Hospitals Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHospitals.map((hosp) => (
          <div
            key={hosp.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition group hover:shadow-xl"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {hosp.id}
                  </span>
                  <h3 className="font-bold text-base text-white mt-1 group-hover:text-blue-400 transition">
                    {hosp.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    {hosp.distance_km} km
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ~{hosp.travel_time_mins} min ETA
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3">{hosp.address}</p>

              {/* Primary Specialty Badge */}
              <div className="mb-3">
                <span className="text-xs font-semibold text-amber-300 block mb-1">
                  Primary Capability:
                </span>
                <div className="text-xs text-slate-200 font-medium bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                  {hosp.primary_specialty}
                </div>
              </div>

              {/* Specialized Available Treatments */}
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Available Treatments & Equipment:
                </span>
                <div className="space-y-1">
                  {hosp.available_treatments?.map((treatment, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-300 flex items-center space-x-1.5 bg-slate-950/40 px-2 py-1 rounded border border-slate-800"
                    >
                      <span className="text-emerald-400 text-xs">✓</span>
                      <span className="truncate">{treatment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{hosp.available_icu_beds} of {hosp.total_icu_beds} ICU Beds Free</span>
                </span>
                <span className="text-blue-400 font-mono text-[11px]">
                  {hosp.emergency_phone}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${hosp.emergency_phone}`}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition border border-slate-700"
                >
                  📞 Call Hotline
                </a>
                <button
                  onClick={() => handleOpenTransferModal()}
                  className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold text-center transition shadow-md shadow-red-600/20"
                >
                  🚑 Transfer Patient
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Inter-Hospital Transfers Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>📋 Recent Inter-Hospital Transfer Dispatches</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {transfers.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of patient transfers with automated receiving hospital and doctor notifications.
            </p>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-slate-800">
            No inter-hospital transfers dispatched yet. Click "Initiate Patient Transfer" when a patient requires specialized care.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Destination Hospital</th>
                  <th className="py-3 px-4">Required Treatment</th>
                  <th className="py-3 px-4">Transport Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Physician</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">{trf.transfer_id}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {trf.patient_name} <span className="text-[10px] text-slate-400 font-mono">({trf.patient_id})</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-amber-300">{trf.condition}</td>
                    <td className="py-3 px-4 font-sans text-white font-medium">{trf.target_hospital_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">{trf.required_treatment}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{trf.transport_mode}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {trf.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{trf.attending_physician}</td>
                    <td className="py-3 px-4 text-slate-400">{trf.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <InterHospitalTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        patient={selectedPatientForTransfer}
        clinicalCondition={selectedPatientForTransfer?.primaryDiagnosis || 'Critical Multi-Organ Risk'}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
};
