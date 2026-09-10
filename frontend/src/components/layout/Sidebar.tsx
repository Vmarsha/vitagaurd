import React from 'react';
import {
  Activity,
  Radio,
  Users,
  FilePlus2,
  Brain,
  TrendingDown,
  FileText,
  AlertTriangle,
  History,
  UserCheck,
  ShieldPlus,
  Code2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavigationPage } from '../../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  activeAlertCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenAPIGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertCount,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onOpenAPIGuide,
}) => {
  const navItems = [
    {
      id: 'overview' as NavigationPage,
      label: 'Overview',
      icon: Activity,
      badge: null,
    },
    {
      id: 'live-monitoring' as NavigationPage,
      label: 'Live Monitoring',
      icon: Radio,
      badge: (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ),
    },
    {
      id: 'patients' as NavigationPage,
      label: 'Patients',
      icon: Users,
      badge: null,
    },
    {
      id: 'vitals-entry' as NavigationPage,
      label: 'Patient & Vitals Entry',
      icon: FilePlus2,
      badge: null,
    },
    {
      id: 'ai-analysis' as NavigationPage,
      label: 'AI Analysis',
      icon: Brain,
      badge: (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3a3f37] border border-[#6B705C] text-stone-300 font-mono-data">
          ML
        </span>
      ),
    },
    {
      id: 'deterioration' as NavigationPage,
      label: 'Deterioration',
      icon: TrendingDown,
      badge: null,
    },
    {
      id: 'explainable-risk' as NavigationPage,
      label: 'Explainable Risk',
      icon: FileText,
      badge: null,
    },
    {
      id: 'clinical-alerts' as NavigationPage,
      label: 'Clinical Alerts',
      icon: AlertTriangle,
      badge:
        activeAlertCount > 0 ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono-data font-bold bg-[#D66853] text-white">
            {activeAlertCount}
          </span>
        ) : null,
    },
    {
      id: 'hospital-transfers' as NavigationPage,
      label: 'Hospital Transfers',
      icon: ShieldPlus,
      badge: (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-mono-data">
          ER
        </span>
      ),
    },
    {
      id: 'alert-history' as NavigationPage,
      label: 'Alert History',
      icon: History,
      badge: null,
    },
    {
      id: 'doctors' as NavigationPage,
      label: 'Doctors',
      icon: UserCheck,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="vitaguard-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#2D312B] text-stone-300 flex flex-col h-full transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#3a3f37]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6B705C] rounded-lg flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-lg tracking-tight text-white">VitaGuard</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3a3f37] border border-[#6B705C]/50 text-stone-300 font-mono-data">
                    v1.0
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 leading-tight">Clinical AI & IoT Telemetry</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-stone-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Hospital Ward Context */}
        {!isCollapsed && (
          <div className="px-5 py-2.5 bg-[#252823] border-b border-[#3a3f37] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-stone-300 font-medium truncate">St. Jude Medical Center</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono-data">ICU/Ward</span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Clinical Operations
            </div>
          )}
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#6B705C] text-white shadow-xs'
                    : 'text-stone-400 hover:text-white hover:bg-[#3a3f37]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  {!isCollapsed && <span className={isActive ? 'italic' : ''}>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && <div className="ml-2 flex-shrink-0">{item.badge}</div>}
              </button>
            );
          })}
        </nav>

        {/* System Status Footer */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-[#3a3f37] bg-[#2D312B]">
            <div className="bg-[#3a3f37] p-3 rounded-lg border border-stone-700/50">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1.5 font-bold">
                System Status
              </p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs text-white font-medium">FastAPI: Connected</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs text-white font-medium">ML Engine: Online</span>
              </div>
              {onOpenAPIGuide && (
                <button
                  id="open-api-guide-sidebar-btn"
                  onClick={onOpenAPIGuide}
                  className="w-full text-[10px] py-1 px-2 rounded bg-[#2D312B] hover:bg-[#252823] text-stone-300 font-medium border border-stone-600/50 flex items-center justify-center gap-1 transition-colors mt-1"
                >
                  <Code2 className="w-3 h-3 text-[#6B705C]" />
                  <span>API Integration Guide</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#3a3f37] text-center">
            <button
              onClick={onOpenAPIGuide}
              title="FastAPI Integration Guide"
              className="p-2 rounded-lg bg-[#3a3f37] hover:bg-[#4a5046] text-stone-300 transition-colors"
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapse Desktop Toggle */}
        {onToggleCollapse && (
          <div className="hidden md:flex p-2 border-t border-[#3a3f37] justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#3a3f37] transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
