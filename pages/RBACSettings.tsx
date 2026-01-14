
import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, CheckCircle, AlertCircle, Activity, TrendingUp, TrendingDown, Zap, Eye, AlertTriangle, Clock, Database, Network, Cpu, BarChart3, PieChart as PieChartIcon, Grid, Server, Terminal } from 'lucide-react';
import { RoleDefinition, WorkflowStepConfig } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface RBACSettingsProps {
   roles: RoleDefinition[];
   setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>;
   workflowConfig: WorkflowStepConfig[];
   setWorkflowConfig: React.Dispatch<React.SetStateAction<WorkflowStepConfig[]>>;
}

// --- ISOMETRIC TECHNICAL ICONS (ENGINEERING SOLID STYLE) ---
const IsoShield = ({ className, size = 32 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      {/* Front Face */}
      <path d="M16 2 L28 8 L28 18 C28 25 22 30 16 32 V2 Z" fill="#0f62fe" />
      <path d="M16 2 L4 8 L4 18 C4 25 10 30 16 32 V2 Z" fill="#001d6c" /> {/* Darker side */}
      {/* Top Detail */}
      <path d="M16 2 L22 5 L16 8 L10 5 Z" fill="#8baaf9" opacity="0.5" />
      {/* Core Indicator */}
      <rect x="14" y="12" width="4" height="12" fill="#00C805" />
   </svg>
);

const IsoFlow = ({ className, size = 32 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      {/* Base Grid */}
      <path d="M2 16 L16 24 L30 16 L16 8 Z" fill="none" stroke="#333" strokeWidth="1" />

      {/* Block A (Start) */}
      <path d="M6 14 L12 17 V21 L6 18 Z" fill="#001d6c" />
      <path d="M6 14 L12 11 L18 14 L12 17 Z" fill="#0f62fe" />
      <path d="M18 14 V18 L12 21 V17 Z" fill="#0043ce" />

      {/* Connector */}
      <path d="M18 16 L22 18" stroke="#00C805" strokeWidth="2" />

      {/* Block B (End) */}
      <path d="M20 18 L26 21 V25 L20 22 Z" fill="#002909" />
      <path d="M20 18 L26 15 L32 18 L26 21 Z" fill="#00C805" />
      <path d="M32 18 V22 L26 25 V21 Z" fill="#005e04" />
   </svg>
);

const IsoLock = ({ className, size = 32 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      {/* Block Body */}
      <path d="M8 12 L24 12 L24 24 L8 24 Z" fill="#161616" stroke="#0f62fe" strokeWidth="1" />
      {/* 3D Depth */}
      <path d="M24 12 L28 10 L28 22 L24 24 Z" fill="#001d6c" />
      <path d="M8 12 L12 10 L28 10 L24 12 Z" fill="#0f62fe" />

      {/* Keyhole */}
      <rect x="15" y="16" width="2" height="4" fill="#00C805" />

      {/* Shackle */}
      <path d="M12 10 V6 A4 4 0 0 1 20 6 V10" fill="none" stroke="#ffffff" strokeWidth="2" />
   </svg>
);

const IsoChart = ({ className, size = 32 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      {/* Base */}
      <path d="M2 28 L30 28" stroke="#333" strokeWidth="2" />

      {/* Bar 1 */}
      <path d="M6 28 V12 L12 8 V24 L6 28 Z" fill="#001d6c" /> {/* Side */}
      <path d="M6 12 L12 8 L18 12 L12 16 Z" fill="#0f62fe" /> {/* Top */}
      <path d="M12 24 V16 L18 12 V20 Z" fill="#0043ce" /> {/* Front */}

      {/* Bar 2 */}
      <path d="M20 28 V16 L26 12 V24 L20 28 Z" fill="#002909" />
      <path d="M20 16 L26 12 L32 16 L26 20 Z" fill="#00C805" />
      <path d="M26 24 V20 L32 16 V24 Z" fill="#005e04" />
   </svg>
);

export const RBACSettings: React.FC<RBACSettingsProps> = ({ roles, setRoles, workflowConfig, setWorkflowConfig }) => {
   const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'workflow' | 'analytics'>('overview');
   const [toast, setToast] = useState<string | null>(null);
   const [liveMetrics, setLiveMetrics] = useState({ activeUsers: 247, pendingApprovals: 12, sysStatus: 'NOMINAL' });

   // Simulate live data updates
   useEffect(() => {
      const interval = setInterval(() => {
         setLiveMetrics(prev => ({
            ...prev,
            sysStatus: Math.random() > 0.9 ? 'RE-SYNC' : 'NOMINAL'
         }));
      }, 2000);
      return () => clearInterval(interval);
   }, []);

   const showToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
   };

   // Mock data
   const activityData = [
      { time: '0000', count: 45, status: 'OK' },
      { time: '0400', count: 52, status: 'OK' },
      { time: '0800', count: 78, status: 'WARN' },
      { time: '1200', count: 95, status: 'OK' },
      { time: '1600', count: 88, status: 'OK' },
      { time: '2000', count: 62, status: 'OK' },
   ];

   const togglePermission = (roleId: string, perm: keyof RoleDefinition['permissions']) => {
      setRoles(prev => prev.map(r => {
         if (r.id === roleId) {
            return {
               ...r,
               permissions: { ...r.permissions, [perm]: !r.permissions[perm] }
            };
         }
         return r;
      }));
   };

   // --- RENDER HELPERS ---

   const TabButton = ({ id, label, icon: Icon }: any) => (
      <button
         onClick={() => setActiveTab(id)}
         className={`flex items-center space-x-3 px-6 py-4 font-mono text-sm tracking-wider uppercase border-r border-[#333] transition-colors
               ${activeTab === id
               ? 'bg-[#0f62fe] text-white'
               : 'bg-black text-gray-500 hover:text-white hover:bg-[#111]'}`}
      >
         <Icon size={18} />
         <span>{label}</span>
      </button>
   );

   const KpiPanel = ({ label, value, unit, status = 'good' }: any) => (
      <div className="bg-black border border-[#333] p-4 flex justify-between items-center group hover:border-[#0f62fe]">
         <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline space-x-1">
               <span className="text-3xl font-bold text-white font-mono">{value}</span>
               {unit && <span className="text-xs text-[#0f62fe] font-mono">{unit}</span>}
            </div>
         </div>
         <div className={`h-2 w-2 ${status === 'good' ? 'bg-[#00C805]' : 'bg-red-500'} rounded-none animate-none`} />
      </div>
   );

   return (
      <div className="h-full flex flex-col bg-black font-sans text-gray-300 selection:bg-[#0f62fe] selection:text-white">

         {/* HEADER: Industrial / SCADA Style */}
         <div className="bg-black border-b border-[#333] h-16 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-4">
               <div className="w-8 h-8 bg-[#0f62fe] flex items-center justify-center">
                  <Grid className="text-white" size={20} />
               </div>
               <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-white uppercase tracking-wider leading-none">Access Control <span className="text-[#0f62fe]">Module 01</span></h1>
                  <span className="text-[10px] text-gray-600 font-mono mt-1">SYS.ADMIN.RBAC // V2.4.0 -- ONLINE</span>
               </div>
            </div>

            <div className="flex items-center space-x-6">
               {/* Status Indicators */}
               <div className="flex space-x-px border border-[#333]">
                  <div className="px-3 py-1 bg-[#111] text-[10px] font-mono text-gray-500 uppercase">Gateway</div>
                  <div className="px-3 py-1 bg-[#001d6c] text-[10px] font-mono text-[#4a90e2] uppercase">Connected</div>
               </div>
               <div className="flex space-x-px border border-[#333]">
                  <div className="px-3 py-1 bg-[#111] text-[10px] font-mono text-gray-500 uppercase">Latency</div>
                  <div className="px-3 py-1 bg-black text-[10px] font-mono text-[#00C805] uppercase">12ms</div>
               </div>
               <button
                  onClick={() => showToast('SYSTEM SYNCHRONIZED')}
                  className="bg-[#333] hover:bg-[#0f62fe] text-white px-4 py-1 text-xs font-bold uppercase tracking-wider transition-colors"
               >
                  Sync Config
               </button>
            </div>
         </div>

         {/* NAVIGATION BAR: Rigid Tabs */}
         <div className="bg-black border-b border-[#333] flex">
            <TabButton id="overview" label="Overview" icon={IsoChart} />
            <TabButton id="roles" label="Role Matrix" icon={IsoShield} />
            <TabButton id="workflow" label="Workflow Logic" icon={IsoFlow} />
            <TabButton id="analytics" label="Audit Logs" icon={Activity} />
            <div className="flex-1 bg-[#050505] flex items-center justify-end px-6">
               <span className="font-mono text-xs text-[#0f62fe]">{new Date().toLocaleTimeString()} UTC</span>
            </div>
         </div>

         {/* MAIN CONTENT AREA */}
         <div className="flex-1 overflow-auto bg-[#050505] p-6 custom-scrollbar">

            {/* OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
               <div className="space-y-6">
                  {/* Top KPI Row */}
                  <div className="grid grid-cols-4 gap-4">
                     <KpiPanel label="Active Sessions" value={liveMetrics.activeUsers} unit="USR" />
                     <KpiPanel label="Pending Approvals" value={liveMetrics.pendingApprovals} unit="TSK" status="warn" />
                     <KpiPanel label="System Status" value={liveMetrics.sysStatus} />
                     <KpiPanel label="Security Level" value="A-1" unit="MAX" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 h-[400px]">
                     {/* Main Chart Panel */}
                     <div className="col-span-2 bg-black border border-[#333] p-1 flex flex-col">
                        <div className="bg-[#111] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Activity size={12} /> Transaction Volume
                           </h3>
                        </div>
                        <div className="flex-1 p-4">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={activityData}>
                                 <CartesianGrid stroke="#222" strokeDasharray="0" vertical={false} />
                                 <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                 <YAxis stroke="#555" tick={{ fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                 <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: 0 }}
                                    itemStyle={{ color: '#00C805', fontFamily: 'monospace' }}
                                    labelStyle={{ color: '#666', fontFamily: 'monospace' }}
                                 />
                                 <Area type="step" dataKey="count" stroke="#0f62fe" fill="#001d6c" strokeWidth={2} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Side Panel: Role Allocations */}
                     <div className="bg-black border border-[#333] p-1 flex flex-col">
                        <div className="bg-[#111] px-4 py-2 border-b border-[#333]">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <IsoShield size={12} /> Distribution
                           </h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                           <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                 <Pie data={[
                                    { name: 'Ops', value: 40, fill: '#0f62fe' },
                                    { name: 'Fin', value: 30, fill: '#00C805' },
                                    { name: 'Adm', value: 30, fill: '#333' }
                                 ]} innerRadius={60} outerRadius={80} stroke="none" dataKey="value">
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute text-center">
                              <div className="text-2xl font-bold text-white font-mono">100%</div>
                              <div className="text-[10px] text-gray-500 uppercase">Coverage</div>
                           </div>
                        </div>
                        {/* Legend */}
                        <div className="p-4 border-t border-[#333] space-y-2">
                           <div className="flex justify-between text-xs font-mono">
                              <span className="text-[#0f62fe]">■ OPERATIONS</span>
                              <span>40%</span>
                           </div>
                           <div className="flex justify-between text-xs font-mono">
                              <span className="text-[#00C805]">■ FINANCE</span>
                              <span>30%</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* ROLES MATRIX */}
            {activeTab === 'roles' && (
               <div className="grid grid-cols-3 gap-4">
                  {roles.map(role => (
                     <div key={role.id} className="bg-black border border-[#333] hover:border-[#0f62fe] transition-colors group relative">
                        {/* Corner Accent */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-[#111] group-hover:border-r-[#0f62fe] transition-colors"></div>

                        <div className="p-5">
                           <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-[#111] border border-[#333]">
                                 <IsoLock size={24} />
                              </div>
                              <span className="text-[10px] font-mono text-gray-500 uppercase border border-[#333] px-2 py-0.5">ID: {role.id}</span>
                           </div>

                           <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-1">{role.name}</h3>
                           <p className="text-xs text-gray-500 font-mono mb-6 min-h-[32px]">{role.description}</p>

                           <div className="space-y-px bg-[#333] border border-[#333]">
                              <PermissionRow label="View Invoices" active={role.permissions.canViewInvoices} onClick={() => togglePermission(role.id, 'canViewInvoices')} />
                              <PermissionRow label="Approve L1" active={role.permissions.canApproveL1} onClick={() => togglePermission(role.id, 'canApproveL1')} />
                              <PermissionRow label="Approve L2" active={role.permissions.canApproveL2} onClick={() => togglePermission(role.id, 'canApproveL2')} />
                              <PermissionRow label="System Admin" active={role.permissions.canAdminSystem} onClick={() => togglePermission(role.id, 'canAdminSystem')} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* WORKFLOW SCHEMATIC */}
            {activeTab === 'workflow' && (
               <div className="bg-black border border-[#333] min-h-[600px] relative p-8 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px]">

                  {/* Toolbar */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                     <button className="bg-[#0f62fe] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#0043ce]" onClick={() => {
                        const newStep: WorkflowStepConfig = { id: `step-${Date.now()}`, stepName: 'NEW NODE', roleId: roles[0].id, conditionType: 'ALWAYS' };
                        setWorkflowConfig([...workflowConfig, newStep]);
                     }}>
                        + Add Node
                     </button>
                  </div>

                  <div className="flex flex-col items-center space-y-0 py-10">
                     {/* Start Node */}
                     <div className="w-48 h-12 border-2 border-[#00C805] bg-[#002909] flex items-center justify-center mb-8 relative">
                        <span className="text-[#00C805] font-bold font-mono tracking-widest">START SEQUENCE</span>
                        <div className="absolute bottom-[-34px] left-1/2 w-0.5 h-8 bg-[#00C805]"></div>
                     </div>

                     {workflowConfig.map((step, idx) => (
                        <div key={step.id} className="relative flex flex-col items-center">
                           {/* Connector Line */}
                           {idx > 0 && <div className="h-8 w-0.5 bg-[#333]"></div>}

                           {/* Workflow Node Card */}
                           <div className="w-[600px] bg-[#050505] border border-[#333] hover:border-[#0f62fe] p-4 flex items-center gap-4 relative z-10 transition-colors">

                              {/* Index Badge */}
                              <div className="w-10 h-10 bg-[#111] border border-[#333] flex items-center justify-center text-lg font-bold font-mono text-gray-500">
                                 {String(idx + 1).padStart(2, '0')}
                              </div>

                              {/* Inputs Grid */}
                              <div className="grid grid-cols-12 gap-4 flex-1">
                                 <div className="col-span-4">
                                    <label className="block text-[10px] text-gray-500 uppercase font-mono mb-1">Function Name</label>
                                    <input
                                       value={step.stepName}
                                       disabled={step.isSystemStep}
                                       onChange={(e) => {
                                          const updated = [...workflowConfig];
                                          updated[idx].stepName = e.target.value;
                                          setWorkflowConfig(updated);
                                       }}
                                       className="w-full bg-[#111] border border-[#333] text-white text-xs px-2 py-2 font-mono uppercase focus:border-[#0f62fe] outline-none"
                                    />
                                 </div>
                                 <div className="col-span-4">
                                    <label className="block text-[10px] text-gray-500 uppercase font-mono mb-1">Authorization</label>
                                    <select
                                       value={step.roleId}
                                       className="w-full bg-[#111] border border-[#333] text-white text-xs px-2 py-2 font-mono uppercase outline-none"
                                    >
                                       {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                 </div>
                                 <div className="col-span-3">
                                    <label className="block text-[10px] text-gray-500 uppercase font-mono mb-1">Logic Gate</label>
                                    <div className="flex border border-[#333]">
                                       <div className={`flex-1 h-8 bg-[#0f62fe] flex items-center justify-center text-[10px] font-bold text-white`}>AND</div>
                                       <div className={`flex-1 h-8 bg-[#111] flex items-center justify-center text-[10px] font-bold text-gray-600`}>OR</div>
                                    </div>
                                 </div>
                                 <div className="col-span-1 flex items-center justify-end">
                                    <button className="text-gray-600 hover:text-red-500"><AlertTriangle size={16} /></button>
                                 </div>
                              </div>
                           </div>

                           {/* Outgoing Connector */}
                           <div className="h-8 w-0.5 bg-[#333]"></div>
                        </div>
                     ))}

                     {/* End Node */}
                     <div className="w-48 h-12 border-2 border-[#333] bg-[#111] flex items-center justify-center">
                        <span className="text-gray-500 font-bold font-mono tracking-widest">END SEQUENCE</span>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* TOAST SYSTEM (Bottom Right Overlay) */}
         {toast && (
            <div className="absolute bottom-6 right-6 bg-[#001d6c] border-l-4 border-[#0f62fe] text-white px-6 py-4 shadow-xl z-50 flex items-center gap-4">
               <Terminal size={20} className="text-[#0f62fe]" />
               <div>
                  <div className="text-[10px] font-bold text-[#4a90e2] uppercase tracking-widest">System Message</div>
                  <div className="font-mono text-sm">{toast}</div>
               </div>
            </div>
         )}
      </div>
   );
};

const PermissionRow = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
   <div
      onClick={onClick}
      className={`flex justify-between items-center px-3 py-2 cursor-pointer transition-colors ${active ? 'bg-[#0f62fe]/10' : 'bg-black hover:bg-[#111]'}`}
   >
      <span className={`text-xs font-mono uppercase ${active ? 'text-white font-bold' : 'text-gray-600'}`}>{label}</span>
      <div className={`w-3 h-3 border ${active ? 'bg-[#00C805] border-[#00C805]' : 'border-[#333]'}`}></div>
   </div>
);
