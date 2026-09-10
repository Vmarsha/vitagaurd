import React, { useState, useEffect } from 'react';
import { NavigationPage, ClinicalAlert, Patient, LiveSensorData, ClinicalInputData } from './types';
import { VitaGuardAPI, vitaGuardStore } from './services/api';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ClinicalAlertBanner } from './components/common/ClinicalAlertBanner';

// Modals
import { AcknowledgeModal } from './components/modals/AcknowledgeModal';
import { APIGuideModal } from './components/modals/APIGuideModal';
import { AdmitPatientModal } from './components/modals/AdmitPatientModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { PatientsPage } from './pages/PatientsPage';
import { VitalsEntryPage } from './pages/VitalsEntryPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { DeteriorationPage } from './pages/DeteriorationPage';
import { ExplainableRiskPage } from './pages/ExplainableRiskPage';
import { ClinicalAlertsPage } from './pages/ClinicalAlertsPage';
import { HospitalTransfersPage } from './pages/HospitalTransfersPage';
import { AlertHistoryPage } from './pages/AlertHistoryPage';
import { DoctorsPage } from './pages/DoctorsPage';

export default function App() {
  // Navigation State & History Stack
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [pageHistory, setPageHistory] = useState<NavigationPage[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-101');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals State
  const [activeAcknowledgeAlert, setActiveAcknowledgeAlert] = useState<ClinicalAlert | null>(null);
  const [isAPIGuideOpen, setIsAPIGuideOpen] = useState<boolean>(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState<boolean>(false);

  // Application Data State (Subscribed to store)
  const [storeState, setStoreState] = useState(() => vitaGuardStore.getState());

  useEffect(() => {
    // Subscribe to state store changes
    const unsubscribe = vitaGuardStore.subscribe(() => {
      setStoreState({ ...vitaGuardStore.getState() });
    });
    return unsubscribe;
  }, []);

  const {
    patients,
    liveSensors,
    clinicalInputs,
    aiAnalysis,
    deterioration,
    explainableRisk,
    alerts,
    doctors,
    metrics,
  } = storeState;

  // Unacknowledged critical alert for global emergency top banner
  const criticalUnackedAlert = alerts.find(
    (a) => a.riskLevel === 'CRITICAL' && a.ackStatus !== 'ACKNOWLEDGED'
  );

  // Handlers
  const handleAcknowledgeSubmit = async (alertId: string, doctorName: string, note: string) => {
    await VitaGuardAPI.acknowledgeAlert(alertId, doctorName, note);
  };

  const handleUpdateSensor = async (patientId: string, data: Partial<LiveSensorData>) => {
    await VitaGuardAPI.updateLiveSensor(patientId, data);
  };

  const handleSubmitClinicalEntry = async (entry: ClinicalInputData) => {
    await VitaGuardAPI.submitClinicalVitals(entry);
  };

  const handleOpenAcknowledge = (alert: ClinicalAlert) => {
    setActiveAcknowledgeAlert(alert);
  };

  const handleCloseAcknowledge = () => {
    setActiveAcknowledgeAlert(null);
  };

  const handleAdmitPatient = async (newPatient: Patient, pairedDeviceId?: string) => {
    await VitaGuardAPI.admitPatient(newPatient);
    setSelectedPatientId(newPatient.id);
    setIsAdmitModalOpen(false);
  };

  // Close mobile sidebar upon page change and track navigation history
  const handlePageChange = (page: NavigationPage) => {
    if (page !== currentPage) {
      setPageHistory((prev) => [...prev, currentPage]);
      setCurrentPage(page);
    }
    setIsMobileSidebarOpen(false);
  };

  // Go back to the previous page in navigation history
  const handleGoBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((prevHistory) => prevHistory.slice(0, -1));
      setCurrentPage(prev);
    } else {
      setCurrentPage('overview');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9F5] text-[#2D312B] font-sans select-none">
      {/* 1. Left Clinical Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handlePageChange}
        activeAlertCount={metrics.activeAlerts}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAPIGuide={() => setIsAPIGuideOpen(true)}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8F9F5]">
        {/* Top Header with Dynamic Back Navigation */}
        <Header
          currentPage={currentPage}
          onNavigate={handlePageChange}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          activeAlertCount={metrics.activeAlerts}
          onOpenAlerts={() => handlePageChange('clinical-alerts')}
          onOpenAPIGuide={() => setIsAPIGuideOpen(true)}
          activePatientCount={patients.length}
          isCleanMode={storeState.isCleanMode}
          onToggleMode={() => vitaGuardStore.toggleMode()}
          onOpenAdmitModal={() => setIsAdmitModalOpen(true)}
          canGoBack={currentPage !== 'overview' || pageHistory.length > 0}
          onGoBack={handleGoBack}
        />

        {/* Global Critical Alert Banner if any ICU-tier alert is unacknowledged */}
        {criticalUnackedAlert && (
          <ClinicalAlertBanner
            criticalAlerts={[criticalUnackedAlert]}
            onQuickAck={(alert) => handleOpenAcknowledge(alert)}
            onViewAlerts={() => {
              setSelectedPatientId(criticalUnackedAlert.patientId);
              handlePageChange('clinical-alerts');
            }}
          />
        )}

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9F5]">
          <div className="max-w-7xl mx-auto">
            {/* Page 1: OVERVIEW */}
            {currentPage === 'overview' && (
              <OverviewPage
                metrics={metrics}
                patients={patients}
                alerts={alerts}
                deteriorationMap={deterioration}
                onNavigate={handlePageChange}
                onSelectPatient={setSelectedPatientId}
                onOpenAcknowledge={handleOpenAcknowledge}
              />
            )}

            {/* Page 2: LIVE MONITORING */}
            {currentPage === 'live-monitoring' && (
              <LiveMonitoringPage
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                liveSensors={liveSensors}
                clinicalInputs={clinicalInputs}
                onNavigate={handlePageChange}
                onOpenAdmitModal={() => setIsAdmitModalOpen(true)}
                onUpdateSensor={handleUpdateSensor}
              />
            )}

            {/* Page 3: PATIENTS */}
            {currentPage === 'patients' && (
              <PatientsPage
                patients={patients}
                doctors={doctors}
                onSelectPatient={setSelectedPatientId}
                onNavigate={handlePageChange}
                onAdmitPatient={handleAdmitPatient}
              />
            )}

            {/* Page 4: PATIENT AND VITALS ENTRY */}
            {currentPage === 'vitals-entry' && (
              <VitalsEntryPage
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                liveSensors={liveSensors}
                clinicalInputs={clinicalInputs}
                onSubmitEntry={handleSubmitClinicalEntry}
                onUpdateLiveSensor={handleUpdateSensor}
                onNavigate={handlePageChange}
              />
            )}

            {/* Page 5: AI ANALYSIS */}
            {currentPage === 'ai-analysis' && (
              <AIAnalysisPage
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                aiAnalysisMap={aiAnalysis}
                onNavigate={handlePageChange}
              />
            )}

            {/* Page 6: DETERIORATION ANALYSIS */}
            {currentPage === 'deterioration' && (
              <DeteriorationPage
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                deteriorationMap={deterioration}
                onNavigate={handlePageChange}
              />
            )}

            {/* Page 7: EXPLAINABLE RISK */}
            {currentPage === 'explainable-risk' && (
              <ExplainableRiskPage
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                explainableRiskMap={explainableRisk}
                onNavigate={handlePageChange}
              />
            )}

            {/* Page 8: CLINICAL ALERTS */}
            {currentPage === 'clinical-alerts' && (
              <ClinicalAlertsPage
                alerts={alerts}
                patients={patients}
                doctors={doctors}
                onOpenAcknowledge={handleOpenAcknowledge}
                onNavigate={handlePageChange}
                onSelectPatient={setSelectedPatientId}
              />
            )}

            {/* Page 9: HOSPITAL TRANSFERS & ESCALATION NETWORK */}
            {currentPage === 'hospital-transfers' && (
              <HospitalTransfersPage patients={patients} />
            )}

            {/* Page 10: ALERT HISTORY */}
            {currentPage === 'alert-history' && (
              <AlertHistoryPage alerts={alerts} />
            )}

            {/* Page 10: DOCTORS */}
            {currentPage === 'doctors' && (
              <DoctorsPage
                doctors={doctors}
                patients={patients}
                onSelectPatient={setSelectedPatientId}
                onNavigate={handlePageChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Admit Patient Modal */}
      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onAdmit={handleAdmitPatient}
        doctors={doctors}
      />

      {/* Doctor Acknowledgement Modal */}
      <AcknowledgeModal
        alert={activeAcknowledgeAlert}
        doctors={doctors}
        onClose={handleCloseAcknowledge}
        onConfirm={handleAcknowledgeSubmit}
      />

      {/* FastAPI Architecture & Integration Guide Modal */}
      <APIGuideModal
        isOpen={isAPIGuideOpen}
        onClose={() => setIsAPIGuideOpen(false)}
      />
    </div>
  );
}

