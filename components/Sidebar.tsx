
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
  AlertOctagon,
  FileText,
  Gavel,
  ScanEye,
  BarChart2,
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

    { id: 'contracts', label: 'Contract Master', icon: FileText, roles: ['3SC'] },
    { id: 'spot_market', label: 'Spot Auction', icon: Gavel, roles: ['3SC'] },
    { id: 'scorecard', label: 'The Blackbook', icon: BarChart2, roles: ['3SC'] },
    { id: 'rates', label: 'Legacy Rates', icon: ScrollText, roles: ['3SC'] },
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
    <div className="w-64 bg-[#161616] border-r border-gray-800 flex flex-col h-[111.11vh] fixed left-0 top-0 z-50 font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-[#161616]">
        {isVendor ? (
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">PARTNER PORTAL</h1>
            <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-widest">Maersk Line</p>
          </div>
        ) : (
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-bold text-gray-100 tracking-tight leading-tight font-['Inter']">SEQUELSTRING AI</h1>
            <p className="text-[10px] uppercase text-[#0F62FE] font-bold tracking-widest mt-1 font-['Inter']">CONTROL TOWER</p>
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
              <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0F62FE]'} transition-colors duration-200`} />
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
