
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PasswordModal } from './components/PasswordModal';
import { AetherChatbot } from './components/AetherChatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { InvoiceWorkbench } from './pages/InvoiceWorkbench';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { RateCards } from './pages/RateCards';
import { PartnerNetwork } from './pages/PartnerNetwork';
import { SettlementFinance } from './pages/SettlementFinance';
import { IntelligenceHub } from './pages/IntelligenceHub';
import { IntegrationHub } from './pages/IntegrationHub';
import { InvoiceIngestion } from './pages/InvoiceIngestion';
import { LandingPage } from './pages/LandingPage';
import { VendorPortal } from './pages/VendorPortal';
import { VendorLogin } from './pages/VendorLogin';
import { UserProfile } from './pages/UserProfile';
import { RBACSettings } from './pages/RBACSettings';
import { CostToServe } from './pages/CostToServe';
import { CarrierPerformance } from './pages/CarrierPerformance';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { ContractManager } from './pages/ContractManager';
import { SpotMarket } from './pages/SpotMarket';
import { GuestBid } from './pages/GuestBid';
import { VendorOnboarding } from './pages/VendorOnboarding';
import { DocumentAnalysis } from './pages/DocumentAnalysis';
import { VendorScorecard } from './pages/VendorScorecard';
import { Invoice, UserRole, InvoiceStatus, RoleDefinition, WorkflowStepConfig, Dispute, Notification, MatchStatus } from './types';
import { ParsedEdi } from './utils/ediParser';
import { MOCK_INVOICES, INITIAL_ROLES, INITIAL_WORKFLOW } from './constants';
import { StorageService } from './services/storageService';
import { Bell, LogOut, ChevronDown, UserCircle, Users, Shield, Briefcase, Command, Check, RefreshCw, Lock, Inbox } from 'lucide-react';

