import React, { useState } from 'react';
import { Search, Filter, MapPin, Phone, Mail, Globe, TrendingUp, Package, Truck, Star, X, FileText, CheckCircle } from 'lucide-react';
import { IndianLogisticsService, IndianLogisticsPartner } from '../services/indianLogisticsService';

const indianLogisticsService = new IndianLogisticsService();

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoUsers = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="6" r="4" fillOpacity="0.8" />
      <path d="M12 12c-4.42 0-8 2-8 6v2h16v-2c0-4-3.58-6-8-6z" fillOpacity="0.4" />
      <path d="M20 18c0-3-2-5-5-6" stroke="white" strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path d="M4 18c0-3 2-5 5-6" stroke="white" strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <circle cx="12" cy="6" r="2" fill="white" fillOpacity="0.3" />
   </svg>
);

const GeoStar = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity="1" />
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L12 12V2z" fillOpacity="0.4" />
      <path d="M12 17.77l6.18 3.25L17 14.14 12 12v5.77z" fillOpacity="0.6" />
   </svg>
);

const GeoTarget = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="7" fillOpacity="0.4" stroke={color} strokeWidth="1" />
      <circle cx="12" cy="12" r="4" fillOpacity="0.8" />
      <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
   </svg>
);

const GeoAlert = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fillOpacity="0.2" stroke={color} strokeWidth="2" />
      <path d="M12 9v4" stroke={color} strokeWidth="2" />
      <path d="M12 17h.01" stroke={color} strokeWidth="3" />
      <path d="M12 2v20" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
   </svg>
);

// --- 3D BOX ICON FOR MODAL ---
const GeometricBox = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      {/* Left Face */}
      <path d="M12 22 L2 17 L2 7 L12 12 Z" fill="#E2E8F0" />
      {/* Right Face */}
      <path d="M12 22 L22 17 L22 7 L12 12 Z" fill="#CBD5E1" />
      {/* Top Face */}
      <path d="M2 7 L12 2 L22 7 L12 12 Z" fill="#F8FAFC" />

      <path d="M12 22 L12 12" stroke="#94A3B8" strokeWidth="0.5" />
      <path d="M2 7 L12 12" stroke="#94A3B8" strokeWidth="0.5" />
      <path d="M22 7 L12 12" stroke="#94A3B8" strokeWidth="0.5" />
   </svg>
);

