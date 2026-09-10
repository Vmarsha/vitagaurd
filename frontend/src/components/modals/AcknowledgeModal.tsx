import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';
import { ClinicalAlert, Doctor } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface AcknowledgeModalProps {
  alert: ClinicalAlert | null;
  doctors?: Doctor[];
  onClose: () => void;
  onConfirm: (alertId: string, doctorName: string, notes: string) => void;
}

export const AcknowledgeModal: React.FC<AcknowledgeModalProps> = ({
  alert,
  doctors = [],
  onClose,
  onConfirm,
}) => {
  if (!alert) return null;

  const [selectedDoctor, setSelectedDoctor] = useState<string>(
    alert.assignedDoctor || doctors?.[0]?.name || 'Dr. Kavita Desai'
  );
  const [notes, setNotes] = useState<string>(
    'Bedside evaluation completed. Escalation acknowledged and treatment order verified.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (alert) {
      setSelectedDoctor(alert.assignedDoctor || doctors?.[0]?.name || 'Dr. Kavita Desai');
    }
  }, [alert, doctors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm(alert.id, selectedDoctor, notes);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="doctor-acknowledge-modal"
        className="w-full max-w-lg bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-[#2D312B]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#6B705C]/15 text-[#6B705C] border border-[#6B705C]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-semibold text-lg text-[#2D312B]">
                Clinical Escalation Acknowledgement
              </h3>
              <p className="text-xs text-stone-500 font-mono-data">Alert ID: {alert.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D312B] hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient summary tile */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-mono-data uppercase tracking-wider">PATIENT</span>
                <h4 className="font-bold text-sm text-[#2D312B]">
                  {alert.patientName} ({alert.patientId})
                </h4>
              </div>
              <RiskBadge level={alert.riskLevel} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-200">
              <div>
                <span className="text-stone-500">Location:</span>{' '}
                <span className="text-[#2D312B] font-medium">
                  {alert.ward} • {alert.bed}
                </span>
              </div>
              <div>
                <span className="text-stone-500">Deterioration:</span>{' '}
                <span className="text-[#D66853] font-bold font-mono-data">
                  {alert.deteriorationScore} / 100
                </span>
              </div>
            </div>

            <div className="text-xs pt-1">
              <span className="text-stone-500">Trigger:</span>{' '}
              <span className="text-[#2D312B]">{alert.alertReason}</span>
            </div>
          </div>

          {/* Doctor selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Acknowledging Attending / Resident Physician
            </label>
            <select
              id="ack-doctor-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] focus:outline-none focus:border-[#6B705C] font-medium"
            >
              {(doctors && doctors.length > 0) ? (
                doctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} — {doc.department} ({doc.specialization})
                  </option>
                ))
              ) : (
                <option value={selectedDoctor || 'Dr. Kavita Desai'}>
                  {selectedDoctor || 'Dr. Kavita Desai (Attending Physician)'}
                </option>
              )}
            </select>
          </div>

          {/* Action Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Clinical Action & Bedside Response Notes
            </label>
            <textarea
              id="ack-clinical-note-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter bedside intervention, orders placed, or escalation steps..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C]"
              required
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-ack-submit-btn"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#2D312B] hover:bg-[#3a3f37] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Confirming...' : 'Sign & Acknowledge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