// Persona Definition for Demo Switching
const DEMO_PERSONAS = [
  { id: 'atlas', name: 'Atlas', role: 'Enterprise Director', roleId: 'ENTERPRISE_ADMIN', userRole: '3SC' as UserRole, avatar: 'https://i.pravatar.cc/150?u=atlas' },
  { id: 'lan', name: 'Kaai Bansal', role: 'Logistics Ops', roleId: 'OPS_MANAGER', userRole: '3SC' as UserRole, avatar: 'https://i.pravatar.cc/150?u=lan' },
  { id: 'william', name: 'Zeya Kapoor', role: 'Finance Manager', roleId: 'FINANCE_MANAGER', userRole: '3SC' as UserRole, avatar: 'https://i.pravatar.cc/150?u=william' },
  { id: 'admin', name: 'System Admin', role: 'Super User', initials: 'AD', roleId: 'ENTERPRISE_ADMIN', userRole: '3SC' as UserRole, color: 'purple' }
];

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showVendorGate, setShowVendorGate] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('3SC');

  // Persona State (for RBAC Simulation)
  const [activePersona, setActivePersona] = useState(DEMO_PERSONAS[0]);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<typeof DEMO_PERSONAS[0] | null>(null);

  // Transition State
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', type: 'INFO', message: 'System maintenance scheduled for Sunday.', timestamp: '2h ago', read: false },
    { id: 'n2', type: 'ASSIGNMENT', message: 'New invoice #INV-2025-009 assigned to you.', timestamp: '5m ago', read: false, actionLink: 'INV-2025-009' }
  ]);

  const [activeTab, setActiveTab] = useState('cockpit');

  // --- LIFTED STATE: INVOICES & CONFIG ---
  // Initialize from StorageService
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    StorageService.load('invoices_v2', MOCK_INVOICES)
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // RBAC & Workflow State (Lifted for persistence)
  const [roles, setRoles] = useState<RoleDefinition[]>(() =>
    StorageService.load('roles_v2', INITIAL_ROLES)
  );

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowStepConfig[]>(() =>
    StorageService.load('workflow_v3', INITIAL_WORKFLOW) // Bumped version to force reset
  );

  // Persistence Effects
  React.useEffect(() => {
    StorageService.save('invoices_v2', invoices);
  }, [invoices]);

  React.useEffect(() => {
    StorageService.save('roles_v2', roles);
  }, [roles]);

  React.useEffect(() => {
    StorageService.save('workflow_v3', workflowConfig);
  }, [workflowConfig]);

  // Handle Guest Link
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guest_bid') {
      setActiveTab('guest_bid');
    } else if (params.get('mode') === 'onboarding') {
      setActiveTab('onboarding');
    }
  }, []);

  // Handler for invoice updates from Workbench
  const handleInvoiceUpdate = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleInvoiceAdd = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
  };

  // --- HANDLERS ---
  const handleLogin = (role: UserRole) => {
    if (role === 'VENDOR') {
      setShowVendorGate(true);
    } else {
      setUserRole(role);
      setIsLoggedIn(true);
      if (role === 'HITACHI') setActiveTab('intelligence');
      else setActiveTab('cockpit');
    }
  };

  const handleVendorGateSuccess = () => {
    setUserRole('VENDOR');
    setIsLoggedIn(true);
    setShowVendorGate(false);
    setActiveTab('vendor_portal');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowVendorGate(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleBackToWorkbench = () => {
    setSelectedInvoice(null);
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    setSelectedInvoice(updatedInvoice);
  };

  const handleUpdateDispute = (invoiceId: string, action: 'SUBMIT_JUSTIFICATION' | 'REUPLOAD', comment?: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const newHistoryEntry = {
          actor: 'Vendor' as 'Vendor',
          timestamp: new Date().toLocaleString(),
          action: action === 'SUBMIT_JUSTIFICATION' ? 'Justification Submitted' : 'Corrected Invoice Uploaded',
          comment: comment,
        };
        const updatedDispute: Dispute = {
          status: 'VENDOR_RESPONDED',
          history: [...(inv.dispute?.history || []), newHistoryEntry],
          messages: inv.dispute?.messages || []
        };
        return { ...inv, status: InvoiceStatus.VENDOR_RESPONDED, dispute: updatedDispute };
      }
      return inv;
    }));
  };

  // --- WORKFLOW ENGINE v2 (BLOOMBERG GRADE) ---
  // --- WORKFLOW ENGINE v2 (DYNAMIC) ---
  const handleWorkflowDecision = (invoiceId: string, stepId: string, decision: 'APPROVE' | 'REJECT', comment: string) => {
    setInvoices(prevInvoices => {
      const newInvoices = JSON.parse(JSON.stringify(prevInvoices)); // Deep copy
      const invoiceIndex = newInvoices.findIndex((inv: Invoice) => inv.id === invoiceId);
      if (invoiceIndex === -1) return prevInvoices;

      const updatedInvoice = newInvoices[invoiceIndex];
      const currentStepIndex = workflowConfig.findIndex(s => s.id === stepId);
      const currentStep = workflowConfig[currentStepIndex];

      if (!currentStep) {
        console.error("Workflow Error: Step not found in config", stepId);
        return prevInvoices;
      }

      // 1. UPDATE CURRENT STEP HISTORY
      // Find existing history item or push if somehow missing
      let historyItem = updatedInvoice.workflowHistory.find((h: any) => h.stepId === stepId);
      if (!historyItem) {
        // Should not happen for active step, but safety fallback
        historyItem = { stepId, status: 'PENDING' };
        updatedInvoice.workflowHistory.push(historyItem);
      }

      historyItem.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      historyItem.approverName = activePersona.name;
      historyItem.approverRole = activePersona.role;
      historyItem.timestamp = new Date().toLocaleString();
      historyItem.comment = comment;

      // 2. REJECTION LOGIC
      if (decision === 'REJECT') {
        updatedInvoice.status = InvoiceStatus.REJECTED;
        updatedInvoice.nextApproverRole = undefined;
        updatedInvoice.currentStepId = undefined;

        // Update selected invoice immediately
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(updatedInvoice);
        }
        return newInvoices;
      }

      // 3. APPROVAL LOGIC - ADVANCE TO NEXT STEP
      const nextStep = workflowConfig[currentStepIndex + 1];

      if (nextStep) {
        // Advance Workflow Pointers
        updatedInvoice.currentStepId = nextStep.id;
        updatedInvoice.nextApproverRole = nextStep.roleId;

        // Set Next Step to ACTIVE in History
        let nextHistoryItem = updatedInvoice.workflowHistory.find((h: any) => h.stepId === nextStep.id);
        if (!nextHistoryItem) {
          updatedInvoice.workflowHistory.push({ stepId: nextStep.id, status: 'ACTIVE' });
        } else {
          nextHistoryItem.status = 'ACTIVE';
        }

        // Update Top-Level Status (Business Logic for Dashboard Filtering)
        if (currentStep.roleId === 'OPS_MANAGER') {
          updatedInvoice.status = InvoiceStatus.OPS_APPROVED;

          setNotifications(prev => [{
            id: Date.now().toString(),
            type: 'ASSIGNMENT',
            message: 'Invoice #' + updatedInvoice.invoiceNumber + ' requires Financial Review.',
            timestamp: 'Just now',
            read: false,
            actionLink: updatedInvoice.id
          }, ...prev]);

        } else if (currentStep.roleId === 'FINANCE_MANAGER') {
          updatedInvoice.status = InvoiceStatus.FINANCE_APPROVED;

          setNotifications(prev => [{
            id: Date.now().toString(),
            type: 'INFO',
            message: `Invoice #${updatedInvoice.invoiceNumber} ready for Treasury Release.`,
            timestamp: 'Just now',
            read: false,
            actionLink: updatedInvoice.id
          }, ...prev]);
        }

      } else {
        // END OF WORKFLOW
        updatedInvoice.status = InvoiceStatus.PAID;
        updatedInvoice.currentStepId = undefined;
        updatedInvoice.nextApproverRole = undefined;

        setNotifications(prev => [{
          id: Date.now().toString(),
          type: 'INFO',
          message: `Payment released for Invoice #${updatedInvoice.invoiceNumber}.`,
          timestamp: 'Just now',
          read: false,
          actionLink: updatedInvoice.id
        }, ...prev]);
      }

      newInvoices[invoiceIndex] = updatedInvoice;

      // Update selected invoice state to reflect changes immediately in UI
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(updatedInvoice);
      }

      return newInvoices;
    });
  };



  const handleIngestEdi = (parsed: ParsedEdi) => {
    const newInvoice: Invoice = {
      id: `INV - ${Date.now()} `,
      invoiceNumber: parsed.metadata.invoiceNumber || `EDI - ${Date.now()} `,
      carrier: parsed.metadata.carrier || 'Unknown Carrier',
      origin: 'Unknown Origin', // EDI 210 usually has N4 segments for this, simplified here
      destination: 'Unknown Destination',
      amount: parsed.metadata.amount || 0,
      currency: parsed.metadata.currency || 'INR',
      date: parsed.metadata.date || new Date().toISOString().split('T')[0],
      status: InvoiceStatus.PENDING,
      variance: 0,
      extractionConfidence: 100, // EDI is 100% accurate data structure
      lineItems: [], // Would parse LX/L1 segments in full impl
      matchResults: {
        rate: MatchStatus.MATCH,
        delivery: MatchStatus.MATCH,
        unit: MatchStatus.MATCH
      },
      source: 'EDI',
      workflowHistory: workflowConfig.map((step, idx) => ({
        stepId: step.id,
        status: idx === 0 ? 'ACTIVE' : 'PENDING',
        timestamp: idx === 0 ? new Date().toLocaleString() : undefined
      })),
      currentStepId: workflowConfig[0]?.id,
      nextApproverRole: workflowConfig[0]?.roleId
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'INFO',
      message: `New EDI Invoice #${newInvoice.invoiceNumber} ingested successfully.`,
      timestamp: 'Just now',
      read: false,
      actionLink: newInvoice.id
    }, ...prev]);

    // Auto-navigate to dashboard to see it
    setActiveTab('cockpit');
  };

  const handleNavigation = (page: string) => {
    setActiveTab(page);
    setSelectedInvoice(null);
  };

  const handlePersonaSwitchRequest = (persona: typeof DEMO_PERSONAS[0]) => {
    setShowPersonaMenu(false);
    setPendingPersona(persona);
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    if (pendingPersona) {
      performPersonaSwitch(pendingPersona);
      setPendingPersona(null);
    }
  };

  const performPersonaSwitch = (persona: typeof DEMO_PERSONAS[0]) => {
    setIsSwitchingUser(true);
    setLoadingMessage("Securely terminating current session...");

    setTimeout(() => setLoadingMessage(`Authenticating user: ${persona.name}...`), 1000);
    setTimeout(() => setLoadingMessage("Verifying Role-Based Access Controls (RBAC)..."), 2200);
    setTimeout(() => setLoadingMessage("Loading personalized workspace..."), 3200);

    setTimeout(() => {
      setActivePersona(persona);
      setUserRole(persona.userRole); // FIX: Update UserRole for Sidebar
      setIsSwitchingUser(false);
      setSelectedInvoice(null);
      if (persona.id === 'finance') {
        setActiveTab('settlement');
      } else {
        setActiveTab('cockpit');
      }
    }, 3800);
  };


  // --- AGENTIC AI HANDLER ---
  const handleChatbotAction = (action: string, entityId: string, details?: string) => {
    console.log(`[AGENT] Executing Action: ${action} on ${entityId}`);

    if (action === 'APPROVE_INVOICE' || action === 'FLAG_DISPUTE') {
      const invoice = invoices.find(inv => inv.invoiceNumber === entityId || inv.id === entityId);
      if (invoice) {
        const updatedInvoice = { ...invoice };
        if (action === 'APPROVE_INVOICE') {
          updatedInvoice.status = InvoiceStatus.APPROVED;
          setNotifications(prev => [...prev, { id: Date.now(), message: `AI Agent approved invoice ${entityId}`, type: 'success', read: false, timestamp: new Date() }]);
        } else if (action === 'FLAG_DISPUTE') {
          updatedInvoice.status = InvoiceStatus.EXCEPTION;
          updatedInvoice.reason = 'Flagged by AI Agent: ' + (details || 'Review Required');
          setNotifications(prev => [...prev, { id: Date.now(), message: `AI Agent flagged invoice ${entityId}`, type: 'alert', read: false, timestamp: new Date() }]);
        }
        handleInvoiceUpdate(updatedInvoice);
        return true;
      }
    }
    return false;
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (selectedInvoice) {
      return (
        <InvoiceDetail
          invoice={selectedInvoice}
          onBack={handleBackToWorkbench}
          onUpdateInvoice={handleUpdateInvoice} // Keep for Force Approve
          activePersona={activePersona}
          roles={roles}
          workflowConfig={workflowConfig}
          onWorkflowDecision={handleWorkflowDecision} // New Handler
        />
      );
    }

    switch (activeTab) {
      case 'cockpit':
        return (
          <Dashboard
            onNavigate={handleNavigation}
            activePersona={activePersona}
            notifications={notifications}
            invoices={invoices} // Pass invoices for real-time stats
          />
        );
      case 'ingestion':
        return <InvoiceIngestion onBack={() => handleNavigation(userRole === 'VENDOR' ? 'vendor_portal' : 'cockpit')} onSubmit={() => handleNavigation(userRole === 'VENDOR' ? 'vendor_portal' : 'workbench')} userRole={userRole} />;
      case 'rates':
        return <RateCards />;
      case 'network':
        return <PartnerNetwork />;
      case 'integration':
        return <IntegrationHub onIngestEdi={handleIngestEdi} />;
      case 'workbench':
        return <InvoiceWorkbench invoices={invoices} onSelectInvoice={handleInvoiceSelect} onUpdateInvoices={handleInvoiceUpdate} onAddInvoice={handleInvoiceAdd} />;
      case 'settlement':
        return <SettlementFinance userRole={userRole} />;
      case 'intelligence':
        return <IntelligenceHub />;
      case 'vendor_portal':
        return <VendorPortal invoices={invoices} onNavigate={handleNavigation} onSelectInvoice={handleInvoiceSelect} onUpdateDispute={handleUpdateDispute} />;
      case 'my_payments':
        return <SettlementFinance userRole={userRole} />;
      case 'cts':
        return <CostToServe onNavigate={handleNavigation} />;
      case 'cps':
        return <CarrierPerformance onNavigate={handleNavigation} />;
      case 'aad':
        return <AnomalyDetection onNavigate={handleNavigation} />;
      case 'contracts':
        return <ContractManager />;
      case 'spot_market':
        return <SpotMarket />;
      case 'scorecard':
        return <VendorScorecard />;
      case 'rbac':
        return (
          <RBACSettings
            roles={roles}
            setRoles={setRoles}
            workflowConfig={workflowConfig}
            setWorkflowConfig={setWorkflowConfig}
          />
        );
      case 'profile':
        return <UserProfile userRole={userRole} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium">Module Under Construction</h3>
              <p className="text-sm">This module is part of the future roadmap.</p>
            </div>
          </div>
        );
    }
  };

  if (activeTab === 'guest_bid') {
    return <GuestBid />;
  }

  if (activeTab === 'onboarding') {
    return <VendorOnboarding />;
  }

  if (!isLoggedIn) {
    if (showVendorGate) {
      return <VendorLogin onLoginSuccess={handleVendorGateSuccess} onBack={() => setShowVendorGate(false)} />;
    }
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-[111.11vh] bg-[#F3F4F6] font-sans text-gray-900 relative">

      {isSwitchingUser && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn cursor-wait">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <h3 className="text-2xl font-light text-gray-900 tracking-tight mb-2">System Switch</h3>
          <p className="text-sm font-mono text-teal-600 font-bold uppercase tracking-widest animate-pulse">{loadingMessage}</p>
          <div className="w-64 h-1 bg-gray-100 mt-8 rounded-full overflow-hidden">
            <div className="h-full bg-teal-600 animate-[dash_2s_linear_infinite]" style={{ width: '30%' }}></div>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingPersona(null); }}
        onSuccess={handlePasswordSuccess}
        targetRoleName={pendingPersona?.name || ''}
      />

      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSelectedInvoice(null); }} userRole={userRole} activePersona={activePersona} />

      <main className="ml-64 flex-1 flex flex-col h-[111.11vh] overflow-hidden bg-slate-100">
        <header className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-6 shadow-sm z-50 flex-shrink-0 relative">
          <div className="flex items-center">
            <h1 className="text-sm font-bold text-slate-700 tracking-tight flex items-center mr-6 uppercase">
              {userRole === 'HITACHI' ? <span className="font-cursive text-3xl text-black lowercase first-letter:text-[#E60012] first-letter:uppercase mr-3" style={{ transform: 'translateY(4px)' }}>Confidential</span> : userRole === 'VENDOR' ? 'MAERSK LINE' : 'SEQUELSTRING AI CONTROL TOWER'}
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-slate-500 font-normal">
                {userRole === 'HITACHI' ? 'Finance Cockpit' : userRole === 'VENDOR' ? 'Supplier Portal' : 'Admin Console'}
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Bell size={16} className="text-slate-500 hover:text-slate-700 cursor-pointer" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 rounded-full"></span>
              )}
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="relative">
              <div
                className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 rounded-sm transition-colors"
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-700 leading-none">
                    {userRole === 'VENDOR' ? 'Vendor User' : activePersona.name}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              {/* RESTORED DROPDOWN */}
              {showPersonaMenu && (
                <div className="absolute right-0 top-10 w-64 bg-white border border-slate-200 shadow-lg rounded-sm z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{userRole === 'VENDOR' ? 'Vendor User' : activePersona.name}</p>
                  </div>
                  {userRole !== 'VENDOR' && (
                    <div className="py-2 border-b border-slate-100">
                      <p className="px-4 text-[10px] font-bold text-slate-400 uppercase mb-2">Switch Account (Demo)</p>
                      {DEMO_PERSONAS.map(persona => {
                        const isActive = activePersona.id === persona.id;
                        return (
                          <button
                            key={persona.id}
                            onClick={() => handlePersonaSwitchRequest(persona)}
                            className="w-full text-left px-4 py-2 text-xs flex items-center hover:bg-slate-50 transition-colors"
                          >
                            <div className={`w-2 h-2 rounded-full mr-3 ${isActive ? 'bg-green-500' : 'bg-slate-300'} `}></div>
                            <div className="flex-1">
                              <span className={`block font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'} `}>
                                {persona.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{persona.role}</span>
                            </div>
                            {isActive && <Check size={14} className="text-green-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="py-1">
                    <button
                      onClick={() => { setShowPersonaMenu(false); setActiveTab('profile'); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <UserCircle size={14} className="mr-2 text-slate-400" /> Profile Settings
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => { setShowPersonaMenu(false); handleLogout(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* FIXED SCROLLING: overflow-y-auto added here */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative bg-slate-100">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>
      <AetherChatbot onAction={handleChatbotAction} />
    </div>
  );
};

export default App;
