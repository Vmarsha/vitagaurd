import React from 'react';
import {
  Wifi,
  WifiOff,
  Radio,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';
import { WsConnectionStatus } from '../../types';

interface DeviceConnectionIndicatorProps {
  status: WsConnectionStatus;
  statusMessage?: string;
  isEmulated?: boolean;
  latencyMs?: number;
  onReconnect?: () => void;
  onOpenSettings?: () => void;
  id?: string;
}

export const DeviceConnectionIndicator: React.FC<DeviceConnectionIndicatorProps> = ({
  status,
  statusMessage,
  isEmulated = false,
  latencyMs = 24,
  onReconnect,
  onOpenSettings,
  id = 'device-connection-indicator',
}) => {
  const renderIndicatorContent = () => {
    switch (status) {
      case 'CONNECTED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono-data font-bold tracking-wider uppercase text-emerald-800">
                Connected
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] font-mono-data text-emerald-700">
                {isEmulated ? 'Mock / Live Sync' : 'WebSocket WS'}
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] font-mono-data text-emerald-700 font-semibold">
                {latencyMs}ms
              </span>
            </div>
          </div>
        );

      case 'CONNECTING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono-data font-bold tracking-wider uppercase text-amber-800">
                Connecting
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] font-mono-data text-amber-700 truncate max-w-[140px]" title={statusMessage}>
                FastAPI WS Handshake
              </span>
            </div>
          </div>
        );

      case 'NO_RECENT_DATA':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono-data font-bold tracking-wider uppercase text-amber-900">
                No Recent Data
              </span>
              <span className="text-amber-400">|</span>
              <span className="text-[11px] text-amber-800">
                Sensor stalled &gt;8s
              </span>
            </div>
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="ml-1 p-1 hover:bg-amber-200/60 rounded text-amber-900 transition-colors"
                title="Restart stream"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'ERROR':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-300 text-red-900 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D66853]" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono-data font-bold tracking-wider uppercase text-[#D66853]">
                Error
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] text-[#D66853] truncate max-w-[130px]" title={statusMessage}>
                {statusMessage || 'WS Connection Error'}
              </span>
            </div>
            {onReconnect && (
              <button
                id="ws-retry-button"
                onClick={onReconnect}
                className="ml-1 px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-xs font-mono-data font-bold text-[#D66853] transition-colors flex items-center gap-1"
                title="Attempt Reconnection"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        );

      case 'DISCONNECTED':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 shadow-2xs">
            <WifiOff className="w-3.5 h-3.5 text-stone-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono-data font-bold tracking-wider uppercase text-stone-700">
                Disconnected
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] text-stone-500 truncate max-w-[120px]" title={statusMessage}>
                Standby
              </span>
            </div>
            {onReconnect && (
              <button
                id="ws-reconnect-button"
                onClick={onReconnect}
                className="ml-1 px-2 py-0.5 rounded bg-stone-200 hover:bg-stone-300 text-xs font-mono-data font-bold text-stone-800 transition-colors flex items-center gap-1"
                title="Attempt Reconnection"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Connect</span>
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div id={id} className="flex items-center gap-2">
      {renderIndicatorContent()}
      {onOpenSettings && (
        <button
          id="ws-settings-toggle-btn"
          onClick={onOpenSettings}
          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-[#2D312B] transition-colors"
          title="Configure WebSocket Stream & View FastAPI Code"
        >
          <Server className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
