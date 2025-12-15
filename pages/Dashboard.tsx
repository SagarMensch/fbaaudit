import React from 'react';
import {
   DollarSign,
   TrendingUp,
   TrendingDown,
   Activity,
   AlertTriangle,
   ArrowUpRight,
   ArrowDownRight,
   Clock,
   CheckCircle,
   Truck,
   Database,
   Download,
   RefreshCw,
   Filter
} from 'lucide-react';
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   BarChart,
   Bar,
   Legend
} from 'recharts';
import { Invoice, Notification } from '../types';

interface DashboardProps {
   onNavigate: (page: string) => void;
   activePersona: any;
   notifications: Notification[];
   invoices: Invoice[];
}

const VOLUME_TREND_DATA = [
   { name: 'Jan', spend: 4000, volume: 240 },
   { name: 'Feb', spend: 3000, volume: 139 },
   { name: 'Mar', spend: 2000, volume: 980 },
   { name: 'Apr', spend: 2780, volume: 390 },
   { name: 'May', spend: 1890, volume: 480 },
   { name: 'Jun', spend: 2390, volume: 380 },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, activePersona, notifications = [], invoices = [] }) => {
   const isFinance = activePersona?.id === 'william' || activePersona?.roleId === 'FINANCE_MANAGER';
   const isOps = activePersona?.id === 'lan' || activePersona?.roleId === 'OPS_MANAGER';

   // --- OPS DASHBOARD (Lan Banh) ---
   if (isOps) {
      return (
         <div className="p-6 space-y-6 bg-slate-100 min-h-screen">
            {/* OPS HEADER */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                     <Truck className="mr-3 text-teal-600" /> Logistics Command Center
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Operational Oversight: Inbound, Customs, & Carrier Performance</p>
               </div>
               <div className="flex space-x-3">
                  <button className="sap-btn-primary flex items-center" onClick={() => onNavigate('aad')}>
                     <Activity size={14} className="mr-2" /> Anomaly Feed
                  </button>
               </div>
            </div>

            {/* OPS KPI GRID */}
            <div className="grid grid-cols-4 gap-4">
               <div className="sap-card p-4 border-l-4 border-l-teal-500">
                  <p className="text-xs font-bold text-slate-500 uppercase">Active Shipments</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">1,240</h3>
                  <span className="text-xs text-green-600 font-bold">+5% vs Last Week</span>
               </div>
               <div className="sap-card p-4 border-l-4 border-l-orange-500">
                  <p className="text-xs font-bold text-slate-500 uppercase">Exceptions (Open)</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">14</h3>
                  <span className="text-xs text-orange-600 font-bold">Requires Action</span>
               </div>
               <div className="sap-card p-4 border-l-4 border-l-blue-500">
                  <p className="text-xs font-bold text-slate-500 uppercase">On-Time Delivery</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">98.2%</h3>
                  <span className="text-xs text-slate-400">Target: 98.0%</span>
               </div>
               <div className="sap-card p-4 border-l-4 border-l-red-500">
                  <p className="text-xs font-bold text-slate-500 uppercase">Detention Risk</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">3</h3>
                  <span className="text-xs text-red-600 font-bold">Containers at Port &gt; 5 Days</span>
               </div>
            </div>

            {/* OPS MAIN CONTENT */}
            <div className="grid grid-cols-12 gap-6">
               <div className="col-span-8 sap-card h-96">
                  <div className="sap-header">Inbound Volume Forecast</div>
                  <div className="p-4 h-[calc(100%-40px)]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={VOLUME_TREND_DATA}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                           <Tooltip />
                           <Area type="monotone" dataKey="spend" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div className="col-span-4 sap-card h-96">
                  <div className="sap-header">Critical Exceptions</div>
                  <div className="p-0 overflow-y-auto h-[calc(100%-40px)]">
                     <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                           <tr>
                              <th className="px-4 py-2">ID</th>
                              <th className="px-4 py-2">Issue</th>
                              <th className="px-4 py-2 text-right">Age</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           <tr className="hover:bg-red-50 cursor-pointer">
                              <td className="px-4 py-2 font-mono text-blue-600">INV-009</td>
                              <td className="px-4 py-2">Rate Mismatch</td>
                              <td className="px-4 py-2 text-right text-red-600 font-bold">2d</td>
                           </tr>
                           <tr className="hover:bg-red-50 cursor-pointer">
                              <td className="px-4 py-2 font-mono text-blue-600">INV-012</td>
                              <td className="px-4 py-2">Missing GR</td>
                              <td className="px-4 py-2 text-right text-red-600 font-bold">1d</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   // --- FINANCE DASHBOARD (William Carswell) ---
   if (isFinance) {
      return (
         <div className="p-6 space-y-6 bg-slate-100 min-h-screen">
            {/* FINANCE HEADER */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                     <DollarSign className="mr-3 text-blue-600" /> Financial Terminal
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Treasury Management: Cash Flow, Accruals, & Variance Analysis</p>
               </div>
               <div className="flex space-x-3">
                  <button className="sap-btn-secondary flex items-center" onClick={() => onNavigate('settlement')}>
                     <Database size={14} className="mr-2" /> Payment Factory
                  </button>
               </div>
            </div>

            {/* FINANCE TICKER */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 rounded-sm flex space-x-8 overflow-hidden font-mono">
               <span>USD/EUR: <span className="text-green-400">1.084 (+0.02%)</span></span>
               <span>BRENT: <span className="text-red-400">82.40 (-0.15%)</span></span>
               <span>LIBOR 3M: <span className="text-slate-100">5.32%</span></span>
               <span>CASH POSITION: <span className="text-blue-400">$12.4M</span></span>
            </div>

            {/* FINANCE KPI GRID */}
            <div className="grid grid-cols-4 gap-4">
               <div className="sap-card p-4 border-t-4 border-t-blue-600">
                  <p className="text-xs font-bold text-slate-500 uppercase">Cash Requirement (Wk 42)</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">$4.2M</h3>
                  <span className="text-xs text-slate-400">Due for Payment Run</span>
               </div>
               <div className="sap-card p-4 border-t-4 border-t-green-600">
                  <p className="text-xs font-bold text-slate-500 uppercase">YTD Savings</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">$850k</h3>
                  <span className="text-xs text-green-600 font-bold">Audit & Dispute Recoveries</span>
               </div>
               <div className="sap-card p-4 border-t-4 border-t-red-600">
                  <p className="text-xs font-bold text-slate-500 uppercase">Budget Variance</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">-1.2%</h3>
                  <span className="text-xs text-red-600 font-bold">Over Budget (Ocean Freight)</span>
               </div>
               <div className="sap-card p-4 border-t-4 border-t-purple-600">
                  <p className="text-xs font-bold text-slate-500 uppercase">Auto-Match Rate</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">94.5%</h3>
                  <span className="text-xs text-purple-600 font-bold">Touchless Processing</span>
               </div>
            </div>

            {/* FINANCE MAIN CONTENT */}
            <div className="grid grid-cols-12 gap-6">
               <div className="col-span-8 sap-card h-96">
                  <div className="sap-header">Cash Flow Projection</div>
                  <div className="p-4 h-[calc(100%-40px)]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={VOLUME_TREND_DATA}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                           <Tooltip />
                           <Area type="monotone" dataKey="spend" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div className="col-span-4 sap-card h-96">
                  <div className="sap-header">Pending Approvals</div>
                  <div className="p-0 overflow-y-auto h-[calc(100%-40px)]">
                     <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                           <tr>
                              <th className="px-4 py-2">Invoice</th>
                              <th className="px-4 py-2 text-right">Amount</th>
                              <th className="px-4 py-2 text-center">GL</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {invoices.filter(i => i.status === 'OPS_APPROVED').slice(0, 5).map(inv => (
                              <tr key={inv.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => onNavigate('workbench')}>
                                 <td className="px-4 py-2 font-mono text-blue-600">{inv.invoiceNumber}</td>
                                 <td className="px-4 py-2 text-right font-bold">${inv.amount.toLocaleString()}</td>
                                 <td className="px-4 py-2 text-center"><span className="bg-green-100 text-green-700 px-1 py-0.5 rounded-sm">VALID</span></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   // --- DEFAULT / ADMIN DASHBOARD ---
   const kpis = [
      { label: 'Open Exceptions', value: '14', icon: AlertTriangle, color: 'rose', trend: 'up', change: '+2' },
      { label: 'Active Shipments', value: '1,240', icon: Truck, color: 'teal', trend: 'up', change: '+5%' },
      { label: 'Dispute Ratio', value: '3.2%', icon: Filter, color: 'purple', trend: 'down', change: '-0.5%' },
      { label: 'Pending Approvals', value: '5', icon: CheckCircle, color: 'blue', trend: 'up', change: '+1' },
   ];

   return (
      <div className="p-6 space-y-6 bg-slate-100 min-h-screen">
         {/* HEADER */}
         <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                  <Database className="mr-3 text-slate-600" /> Enterprise Overview
               </h1>
               <p className="text-sm text-slate-500 mt-1">Unified view across all business functions</p>
            </div>
            <div className="flex space-x-3">
               <button className="sap-btn-secondary flex items-center">
                  <Download size={14} className="mr-2" /> Export Report
               </button>
               <button className="sap-btn-primary flex items-center">
                  <RefreshCw size={14} className="mr-2" /> Refresh Data
               </button>
            </div>
         </div>

         {/* KPI CARDS - GLASS STYLE */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, idx) => (
               <div key={idx} className="glass-card p-5 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <kpi.icon size={64} className={`text-${kpi.color}-500 transform rotate-12`} />
                  </div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div className={`p-3 rounded-xl ${kpi.color === 'blue' ? 'bg-blue-50 text-blue-600 shadow-sm' : kpi.color === 'purple' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : kpi.color === 'teal' ? 'bg-teal-50 text-teal-600 shadow-sm' : 'bg-rose-50 text-rose-600 shadow-sm'}`}>
                        <kpi.icon size={22} />
                     </div>
                     {kpi.trend && (
                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                           {kpi.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                           {kpi.change}
                        </span>
                     )}
                  </div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">{kpi.label}</h3>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight relative z-10">{kpi.value}</p>
               </div>
            ))}
         </div>

         {/* MAIN CONTENT GRID */}
         <div className="grid grid-cols-12 gap-6">
            {/* SPEND TREND */}
            <div className="col-span-8 sap-card h-96">
               <div className="sap-header flex justify-between items-center">
                  <span>Global Freight Spend Trend</span>
                  <button className="text-blue-600 hover:underline text-[10px]">View Details</button>
               </div>
               <div className="p-4 h-[calc(100%-40px)]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={VOLUME_TREND_DATA}>
                        <defs>
                           <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                        <Tooltip
                           contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                           itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                           labelStyle={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Area type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* RECENT ACTIVITY - COMPACT LIST */}
            <div className="col-span-4 sap-card h-96 flex flex-col">
               <div className="sap-header">
                  Recent System Activity
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                  <table className="w-full text-left border-collapse">
                     <tbody className="divide-y divide-slate-100">
                        {notifications.slice(0, 6).map((n, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="p-3 align-top w-8">
                                 <div className={`w-2 h-2 rounded-full mt-1.5 ${n.type === 'ASSIGNMENT' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                              </td>
                              <td className="p-3 pl-0">
                                 <p className="text-xs font-medium text-slate-800 leading-snug">{n.message}</p>
                                 <p className="text-[10px] text-slate-400 mt-0.5">{n.timestamp}</p>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
                  <button className="text-xs font-bold text-blue-600 hover:underline">View All Activity</button>
               </div>
            </div>
         </div>

         {/* BOTTOM ROW */}
         <div className="grid grid-cols-2 gap-6">
            <div className="sap-card h-64">
               <div className="sap-header">Spend by Region</div>
               <div className="p-4 h-[calc(100%-40px)] flex items-center justify-center text-slate-400 text-sm bg-slate-50">
                  <div className="text-center">
                     <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                     <p>Geospatial Module Loading...</p>
                  </div>
               </div>
            </div>
            <div className="sap-card h-64">
               <div className="sap-header">Carrier Performance Ranking</div>
               <div className="p-0">
                  <table className="w-full text-xs text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                           <th className="px-4 py-2">Carrier</th>
                           <th className="px-4 py-2 text-right">Score</th>
                           <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr>
                           <td className="px-4 py-2 font-medium text-slate-700">Maersk Line</td>
                           <td className="px-4 py-2 text-right font-mono">98.5</td>
                           <td className="px-4 py-2 text-center"><span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">EXCELLENT</span></td>
                        </tr>
                        <tr>
                           <td className="px-4 py-2 font-medium text-slate-700">MSC</td>
                           <td className="px-4 py-2 text-right font-mono">94.2</td>
                           <td className="px-4 py-2 text-center"><span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">GOOD</span></td>
                        </tr>
                        <tr>
                           <td className="px-4 py-2 font-medium text-slate-700">CMA CGM</td>
                           <td className="px-4 py-2 text-right font-mono">89.1</td>
                           <td className="px-4 py-2 text-center"><span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">AVERAGE</span></td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
   );
};
