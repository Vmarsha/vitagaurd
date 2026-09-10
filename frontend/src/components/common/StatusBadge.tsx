import React from 'react';
import { ClinicalStatus, AlertAckStatus, AlertEmailStatus, MotionStatus, DeviceConnectionStatus } from '../../types';

interface StatusBadgeProps {
  status: ClinicalStatus | AlertAckStatus | AlertEmailStatus | MotionStatus | DeviceConnectionStatus | string;
  type?: 'clinical' | 'alert' | 'email' | 'motion' | 'device';
  size?: 'sm' | 'md';
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'clinical',
  size = 'md',
  id,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider',
  };

  const getStyle = (): { bg: string; text: string; border: string; label: string } => {
    const s = String(status).toUpperCase();

    // Device statuses
    if (type === 'device' || s === 'ONLINE' || s === 'STANDBY' || s === 'DISCONNECTED') {
      if (s === 'ONLINE') return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'ESP32 ONLINE' };
      if (s === 'STANDBY') return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'STANDBY' };
      if (s === 'DISCONNECTED') return { bg: 'bg-red-100', text: 'text-[#D66853]', border: 'border-red-200', label: 'DISCONNECTED' };
      if (s === 'BATTERY_LOW') return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', label: 'LOW BATTERY' };
    }

    // Motion statuses
    if (type === 'motion' || s === 'RESTING' || s === 'BED_REST' || s === 'ACTIVE' || s === 'AGITATED' || s === 'FALL_EVENT') {
      if (s === 'RESTING') return { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', label: 'RESTING' };
      if (s === 'BED_REST') return { bg: 'bg-stone-100', text: 'text-[#5B6356]', border: 'border-stone-200', label: 'BED REST' };
      if (s === 'ACTIVE') return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'AMBULATING' };
      if (s === 'AGITATED') return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'AGITATED' };
      if (s === 'FALL_EVENT') return { bg: 'bg-red-100', text: 'text-[#D66853]', border: 'border-red-300', label: 'FALL DETECTED' };
    }

    // Alert Ack / Email Statuses
    if (s === 'PENDING') return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'PENDING' };
    if (s === 'SENT') return { bg: 'bg-stone-200', text: 'text-[#2D312B]', border: 'border-stone-300', label: 'SENT' };
    if (s === 'COOLDOWN') return { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', label: 'COOLDOWN' };
    if (s === 'ACKNOWLEDGED') return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'ACKNOWLEDGED' };

    // Clinical Status
    if (s === 'STABLE') return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'STABLE' };
    if (s === 'MONITORING') return { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', label: 'MONITORING' };
    if (s === 'DETERIORATING') return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'DETERIORATING' };
    if (s === 'CRITICAL') return { bg: 'bg-red-100', text: 'text-[#D66853]', border: 'border-red-200', label: 'CRITICAL' };

    return { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', label: s };
  };

  const style = getStyle();

  return (
    <span
      id={id}
      className={`inline-flex items-center rounded-md border whitespace-nowrap tracking-wider font-mono-data font-semibold ${sizeClasses[size]} ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
};
