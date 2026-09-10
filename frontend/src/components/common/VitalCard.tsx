import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalCardProps {
  id?: string;
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  status: 'normal' | 'warning' | 'critical';
  normalRange: string;
  trend?: 'up' | 'down' | 'steady';
  trendText?: string;
  source?: 'ESP32 IoT Sensor' | 'Clinical Input' | 'Calculated Score';
  secondaryInfo?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  id,
  title,
  value,
  unit,
  icon: Icon,
  status,
  normalRange,
  trend,
  trendText,
  source = 'ESP32 IoT Sensor',
  secondaryInfo,
}) => {
  const statusStyles = {
    normal: {
      card: 'border-stone-200 bg-white text-[#2D312B]',
      iconBox: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      valueColor: 'text-[#2D312B]',
      badge: 'bg-stone-100 text-stone-600 border-stone-200',
    },
    warning: {
      card: 'border-amber-200 bg-white text-[#2D312B] border-l-4 border-l-amber-500',
      iconBox: 'bg-amber-50 text-amber-800 border border-amber-200',
      valueColor: 'text-amber-700',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    critical: {
      card: 'border-red-200 bg-white text-[#2D312B] border-l-4 border-l-[#D66853]',
      iconBox: 'bg-red-50 text-[#D66853] border border-red-200',
      valueColor: 'text-[#D66853]',
      badge: 'bg-red-50 text-[#D66853] border-red-200 font-bold',
    },
  };

  const current = statusStyles[status];

  return (
    <div
      id={id || `vital-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`rounded-xl border p-4 transition-all duration-200 shadow-xs ${current.card}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${current.iconBox}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              {title}
            </span>
            <div className="text-[10px] text-stone-400 font-mono-data">{source}</div>
          </div>
        </div>

        {status === 'critical' ? (
          <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider bg-red-50 border-red-200 text-[#D66853]">
            CRITICAL
          </span>
        ) : status === 'warning' ? (
          <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider bg-amber-50 border-amber-200 text-amber-800">
            MONITOR
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-medium tracking-wider bg-stone-100 border-stone-200 text-stone-600">
            NORMAL
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold tracking-tight font-mono-data ${current.valueColor}`}>
            {value}
          </span>
          <span className="text-xs font-medium text-stone-500">{unit}</span>
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-xs font-mono-data">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#D66853]" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-stone-500" />}
            {trend === 'steady' && <Minus className="w-3.5 h-3.5 text-stone-400" />}
            {trendText && <span className="text-stone-500 text-[11px]">{trendText}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="text-[10px] text-stone-400">Ref: {normalRange}</span>
        {secondaryInfo && (
          <span className="text-[10px] font-mono-data text-stone-500 truncate max-w-[140px]">
            {secondaryInfo}
          </span>
        )}
      </div>
    </div>
  );
};
