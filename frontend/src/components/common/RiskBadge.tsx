import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  id?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showPulse = false,
  id,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider',
    lg: 'text-sm px-3 py-1 font-bold uppercase tracking-wider',
  };

  const config = {
    STABLE: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-600',
      label: 'STABLE',
      pulseColor: 'bg-emerald-500',
    },
    MONITORING: {
      bg: 'bg-stone-100 border-stone-300 text-stone-700',
      dot: 'bg-stone-500',
      label: 'MONITORING',
      pulseColor: 'bg-stone-400',
    },
    HIGH_RISK: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-600',
      label: 'HIGH RISK',
      pulseColor: 'bg-amber-500',
    },
    CRITICAL: {
      bg: 'bg-red-50 border-red-200 text-[#D66853]',
      dot: 'bg-[#D66853]',
      label: 'CRITICAL',
      pulseColor: 'bg-[#D66853]',
    },
  };

  const current = config[level] || config.STABLE;

  return (
    <span
      id={id || `risk-badge-${level.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-md border whitespace-nowrap tracking-wide font-medium ${sizeClasses[size]} ${current.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {(showPulse || level === 'CRITICAL') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.pulseColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      {current.label}
    </span>
  );
};