const GeoTruck = ({ className, size = 24 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      {/* Truck Body (Cube) */}
      <path d="M2 12 L16 4 L30 12 L16 20 Z" fill="#4299E1" /> {/* Top */}
      <path d="M2 12 L16 20 L16 28 L2 20 Z" fill="#2B6CB0" /> {/* Left */}
      <path d="M30 12 L16 20 L16 28 L30 20 Z" fill="#2C5282" /> {/* Right */}

      {/* Cab (Smaller Cube) */}
      <path d="M18 10 L24 6.5 L30 10 L24 13.5 Z" fill="#63B3ED" />
      <path d="M18 10 L24 13.5 L24 22 L18 18.5 Z" fill="#3182CE" />
      <path d="M30 10 L24 13.5 L24 22 L30 18.5 Z" fill="#2A4365" />
   </svg>
);

const GeoPhone = ({ className, size = 24 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      <path d="M8 8 L16 4 L24 8 L16 12 Z" fill="#4FD1C5" /> {/* Top */}
      <path d="M8 8 L16 12 L16 26 L8 22 Z" fill="#319795" /> {/* Left */}
      <path d="M24 8 L16 12 L16 26 L24 22 Z" fill="#285E61" /> {/* Right */}

      {/* Screen */}
      <path d="M16 14 L21 11.5 L21 20 L16 22.5 Z" fill="#B2F5EA" opacity="0.5" />
      <path d="M16 14 L11 11.5 L11 20 L16 22.5 Z" fill="#81E6D9" opacity="0.3" />
   </svg>
);

const GeoGlobe = ({ className, size = 24 }: { className?: string, size?: number }) => (
   <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
      <circle cx="16" cy="16" r="10" fill="#48BB78" />
      <path d="M16 6 C22 6, 26 10, 26 16" fill="none" stroke="#2F855A" strokeWidth="2" />
      <path d="M16 26 C10 26, 6 22, 6 16" fill="none" stroke="#2F855A" strokeWidth="2" />
      <path d="M6 16 L26 16" stroke="#276749" strokeWidth="1" opacity="0.5" />
      <path d="M16 6 L16 26" stroke="#276749" strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="16" r="10" fill="url(#grad1)" opacity="0.3" />
      <defs>
         <radialGradient id="grad1" cx="30%" cy="30%" r="50%">
            <stop offset="0%" style={{ stopColor: "white", stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: "black", stopOpacity: 0 }} />
         </radialGradient>
      </defs>
   </svg>
);

export const PartnerNetwork: React.FC = () => {
   const [partners] = useState<IndianLogisticsPartner[]>(indianLogisticsService.getPartners() || []);
   const [searchQuery, setSearchQuery] = useState('');
   const [filterMode, setFilterMode] = useState<string>('all');
   const [filterTier, setFilterTier] = useState<string>('all');
   const [showFilters, setShowFilters] = useState(false);
   const [selectedPartner, setSelectedPartner] = useState<IndianLogisticsPartner | null>(null);

   // Calculate stats
   const stats = {
      total: partners.length,
      strategic: partners.filter(p => p.tier === 'STRATEGIC').length,
      avgOTD: Math.round(partners.reduce((sum, p) => sum + p.performance.otd, 0) / partners.length * 10) / 10,
      complianceRisks: partners.filter(p => p.riskProfile.level === 'medium' || p.riskProfile.level === 'high').length
   };

   // Filter partners
   const filteredPartners = partners.filter(partner => {
      const matchesSearch = !searchQuery ||
         partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         partner.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode = filterMode === 'all' || partner.modes?.includes(filterMode);
      const matchesTier = filterTier === 'all' || partner.tier === filterTier;

      return matchesSearch && matchesMode && matchesTier;
   });

   const getTierLabel = (tier: string) => {
      switch (tier) {
         case 'STRATEGIC': return 'Strategic';
         case 'CORE': return 'Core';
         case 'TRANSACTIONAL': return 'Transactional';
         default: return tier;
      }
   };

   const getRiskLabel = (level: string) => {
      switch (level) {
         case 'low': return 'Low Risk';
         case 'medium': return 'Medium Risk';
         case 'high': return 'High Risk';
         default: return level;
      }
   };

   const getStatusBadge = (status: string) => {
      switch (status) {
         case 'Active':
            return <span className="px-2 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded">ACTIVE</span>;
         case 'Onboarding':
            return <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">ONBOARDING</span>;
         case 'Suspended':
            return <span className="px-2 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded">SUSPENDED</span>;
         default:
            return <span className="px-2 py-0.5 text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200 rounded">{status?.toUpperCase() || 'N/A'}</span>;
      }
   };

   return (
      <div className="h-full flex flex-col font-sans p-8 overflow-hidden bg-[#F8F9FA]">

         {/* Header */}
         <div className="flex justify-between items-start mb-6 flex-shrink-0">
            <div>
               <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Logistics Partner Network</h2>
               <p className="text-sm text-gray-600 mt-1">Manage Indian logistics partners and carrier relationships</p>
            </div>
         </div>

         {/* Stats Dashboard */}
         <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
            <div className="bg-[#2C3E50] p-4 flex items-center justify-between rounded shadow-md group border border-gray-700">
               <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Partners</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
               </div>
               <div className="w-16 h-16 text-green-400 opacity-80 group-hover:scale-110 transition-transform">
                  <GeoUsers className="w-full h-full" />
               </div>
            </div>

            <div className="bg-[#2C3E50] p-4 flex items-center justify-between rounded shadow-md group border border-gray-700">
               <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Strategic Partners</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.strategic}</p>
               </div>
               <div className="w-16 h-16 text-green-400 opacity-80 group-hover:scale-110 transition-transform">
                  <GeoStar className="w-full h-full" />
               </div>
            </div>

            <div className="bg-[#2C3E50] p-4 flex items-center justify-between rounded shadow-md group border border-gray-700">
               <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Network OTD</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.avgOTD}%</p>
               </div>
               <div className="w-16 h-16 text-green-400 opacity-80 group-hover:scale-110 transition-transform">
                  <GeoTarget className="w-full h-full" />
               </div>
            </div>

            <div className="bg-[#2C3E50] p-4 flex items-center justify-between rounded shadow-md group border border-gray-700">
               <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Compliance Risks</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.complianceRisks}</p>
               </div>
               <div className="w-16 h-16 text-red-400 opacity-80 group-hover:scale-110 transition-transform">
                  <GeoAlert className="w-full h-full" color="currentColor" />
               </div>
            </div>
         </div>

         {/* Search and Filters */}
         <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            <div className="relative flex-1">
               <input
                  type="text"
                  placeholder="Search partners by name or GST number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 text-sm rounded shadow-sm"
               />
               <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
               {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                     <X size={16} />
                  </button>
               )}
            </div>

            <button
               onClick={() => setShowFilters(!showFilters)}
               className={`px-4 py-2 border text-sm font-medium rounded shadow-sm ${showFilters ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
            >
               <Filter size={14} className="inline mr-2" />
               Filters
            </button>
         </div>

         {/* Filter Panel */}
         {showFilters && (
            <div className="bg-white border border-gray-200 p-4 mb-6 flex-shrink-0 rounded shadow-sm animate-in fade-in slide-in-from-top-2">
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="text-xs font-medium text-gray-700 uppercase block mb-2">Mode</label>
                     <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 rounded"
                     >
                        <option value="all">All Modes</option>
                        <option value="Surface">Surface</option>
                        <option value="Express">Express</option>
                        <option value="Air">Air</option>
                     </select>
                  </div>

                  <div>
                     <label className="text-xs font-medium text-gray-700 uppercase block mb-2">Tier</label>
                     <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 rounded"
                     >
                        <option value="all">All Tiers</option>
                        <option value="STRATEGIC">Strategic</option>
                        <option value="CORE">Core</option>
                        <option value="TRANSACTIONAL">Transactional</option>
                     </select>
                  </div>

                  <div className="flex items-end">
                     <button
                        onClick={() => {
                           setFilterMode('all');
                           setFilterTier('all');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm rounded"
                     >
                        Clear Filters
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Partners Table */}
         <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full">
               <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Partner Name</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tier</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Mode / Region</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Integration</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Performance</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Risk Profile</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                  {filteredPartners.map(partner => (
                     <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                           <div className="text-xs text-gray-500 font-mono mt-0.5">GST: {partner.gstNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{getTierLabel(partner.tier)}</td>
                        <td className="px-6 py-4">
                           <div className="text-sm text-gray-700">{partner.modes?.join(', ') || 'N/A'}</div>
                           <div className="text-xs text-gray-500 mt-0.5">{partner.region}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm text-gray-700">{partner.integration?.type || 'N/A'}</div>
                           <div className="text-xs text-gray-500 mt-0.5">Sync: {partner.integration?.lastSync || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-gray-900">{partner.performance.otd}% OTD</div>
                           <div className="text-xs text-gray-500 mt-0.5">Score: {partner.performance.score}/100</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{getRiskLabel(partner.riskProfile.level)}</td>
                        <td className="px-6 py-4">{getStatusBadge(partner.status)}</td>
                        <td className="px-6 py-4 text-right">
                           <button
                              onClick={() => setSelectedPartner(partner)}
                              className="text-sm text-gray-900 hover:text-gray-700 font-medium"
                           >
                              View Details
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {/* Empty State */}
            {filteredPartners.length === 0 && (
               <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No partners found matching your search.</p>
               </div>
            )}
         </div>

         {/* PARTNER DETAIL MODAL (PREMIUM 3D REPORT CARD) */}
         {selectedPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">

                  {/* HERO HEADER */}
                  <div className="relative h-48 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden rounded-t-2xl flex-shrink-0">
                     {/* 3D Background Elements */}
                     <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                        <GeometricBox size={300} className="text-white" />
                     </div>
                     <div className="absolute bottom-0 left-0 p-6 opacity-5 transform -translate-x-1/4 translate-y-1/4">
                        <GeoUsers size={200} className="text-white" />
                     </div>

                     <div className="absolute inset-0 flex items-end p-8">
                        <div className="flex items-end gap-6 w-full">
                           {/* Floating Avatar Card */}
                           <div className="h-24 w-24 bg-white rounded-xl shadow-xl flex items-center justify-center text-4xl font-bold text-slate-900 relative -mb-12 border-4 border-white">
                              {selectedPartner.name.substring(0, 2).toUpperCase()}
                           </div>

                           <div className="flex-1 pb-1">
                              <h2 className="text-3xl font-bold text-white tracking-tight">{selectedPartner.name}</h2>
                              <div className="flex items-center gap-4 mt-2">
                                 <span className="text-white/80 font-mono text-sm tracking-wide bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                    GST: {selectedPartner.gstNumber}
                                 </span>
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedPartner.connectivity.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-500/20 text-slate-300'
                                    }`}>
                                    {selectedPartner.connectivity.status}
                                 </span>
                              </div>
                           </div>

                           <button
                              onClick={() => setSelectedPartner(null)}
                              className="mb-auto p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                           >
                              <X size={24} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* BODY CONTENT */}
                  <div className="p-8 mt-6 space-y-8">

                     {/* 1. METRICS GRID (Premium Cards) */}
                     <div className="grid grid-cols-4 gap-6">
                        <div className="group p-5 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Partner Tier</p>
                           <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-slate-900">{getTierLabel(selectedPartner.tier)}</p>
                              {selectedPartner.tier === 'STRATEGIC' && <Star size={20} className="text-yellow-400 fill-yellow-400" />}
                           </div>
                        </div>

                        <div className="group p-5 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Performance</p>
                           <div className="flex items-end gap-2">
                              <p className="text-3xl font-bold text-slate-900">{(selectedPartner.performance.customerSatisfaction * 20).toFixed(0)}</p>
                              <p className="text-sm font-medium text-slate-400 mb-1.5">/ 100</p>
                           </div>
                           <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                              <div className="bg-slate-900 h-full rounded-full" style={{ width: `${selectedPartner.performance.customerSatisfaction * 20}%` }} />
                           </div>
                        </div>

                        <div className="group p-5 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">On-Time %</p>
                           <div className="flex items-end gap-2">
                              <p className={`text-3xl font-bold ${selectedPartner.performance.onTimeDelivery > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                                 {selectedPartner.performance.onTimeDelivery}%
                              </p>
                           </div>
                        </div>

                        <div className="group p-5 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Profile</p>
                           <p className={`text-xl font-bold ${selectedPartner.riskProfile.level === 'high' ? 'text-red-600' :
                              selectedPartner.riskProfile.level === 'medium' ? 'text-orange-600' : 'text-green-600'
                              }`}>
                              {getRiskLabel(selectedPartner.riskProfile.level)}
                           </p>
                        </div>
                     </div>

                     {/* 2. INFO SECTIONS */}
                     <div className="grid grid-cols-2 gap-8">
                        {/* LEFT: Operational */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                              <GeoTruck size={24} className="text-slate-400" /> Operational Matrix
                           </h3>

                           <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Service Modes</label>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedPartner.modes?.map(m => (
                                       <span key={m} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wide rounded shadow-sm hover:shadow-md transition-shadow cursor-default">{m}</span>
                                    ))}
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Primary Region</label>
                                 <p className="text-sm font-bold text-slate-800 mt-1">{selectedPartner.region}</p>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Coverage</label>
                                 <p className="text-sm font-bold text-slate-800 mt-1">{selectedPartner.coverage.vehicles.toLocaleString()} Vehicles</p>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Avg Transit</label>
                                 <p className="text-sm font-bold text-slate-800 mt-1">{selectedPartner.majorRoutes[0]?.transitTime || 'N/A'}</p>
                              </div>
                           </div>

                           <div className="mt-6 pt-6 border-t border-slate-200">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Strategic Hubs</label>
                              <div className="flex flex-wrap gap-2">
                                 {['Mumbai', 'Delhi NCR', 'Bangalore'].map(city => (
                                    <span key={city} className="flex items-center text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                       <MapPin size={10} className="mr-1.5 text-blue-500" /> {city}
                                    </span>
                                 ))}
                                 <span className="text-[10px] text-slate-400 flex items-center px-2">+3 more</span>
                              </div>
                           </div>
                        </div>

                        {/* RIGHT: Contact & Compliance */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
                           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                              <GeoPhone size={24} className="text-slate-400" /> Corporate & Compliance
                           </h3>

                           <div className="space-y-4 flex-1">
                              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                 <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                    <GeoPhone size={24} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Key Account Manager</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{selectedPartner.contacts[0]?.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{selectedPartner.contacts[0]?.email || 'N/A'}</p>
                                 </div>
                              </div>

                              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                 <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                                    <GeoGlobe size={24} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Headquarters</p>
                                    <p className="text-sm font-bold text-slate-900">{selectedPartner.headquarters.split(',')[0]}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{selectedPartner.headquarters}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-6">
                              <div className="grid grid-cols-3 gap-2">
                                 <div className="bg-green-50 border border-green-100 p-2 rounded text-center">
                                    <p className="text-[9px] font-bold text-green-700 uppercase">GST</p>
                                    <CheckCircle size={14} className="mx-auto text-green-600 my-1" />
                                    <p className="text-[9px] font-bold text-green-800">Filed</p>
                                 </div>
                                 <div className="bg-green-50 border border-green-100 p-2 rounded text-center">
                                    <p className="text-[9px] font-bold text-green-700 uppercase">Insurance</p>
                                    <CheckCircle size={14} className="mx-auto text-green-600 my-1" />
                                    <p className="text-[9px] font-bold text-green-800">Active</p>
                                 </div>
                                 <div className="bg-blue-50 border border-blue-100 p-2 rounded text-center">
                                    <p className="text-[9px] font-bold text-blue-700 uppercase">Contract</p>
                                    <FileText size={14} className="mx-auto text-blue-600 my-1" />
                                    <p className="text-[9px] font-bold text-blue-800">2025</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* FOOTER */}
                  <div className="p-6 bg-white border-t border-slate-100 rounded-b-2xl flex justify-between items-center sticky bottom-0 z-10 glass-effect">
                     <p className="text-xs text-slate-400 font-medium">
                        Last audited: <span className="text-slate-600 font-bold">2 days ago</span>
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setSelectedPartner(null)}
                           className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                           Close
                        </button>
                        <button
                           onClick={async () => {
                              try {
                                 const response = await fetch('http://localhost:5000/api/generate/pdf', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                       type: 'CARRIER_PROFILE',
                                       id: selectedPartner.id,
                                       carrierName: selectedPartner.name,
                                       tier: selectedPartner.tier,
                                       reportDate: new Date().toLocaleDateString(),
                                       overallGrade: (selectedPartner.performance.customerSatisfaction * 20) >= 90 ? 'A+' : (selectedPartner.performance.customerSatisfaction * 20) >= 80 ? 'A' : 'B',
                                       otdScore: selectedPartner.performance.onTimeDelivery,
                                       damageScore: 99,
                                       billingScore: 92,
                                       totalSpend: 1540200,
                                       totalInvoices: 142
                                    })
                                 });

                                 if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                 } else {
                                    alert('Failed to generate Academic Report');
                                 }
                              } catch (e) {
                                 console.error(e);
                                 alert('Error connecting to Report Engine');
                              }
                           }}
                           className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                        >
                           <FileText size={16} /> Download Academic Report
                        </button>
                     </div>
                  </div>

               </div>
            </div>
         )}
      </div>
   );
};

