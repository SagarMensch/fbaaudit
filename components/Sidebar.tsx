
import React from 'react';
import {
  LayoutDashboard,
  ScrollText,
  Truck,
  ClipboardCheck,
  Landmark,
  PieChart,
  Network,
  UploadCloud,
  CreditCard,
  User,
  Settings,
  Calculator,
  Award,
  AlertOctagon
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  activePersona?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, activePersona }) => {

  // Define all possible menu items
  const allMenuItems = [
    { id: 'cockpit', label: 'Control Tower', icon: LayoutDashboard, roles: ['3SC'] },
    { id: 'vendor_portal', label: 'Supplier Home', icon: LayoutDashboard, roles: ['VENDOR'] },

    { id: 'rates', label: 'Contracts & Rates', icon: ScrollText, roles: ['3SC'] },
    { id: 'network', label: 'Carrier Master', icon: Truck, roles: ['3SC'] },

    { id: 'ingestion', label: 'Upload Invoice', icon: UploadCloud, roles: ['VENDOR'] },

    { id: 'workbench', label: 'Freight Audit', icon: ClipboardCheck, roles: ['3SC'] },

    { id: 'settlement', label: 'Payments', icon: Landmark, roles: ['HITACHI', '3SC'] },
    { id: 'my_payments', label: 'My Payments', icon: CreditCard, roles: ['VENDOR'] },

    { id: 'intelligence', label: 'Intelligence Hub', icon: PieChart, roles: ['HITACHI', '3SC'] },

    // PHASE 7: STRATEGIC INTELLIGENCE
    { id: 'cts', label: 'Cost-to-Serve', icon: Calculator, roles: ['HITACHI', '3SC'] },
    { id: 'cps', label: 'Carrier Scorecard', icon: Award, roles: ['HITACHI', '3SC'] },
    { id: 'aad', label: 'Anomaly Detection', icon: AlertOctagon, roles: ['HITACHI', '3SC'] },

    // Integration Hub moved to bottom and removed HITACHI access
    { id: 'integration', label: 'Integration Hub', icon: Network, roles: ['3SC'] },

    // New RBAC Admin Link
    { id: 'rbac', label: 'RBAC & Workflow', icon: Settings, roles: ['3SC'] },

    { id: 'profile', label: 'My Profile', icon: User, roles: ['VENDOR'] }
  ];

  // Filter items based on userRole
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // SAP STYLE: Solid Background, No Glass
  const isVendor = userRole === 'VENDOR';

  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-screen fixed left-0 top-0 z-50 font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-slate-900/50">
        {isVendor ? (
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">PARTNER PORTAL</h1>
            <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-widest">Maersk Line</p>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-extrabold text-slate-100 tracking-tight whitespace-nowrap">3SC CONTROL TOWER</h1>
            <p className="text-[10px] uppercase text-blue-400 font-bold tracking-widest">System Admin</p>
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
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                }`}
            >
              <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors duration-200`} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg ${activePersona?.color === 'teal' ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : activePersona?.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
            {userRole === 'VENDOR' ? 'VN' : activePersona?.initials || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
              {userRole === 'VENDOR' ? 'Vendor User' : activePersona?.name || 'System Admin'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {userRole === 'VENDOR' ? 'Finance Rep' : activePersona?.role || 'Super User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
