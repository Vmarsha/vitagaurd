import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Code2,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { NavigationPage } from '../../types';

interface HeaderProps {
  currentPage?: NavigationPage;
  onNavigate?: (tab: NavigationPage) => void;
  activeAlertCount: number;
  onOpenAlerts?: () => void;
  onOpenAPIGuide: () => void;
  onToggleMobileSidebar?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  activePatientCount?: number;
  isCleanMode?: boolean;
  onToggleMode?: () => void;
  onOpenAdmitModal?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage = 'overview',
  onNavigate,
  activeAlertCount,
  onOpenAlerts,
  onOpenAPIGuide,
  onToggleMobileSidebar,
  searchQuery = '',
  onSearchChange,
  activePatientCount = 0,
  isCleanMode = true,
  onToggleMode,
  onOpenAdmitModal,
  onGoBack,
  canGoBack = false,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        now.toUTCString().replace('GMT', 'UTC')
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'overview':
        return 'Clinical Dashboard Overview';
      case 'live-monitoring':
        return 'Live Sensor Monitoring';
      case 'patients':
        return 'Patient Registry & Triage';
      case 'vitals-entry':
        return 'Patient & Vitals Entry Station';
      case 'ai-analysis':
        return 'AI Random Forest Prediction';
      case 'deterioration':
        return 'Deterioration Trend & Multi-Vital Analysis';
      case 'explainable-risk':
        return 'Explainable Risk Attribution';
      case 'clinical-alerts':
        return 'Critical Clinical Alerts';
      case 'hospital-transfers':
        return 'Inter-Hospital Emergency Escalation';
      case 'alert-history':
        return 'Alert History & Audit Trail';
      case 'doctors':
        return 'Attending Physicians Directory';
      default:
        return 'Clinical Dashboard Overview';
    }
  };

  const handleAlertClick = () => {
    if (onOpenAlerts) onOpenAlerts();
    else if (onNavigate) onNavigate('clinical-alerts');
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-10">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-lg text-stone-600 hover:text-[#2D312B] hover:bg-stone-100 md:hidden"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Back Button (Icon Only) */}
        {canGoBack && onGoBack && (
          <button
            id="header-back-btn"
            onClick={onGoBack}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-xs group"
            title="Go back to previous page"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        <div>
          <h2 className="font-serif italic text-lg sm:text-xl text-[#5B6356] font-normal tracking-tight">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-sans">
            <span className="font-mono-data text-stone-400">VITAGUARD / CLINICAL-CORE</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ESP32 Mesh Active (24/24 Nodes)
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Global Patient Search if handler provided */}
        {onSearchChange && (
          <div className="relative hidden md:block w-56">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-patient-search-input"
              type="text"
              placeholder="Search patient, MRN..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D312B] placeholder-stone-400 focus:outline-none focus:border-[#6B705C] focus:ring-1 focus:ring-[#6B705C]"
            />
          </div>
        )}

        {/* Live Monitoring count summary */}
        <div className="hidden sm:block text-right">
          <p className="text-xs font-semibold text-stone-500">Active Monitoring</p>
          <p className="text-sm font-bold text-[#2D312B] font-serif">{activePatientCount} Patients</p>
        </div>

        {/* Mode Toggle Switch (Clean Hardware vs Demo Ward) */}
        {onToggleMode && (
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border shadow-xs ${
              isCleanMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
            title="Click to toggle between Clean Hardware Mode (0 mock) and Demo Ward Mode"
          >
            <span className={`w-2 h-2 rounded-full ${isCleanMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isCleanMode ? 'Clean Hardware Mode (0 Mock)' : 'Demo Ward Mode'}</span>
          </button>
        )}

        {/* Admit Patient Quick Action Button */}
        {onOpenAdmitModal && (
          <button
            onClick={onOpenAdmitModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
            title="Admit a new patient to ward"
          >
            <span>➕ Admit Patient</span>
          </button>
        )}

        {/* API Architecture Guide Button */}
        <button
          id="header-api-docs-btn"
          onClick={onOpenAPIGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs text-[#2D312B] font-medium transition-colors"
          title="View FastAPI endpoints & Architecture"
        >
          <Code2 className="w-3.5 h-3.5 text-[#6B705C]" />
          <span className="hidden sm:inline">FastAPI Docs</span>
        </button>

        {/* Alerts Bell Button */}
        <button
          id="header-alerts-btn"
          onClick={handleAlertClick}
          className={`relative p-2 rounded-lg border transition-all ${
            activeAlertCount > 0
              ? 'bg-[#D66853] border-[#D66853] text-white hover:bg-[#c25844] shadow-xs'
              : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
          }`}
          title="View Clinical Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#D66853] font-mono-data shadow-xs">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* Attending Physician Avatar */}
        <div
          title="Dr. Rachel Evans, MD - Attending Physician"
          className="w-10 h-10 bg-[#E6E8E1] rounded-full flex items-center justify-center text-[#5B6356] font-bold text-xs border border-stone-200 flex-shrink-0 cursor-pointer hover:bg-stone-200 transition-colors"
        >
          DR
        </div>
      </div>
    </header>
  );
};
