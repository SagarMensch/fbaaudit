import React from 'react';
import {
  GeoDashboard, GeoContract, GeoAuction, GeoBook, GeoRates,
  GeoCarrier, GeoDocs, GeoInvoice, GeoData, GeoReport, GeoAudit,
  GeoMoney, GeoCheck, GeoIconAlert, GeoIconProps,
  GeoIntelligence, GeoCalculator, GeoAward, GeoAnomaly, GeoNetwork, GeoSettings, GeoUser, GeoUploadCloud, GeoLeaf
} from './GeoIcons';
import { UserRole } from '../types';
import { SilverGlobe } from '../pages/supplier/components/SilverGlobe';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  activePersona?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, activePersona }) => {

  // Define all possible menu items - ALL using 3D Geometric Icons
  const allMenuItems = [
    { id: 'cockpit', label: 'Control Tower', icon: GeoDashboard, roles: ['3SC'] },
    { id: 'vendor_portal', label: 'Supplier Home', icon: GeoDashboard, roles: ['VENDOR'] },

    { id: 'contracts', label: 'Contract Master', icon: GeoContract, roles: ['3SC'] },
    { id: 'spot_market', label: 'Spot Auction', icon: GeoAuction, roles: ['3SC'] },
    { id: 'scorecard', label: 'The Blackbook', icon: GeoBook, roles: ['3SC'] },
    { id: 'rates', label: 'Legacy Rates', icon: GeoRates, roles: ['3SC'] },
    { id: 'network', label: 'Carrier Master', icon: GeoCarrier, roles: ['3SC'] },
    { id: 'documents', label: 'Document Library', icon: GeoDocs, roles: ['3SC'] },
    { id: 'invoice_review', label: 'Invoice Review', icon: GeoInvoice, roles: ['3SC'] },
    { id: 'master_data_hub', label: 'Master Data Hub', icon: GeoData, roles: ['3SC'] },
    { id: 'reports', label: 'Reports', icon: GeoReport, roles: ['3SC'] },

    { id: 'ingestion', label: 'Upload Invoice', icon: GeoUploadCloud, roles: ['VENDOR'] },

    { id: 'workbench', label: 'Freight Audit', icon: GeoAudit, roles: ['3SC'] },

    { id: 'settlement', label: 'Payments', icon: GeoMoney, roles: ['HITACHI', '3SC'] },
    { id: 'finance_terminal', label: 'Finance Terminal', icon: GeoDashboard, roles: ['3SC'] },
    { id: 'my_payments', label: 'My Payments', icon: GeoMoney, roles: ['VENDOR'] },

    { id: 'intelligence', label: 'Intelligence Hub', icon: GeoIntelligence, roles: ['HITACHI', '3SC'] },

    // PHASE 7: STRATEGIC INTELLIGENCE - All 3D Geometric Icons
    { id: 'cts', label: 'Cost-to-Serve', icon: GeoCalculator, roles: ['HITACHI', '3SC'] },
    { id: 'cps', label: 'Carrier Scorecard', icon: GeoAward, roles: ['HITACHI', '3SC'] },
    { id: 'aad', label: 'Anomaly Detection', icon: GeoAnomaly, roles: ['HITACHI', '3SC'] },

    // ESG & Sustainability
    { id: 'emissions', label: 'ESG & Emissions', icon: GeoLeaf, roles: ['HITACHI', '3SC'] },

    // LSTM Capacity Forecasting
    { id: 'capacity_forecast', label: 'Capacity Forecast', icon: GeoCarrier, roles: ['HITACHI', '3SC'] },

    // s-ETS Shock Rate Benchmark
    { id: 'shock_rate', label: 'Shock Rate Benchmark', icon: GeoAnomaly, roles: ['HITACHI', '3SC'] },

    // Integration Hub moved to bottom
    { id: 'integration', label: 'Integration Hub', icon: GeoNetwork, roles: ['3SC'] },

    // New RBAC Admin Link
    { id: 'rbac', label: 'RBAC & Workflow', icon: GeoSettings, roles: ['3SC'] },

    // Support Tickets - AI-routed from suppliers
    { id: 'tickets', label: 'Support Tickets', icon: GeoIconAlert, roles: ['3SC'] },

    { id: 'profile', label: 'My Profile', icon: GeoUser, roles: ['VENDOR'] }
  ];

  // Filter items based on userRole
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // SAP STYLE: Solid Background, No Glass
  const isVendor = userRole === 'VENDOR';

  return (
    <div className="w-64 bg-[#161616] border-r border-gray-800 flex flex-col h-[111.11vh] fixed left-0 top-0 z-50 font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-[#161616]">
        {isVendor ? (
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">PARTNER PORTAL</h1>
            <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-widest">Maersk Line</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 justify-center">
            <SilverGlobe size={32} />
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-gray-100 tracking-tight leading-tight font-['Figtree']">SEQUELSTRING AI</h1>
              <p className="text-[10px] uppercase text-[#0F62FE] font-bold tracking-widest mt-1 font-['Figtree']">CONTROL TOWER</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200 group
                ${isActive
                  ? 'bg-[#0F62FE] text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0F62FE]'} transition-colors duration-200`} color={isActive ? "#FFFFFF" : "#6B7280"} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/20" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 bg-[#161616] border-t border-gray-800">
        <div className="flex items-center space-x-3 p-2 rounded-sm hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-700">
          <div className={`w-9 h-9 rounded-sm flex items-center justify-center font-bold text-sm text-white shadow-sm ${activePersona?.color === 'teal' ? 'bg-[#0F62FE]' : activePersona?.color === 'blue' ? 'bg-[#0F62FE]' : 'bg-gray-700'}`}>
            {userRole === 'VENDOR' ? 'VN' : activePersona?.initials || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">
              {userRole === 'VENDOR' ? 'Vendor User' : activePersona?.name || 'System Admin'}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {userRole === 'VENDOR' ? 'Finance Rep' : activePersona?.role || 'Super User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
