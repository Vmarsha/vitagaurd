import React, { useState, useEffect } from 'react';
import { Patient, NearbyHospital } from '../../types';
import { VitaGuardAPI } from '../../services/api';

interface InterHospitalTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  clinicalCondition?: string;
  onTransferSuccess?: (transferData: any) => void;
}

export const InterHospitalTransferModal: React.FC<InterHospitalTransferModalProps> = ({
  isOpen,
  onClose,
  patient,
  clinicalCondition = 'Critical Multi-Organ Risk',
  onTransferSuccess,
}) => {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [requiredTreatment, setRequiredTreatment] = useState<string>('');
  const [transportMode, setTransportMode] = useState<string>('Level-1 Critical Care Ambulance (ALS)');
  const [justificationNotes, setJustificationNotes] = useState<string>('');
  const [attendingPhysician, setAttendingPhysician] = useState<string>('Dr. Kavita Desai, MD');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transferResult, setTransferResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNearbyHospitals();
      setTransferResult(null);
      setJustificationNotes(
        `Patient requires specialized therapeutic intervention not available at current facility. Immediate transfer initiated under emergency clinical protocol.`
      );
    }
  }, [isOpen, clinicalCondition]);

  const loadNearbyHospitals = async () => {
    setIsLoading(true);
    try {
      const data = await VitaGuardAPI.getNearbyHospitals(clinicalCondition);
      setHospitals(data);
      if (data && data.length > 0) {
        setSelectedHospitalId(data[0].id);
        setRequiredTreatment(data[0].available_treatments?.[0] || data[0].primary_specialty);
      }
    } catch (err) {
      console.error('Failed to load nearby hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHospital = (hosp: NearbyHospital) => {
    setSelectedHospitalId(hosp.id);
    setRequiredTreatment(hosp.available_treatments?.[0] || hosp.primary_specialty);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !selectedHospitalId) return;

    setIsSubmitting(true);
    try {
      const res = await VitaGuardAPI.escalateHospitalTransfer({
        patient_id: patient.id,
        target_hospital_id: selectedHospitalId,
        required_treatment: requiredTreatment,
        justification_notes: justificationNotes,
        attending_physician: attendingPhysician,
        transport_mode: transportMode,
      });

      setTransferResult(res.transfer);
      if (onTransferSuccess) {
        onTransferSuccess(res.transfer);
      }
    } catch (err) {
      console.error('Transfer escalation error:', err);
      alert('Failed to dispatch transfer escalation. Check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !patient) return null;

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xl font-bold">
              🚑
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Inter-Hospital Emergency Transfer Protocol</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  CRITICAL ESCALATION
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                VitaGuard Autonomous Healthcare Network • Facility Escalation Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Patient Profile Bar */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Patient Details</span>
              <div className="text-base font-semibold text-white">
                {patient.name} <span className="text-xs font-normal text-slate-400">({patient.id} • {patient.gender}, {patient.age}y)</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Current Location</span>
              <div className="text-sm font-medium text-slate-200">
                {patient.ward} • Bed {patient.bed}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Diagnosed Condition</span>
              <div className="text-sm font-bold text-amber-400">
                {clinicalCondition}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Originating Hospital</span>
              <div className="text-sm font-medium text-emerald-400">
                KC General Hospital, Bengaluru (India)
              </div>
            </div>
          </div>

          {/* Success / Dispatched Confirmation Screen */}
          {transferResult ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 text-3xl mx-auto">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-300">
                  Transfer Dispatched & Receiving Hospital Alerted!
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
                  Official transfer order <span className="font-mono font-bold text-emerald-400">{transferResult.transfer_id}</span> has been broadcast to{' '}
                  <strong className="text-white">{transferResult.target_hospital_name}</strong>.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-4 max-w-lg mx-auto text-left text-xs space-y-1.5 font-mono text-slate-300">
                <div>• Originating Base: <span className="text-emerald-400">KC General Hospital (Bengaluru)</span></div>
                <div>• Receiving Unit: <span className="text-cyan-400">{transferResult.target_department}</span></div>
                <div>• Required Treatment: <span className="text-white">{transferResult.required_treatment}</span></div>
                <div>• Transport Mode: <span className="text-amber-400">{transferResult.transport_mode}</span></div>
                <div>• Emergency Hotline: <span className="text-blue-400">{transferResult.contact_phone}</span></div>
                <div>• Coordinator Email: <span className="text-purple-400">{transferResult.contact_email}</span></div>
                <div>• Email Notification: <span className="text-emerald-400 font-bold">SENT (Real-time inbox delivery)</span></div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital?.name || 'Bengaluru'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
                >
                  <span>🗺️ Open Live GPS Route</span>
                </a>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition flex items-center space-x-2 shadow-lg shadow-blue-600/30"
                >
                  <span>🖨️ Print Transfer Slip (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTransfer} className="space-y-6">
              
              {/* Facility Gap Warning */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3">
                <span className="text-amber-400 text-xl">⚠️</span>
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300 font-semibold">Specialized Facility Alert: </strong>
                  Current facility (<em>KC General Hospital, Bengaluru</em>) lacks dedicated specialized infrastructure for advanced <strong>{clinicalCondition}</strong> intervention. Recommended to initiate emergency inter-hospital escalation to an accredited regional partner facility.
                </div>
              </div>

              {/* Step 1: Select Partner Hospital */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  1. Select Matched Regional Partner Hospital ({hospitals.length} Available in Bengaluru Medical Network)
                </label>
                
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Scanning hospital network capabilities...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                    {hospitals.map((hosp) => {
                      const isSelected = hosp.id === selectedHospitalId;
                      const gMapsUrl = (hosp as any).maps_url || `https://www.google.com/maps/dir/?api=1&destination=${(hosp as any).latitude || 12.9716},${(hosp as any).longitude || 77.5946}`;
                      return (
                        <div
                          key={hosp.id}
                          onClick={() => handleSelectHospital(hosp)}
                          className={`cursor-pointer rounded-xl p-3.5 border transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                              : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-700/80 text-cyan-300">
                                {hosp.distance_km} km ({hosp.travel_time_mins}m)
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{hosp.primary_specialty}</p>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {hosp.available_treatments?.slice(0, 2).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/40"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                              <span>●</span>
                              <span>{hosp.available_icu_beds} of {hosp.total_icu_beds} ICU Beds Open</span>
                            </span>
                            <a
                              href={gMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] underline"
                            >
                              🗺️ Route
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Transport & Clinical Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    2. Required Specialized Treatment / Unit
                  </label>
                  <input
                    type="text"
                    value={requiredTreatment}
                    onChange={(e) => setRequiredTreatment(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Emergency Percutaneous Coronary Intervention"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    3. Transport Mode & Ambulance Priority
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Level-1 Critical Care Ambulance (ALS)">
                      Level-1 Critical Care Ambulance (ALS)
                    </option>
                    <option value="Code Red - Cardiac Mobile ICU">
                      Code Red - Cardiac Mobile ICU
                    </option>
                    <option value="Code Red - Ventilator & ECMO Transport">
                      Code Red - Ventilator & ECMO Transport
                    </option>
                    <option value="Code Yellow - Bio-Isolated Paramedic Unit">
                      Code Yellow - Bio-Isolated Paramedic Unit
                    </option>
                    <option value="Standard Paramedic Transit">
                      Standard Paramedic Transit
                    </option>
                  </select>
                </div>
              </div>

              {/* Step 3: Justification & Physician Sign-off */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    4. Transfer Justification & Bedside Notes
                  </label>
                  <textarea
                    value={justificationNotes}
                    onChange={(e) => setJustificationNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="State medical justification for transfer..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    5. Attending Physician
                  </label>
                  <input
                    type="text"
                    value={attendingPhysician}
                    onChange={(e) => setAttendingPhysician(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Logs official physician signature to audit trail.
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Target Destination: <strong className="text-white">{selectedHospital?.name || 'Select Hospital'}</strong>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedHospitalId}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/30 transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <span>Dispatching Transfer...</span>
                    ) : (
                      <>
                        <span>🚑 Dispatch Transfer & Alert Hospital</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
