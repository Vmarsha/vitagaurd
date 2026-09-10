import React, { useState } from 'react';
import { X, UserPlus, Shield, Sparkles } from 'lucide-react';
import { Patient, Doctor } from '../../types';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdmit: (patient: Patient, pairedDeviceId?: string) => void;
  doctors: Doctor[];
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  isOpen,
  onClose,
  onAdmit,
  doctors,
}) => {
  const [name, setName] = useState('');
  const [patientId, setPatientId] = useState(() => `PT-${Math.floor(100 + Math.random() * 900)}`);
  const [age, setAge] = useState<number>(55);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [ward, setWard] = useState('Step-Down Ward A');
  const [bed, setBed] = useState('Bed 03');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('Post-Op Observation / Vital Lability');
  const [assignedDoctor, setAssignedDoctor] = useState(doctors[0]?.name || 'Dr. Kavita Desai');
  const [pairedDeviceId, setPairedDeviceId] = useState('ESP32-001');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPatient: Patient = {
      id: patientId,
      name: name.trim(),
      age: Number(age) || 50,
      gender,
      mrn: patientId,
      ward,
      bed,
      currentRisk: 'STABLE',
      currentStatus: 'STABLE',
      assignedDoctor,
      doctorId: assignedDoctor,
      department: 'General Medicine',
      admissionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      primaryDiagnosis,
      lastUpdated: 'Just admitted',
    };

    onAdmit(newPatient, pairedDeviceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="admit-patient-modal"
        className="w-full max-w-xl bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-[#2D312B]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2D312B] text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-semibold text-lg text-[#2D312B]">
                Admit & Register New Patient
              </h3>
              <p className="text-xs text-stone-500 font-mono-data">Continuous Autonomous Monitoring Registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D312B] hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Name & ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Full Patient Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Patient ID / MRN *
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. PT-106"
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] font-mono-data focus:outline-none focus:border-[#6B705C]"
              />
            </div>
          </div>

          {/* Row 2: Age, Gender & Ward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Age (Years) *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Ward / Unit
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
              >
                <option value="General Ward A">General Ward A</option>
                <option value="Step-Down Ward B">Step-Down Ward B</option>
                <option value="Emergency Triage Unit">Emergency Triage Unit</option>
                <option value="Cardiology Intermediate">Cardiology Intermediate</option>
                <option value="ICU / High Dependency">ICU / High Dependency</option>
              </select>
            </div>
          </div>

          {/* Row 3: Bed & Paired IoT Hardware Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Bed / Room Number
              </label>
              <input
                type="text"
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                placeholder="e.g. Bed 04"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                <span>Paired IoT Wearable</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </label>
              <select
                value={pairedDeviceId}
                onChange={(e) => setPairedDeviceId(e.target.value)}
                className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-xs text-[#2D312B] font-mono-data focus:outline-none focus:border-emerald-500"
              >
                <option value="ESP32-001">ESP32-001 (Bedside Unit A)</option>
                <option value="ESP32-002">ESP32-002 (Bedside Unit B)</option>
                <option value="ESP32-003">ESP32-003 (Wearable Clip)</option>
                <option value="Unassigned">Unassigned (Manual Only)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Primary Diagnosis */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Admission Reason / Primary Complaint
            </label>
            <input
              type="text"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              placeholder="e.g. Mild shortness of breath, fever, post-op recovery"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
            />
          </div>

          {/* Row 5: Attending Doctor */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Assigned Attending Doctor
            </label>
            <select
              value={assignedDoctor}
              onChange={(e) => setAssignedDoctor(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C]"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name} — {doc.department} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Admit & Start AI Monitoring</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
