import React, { useState, useEffect } from 'react';
import {
   Search, Download, Upload, Filter, Edit2, Clock, X, Cloud,
   CheckCircle, PlayCircle, Trash2, ArrowLeft, FileText, Truck,
   Globe, Shield, IndianRupee, ChevronRight, AlertCircle, Calendar,
   Calculator, MapPin, TrendingUp, Layers, ArrowUpRight, ArrowDownRight,
   MoreHorizontal, Ship, Plane, Box, Lock
} from 'lucide-react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
   ResponsiveContainer, Cell, LineChart, Line, Legend, ComposedChart, Area
} from 'recharts';
import { exportToCSV } from '../utils/exportUtils';
import { crossLinkService } from '../services/crossLinkService';

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoContract = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fillOpacity="0.8" />
      <path d="M14 2v6h6" fillOpacity="0.6" />
      <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="4" width="2" height="2" fill="white" fillOpacity="0.5" />
   </svg>
);

const GeoClock = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.3" />
      <path d="M12 12L12 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="11" y="11" width="2" height="2" fill="white" />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" opacity="0.8" />
      <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.1" />
   </svg>
);

const GeoGlobe = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="12" cy="12" r="6" fillOpacity="0.4" />
      <path d="M2 12h20" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <path d="M12 2v20" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <circle cx="16" cy="8" r="1.5" fill="white" />
      <circle cx="8" cy="16" r="1.5" fill="white" />
   </svg>
);

const GeoCoin = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <ellipse cx="12" cy="6" rx="10" ry="4" fillOpacity="0.8" />
      <path d="M2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6" fillOpacity="0.4" />
      <path d="M12 22V6" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="white" fillOpacity="0.2" />
   </svg>
);

// --- TYPES ---
interface Contract {
   id: string;
   carrier: string;
   refId: string;
   mode: string;
   laneDescription: string;
   contractType: 'Fixed' | 'Index-Linked' | 'Spot Framework' | 'Tiered';
   validFrom: string;
   validTo: string;
   status: 'ACTIVE' | 'EXPIRING' | 'PENDING' | 'ARCHIVED';
   allocationTarget: number; // Committed %
   allocationActual: number; // Actual %
   spendYTD: number;
   paymentTerms: string;
   expiryDays: number;
}

interface RateLine {
   origin: string;
   destination: string;
   equipment: string;
   currency: string;
   baseRate: number;
   marketRate: number; // For benchmarking
   transitTime: string;
   validity: string;
}

interface Accessorial {
   code: string;
   description: string;
   chargeType: string;
   amount: number;
   currency: string;
   category: 'Fuel' | 'Security' | 'Handling' | 'Seasonal';
   logic: 'Fixed' | 'Pass-through' | '% of Freight';
}

// --- MOCK DATA ---

const MOCK_CONTRACTS: Contract[] = [
   {
      id: 'c1',
      carrier: 'TCI Express Limited',
      refId: 'TCI-EXP-2024-001',
      mode: 'Road',
      laneDescription: 'Delhi to Mumbai (Express)',
      contractType: 'Fixed',
      validFrom: '2025-01-01',
      validTo: '2026-12-31',
      status: 'ACTIVE',
      allocationTarget: 45,
      allocationActual: 48,
      spendYTD: 4250000,
      paymentTerms: 'Net 45',
      expiryDays: 405
   },
   {
      id: 'c2',
      carrier: 'Blue Dart Express',
      refId: 'BD-AIR-2025-B',
      mode: 'Air',
      laneDescription: 'Pan-India Air Express',
      contractType: 'Index-Linked',
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      status: 'EXPIRING',
      allocationTarget: 30,
      allocationActual: 22,
      spendYTD: 1850000,
      paymentTerms: 'Net 30',
      expiryDays: 35
   },
   {
      id: 'c3',
      carrier: 'Delhivery',
      refId: 'DLV-LTL-25',
      mode: 'Road',
      laneDescription: 'North India LTL Network',
      contractType: 'Tiered',
      validFrom: '2025-01-01',
      validTo: '2026-06-30',
      status: 'ACTIVE',
      allocationTarget: 100,
      allocationActual: 100,
      spendYTD: 890000,
      paymentTerms: 'Net 60',
      expiryDays: 215
   },
   {
      id: 'c4',
      carrier: 'VRL Logistics',
      refId: 'VRL-FTL-SPOT-Q4',
      mode: 'Road',
      laneDescription: 'Mumbai-Bangalore FTL (Spot)',
      contractType: 'Spot Framework',
      validFrom: '2025-10-01',
      validTo: '2025-12-31',
      status: 'EXPIRING',
      allocationTarget: 0,
      allocationActual: 15,
      spendYTD: 450000,
      paymentTerms: 'Net 15',
      expiryDays: 35
   },
   {
      id: 'c5',
      carrier: 'Rivigo',
      refId: 'RVG-SOUTH-25',
      mode: 'Road',
      laneDescription: 'Chennai to Bangalore Corridor',
      contractType: 'Fixed',
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      status: 'EXPIRING',
      allocationTarget: 25,
      allocationActual: 28,
      spendYTD: 620000,
      paymentTerms: 'Net 30',
      expiryDays: 35
   },
   {
      id: 'c6',
      carrier: 'Gati Limited',
      refId: 'GATI-WEST-02',
      mode: 'Road',
      laneDescription: 'Western India FTL Network',
      contractType: 'Index-Linked',
      validFrom: '2025-06-01',
      validTo: '2027-05-31',
      status: 'ACTIVE',
      allocationTarget: 60,
      allocationActual: 55,
      spendYTD: 1200000,
      paymentTerms: 'Net 45',
      expiryDays: 540
   },
   {
      id: 'c7',
      carrier: 'Professional Couriers',
      refId: 'PC-EAST-26',
      mode: 'Road',
      laneDescription: 'Kolkata to Delhi Express',
      contractType: 'Fixed',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      status: 'PENDING',
      allocationTarget: 20,
      allocationActual: 0,
      spendYTD: 0,
      paymentTerms: 'Net 45',
      expiryDays: 765
   }
];

const MOCK_RATE_LINES: RateLine[] = [
   { origin: 'Delhi', destination: 'Mumbai', equipment: '32 FT MXL', currency: 'INR', baseRate: 45000.00, marketRate: 48000.00, transitTime: '36 Hrs', validity: '2025' },
   { origin: 'Mumbai', destination: 'Bangalore', equipment: '32 FT MXL', currency: 'INR', baseRate: 38000.00, marketRate: 41000.00, transitTime: '24 Hrs', validity: '2025' },
   { origin: 'Chennai', destination: 'Kolkata', equipment: '19 FT SXL', currency: 'INR', baseRate: 52000.00, marketRate: 55000.00, transitTime: '48 Hrs', validity: '2025' },
   { origin: 'Pune', destination: 'Ahmedabad', equipment: '32 FT MXL', currency: 'INR', baseRate: 28000.00, marketRate: 30000.00, transitTime: '18 Hrs', validity: '2025' },
   { origin: 'Delhi', destination: 'Bangalore', equipment: '32 FT MXL', currency: 'INR', baseRate: 58000.00, marketRate: 62000.00, transitTime: '48 Hrs', validity: '2025' },
];

const MOCK_ACCESSORIALS: Accessorial[] = [
   { code: 'FSC', description: 'Fuel Surcharge', chargeType: 'Per Trip', amount: 2500.00, currency: 'INR', category: 'Fuel', logic: 'Pass-through' },
   { code: 'DET', description: 'Detention Charges', chargeType: 'Per Day', amount: 1500.00, currency: 'INR', category: 'Delay', logic: 'Fixed' },
   { code: 'ODA', description: 'Out of Delivery Area', chargeType: 'Per Shipment', amount: 2000.00, currency: 'INR', category: 'Location', logic: 'Fixed' },
   { code: 'L/U', description: 'Loading/Unloading Charges', chargeType: 'Per Ton', amount: 200.00, currency: 'INR', category: 'Handling', logic: 'Pass-through' },
   { code: 'TOLL', description: 'Toll Charges', chargeType: 'Actual', amount: 0.00, currency: 'INR', category: 'Route', logic: 'Pass-through' },
];

const BENCHMARK_DATA = [
   { month: 'Jan', contract: 3250, market: 3100, spot: 3600 },
   { month: 'Feb', contract: 3250, market: 3300, spot: 3800 },
   { month: 'Mar', contract: 3250, market: 3450, spot: 4100 },
   { month: 'Apr', contract: 3250, market: 3400, spot: 3900 },
   { month: 'May', contract: 3350, market: 3200, spot: 3500 }, // GRI applied
   { month: 'Jun', contract: 3350, market: 3100, spot: 3400 },
];

interface RateCardsProps {
   onViewContract?: (contractId: string) => void;
}

export const RateCards: React.FC<RateCardsProps> = ({ onViewContract }) => {
   const [contracts, setContracts] = useState<Contract[]>([]);
   const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
   const [loading, setLoading] = useState(true);

   // Fetch contracts from PostgreSQL on mount
   useEffect(() => {
      const fetchContracts = async () => {
         try {
            // Fetch from new database-backed API endpoint
            const res = await fetch('http://localhost:8000/api/rate-cards');
            if (res.ok) {
               const data = await res.json();
               // Map API response to local Contract type
               const mapped = data.rateCards?.map((c: any) => ({
                  id: c.id,
                  carrier: c.carrier,
                  refId: c.contractRef || c.id,
                  mode: c.containerType?.includes('Air') ? 'Air' : c.containerType?.includes('Sea') ? 'Sea' : 'Road',
                  laneDescription: `${c.origin} to ${c.destination}`,
                  contractType: 'Fixed' as const,
                  validFrom: c.validFrom,
                  validTo: c.validTo,
                  status: (c.status || 'ACTIVE').toUpperCase() as any,
                  allocationTarget: 50,
                  allocationActual: Math.floor(Math.random() * 30) + 40,
                  spendYTD: Math.floor(Math.random() * 5000000) + 500000,
                  paymentTerms: 'Net 30',
                  expiryDays: c.validTo ? Math.ceil((new Date(c.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 365
               })) || [];
               setContracts(mapped);
            }
         } catch (e) {
            console.error('Failed to fetch rate cards from API:', e);
            // No mock fallback - just show empty state
            setContracts([]);
         } finally {
            setLoading(false);
         }
      };
      fetchContracts();
   }, []);

   // Rate Calculator State
   const [calcOpen, setCalcOpen] = useState(false);
   const [calcOrigin, setCalcOrigin] = useState('');
   const [calcDest, setCalcDest] = useState('');
   const [calcResult, setCalcResult] = useState<RateLine | null>(null);
   const [isCalculating, setIsCalculating] = useState(false);

   // Import State
   const [showImport, setShowImport] = useState(false);
   const [importStep, setImportStep] = useState(0);

   // Filter State
   const [searchQuery, setSearchQuery] = useState('');

   // --- ACTIONS ---

   const handleCalculate = () => {
      if (!calcOrigin || !calcDest) return;
      setIsCalculating(true);
      // Simulate Search
      setTimeout(() => {
         const found = MOCK_RATE_LINES.find(l =>
            l.origin.toLowerCase().includes(calcOrigin.toLowerCase()) &&
            l.destination.toLowerCase().includes(calcDest.toLowerCase())
         );
         setCalcResult(found || null);
         setIsCalculating(false);
      }, 1200);
   };

   const handleImport = () => {
      let step = 0;
      const interval = setInterval(() => {
         step++;
         setImportStep(step);
         if (step >= 3) {
            clearInterval(interval);
            setTimeout(() => {
               setShowImport(false);
               setImportStep(0);
               // Add dummy contract to UI
               const newC: Contract = {
                  id: `new-${Date.now()}`,
                  carrier: 'CMA CGM',
                  refId: 'CMA-NEW-2026',
                  mode: 'Sea',
                  laneDescription: 'Nhava Sheva to Jebel Ali',
                  contractType: 'Index-Linked',
                  validFrom: '2026-01-01',
                  validTo: '2026-12-31',
                  status: 'PENDING',
                  allocationTarget: 100,
                  allocationActual: 0,
                  spendYTD: 0,
                  paymentTerms: 'Net 60',
                  expiryDays: 365
               };
               setContracts([newC, ...contracts]);
               alert("Contract Uploaded and Extracted Successfully!");
            }, 500);
         }
      }, 800);
   };

   const handleExport = () => {
      const data = contracts.map(c => ({
         Carrier: c.carrier,
         Reference: c.refId,
         Traffic_Mode: c.mode,
         Lane: c.laneDescription,
         Validity: `${c.validFrom} to ${c.validTo}`,
         Status: c.status
      }));
      exportToCSV(data, 'Active_Contracts_Rates');
   };

   // --- RENDER HELPERS ---

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
         case 'EXPIRING': return 'bg-red-100 text-red-800 border-red-200';
         case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
         case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200';
         default: return 'bg-gray-100 text-gray-800';
      }
   };

   const filteredContracts = contracts.filter(c =>
      c.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.laneDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.refId.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
         {/* HEADER */}
         <div className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center shadow-sm z-10">
            <div>
               <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contract Rate Repository</h1>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                     SYSTEM RECORD
                  </span>
               </div>
               <p className="text-sm text-gray-500 mt-1">Centralized digital library for all negotiated logistics rate cards and agreements</p>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl text-sm font-medium"
               >
                  <Upload size={18} />
                  Import Rate Sheet
               </button>
               <button
                  onClick={() => setCalcOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm font-medium"
               >
                  <Calculator size={18} />
                  Rate Calculator
               </button>
            </div>
         </div>

         {/* MAIN CONTENT */}
         <div className="flex-1 overflow-auto p-6">

            {/* KPI OVERVIEW */}
            <div className="grid grid-cols-4 gap-6 mb-8">
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500 opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start relative z-10 mb-4">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Contracts</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{contracts.length}</h3>
                     </div>
                     <div className="w-12 h-12 text-blue-600 opacity-90">
                        <GeoContract className="w-full h-full" />
                     </div>
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
                     <ArrowUpRight size={14} className="mr-1" />
                     +2 this month
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500 opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start relative z-10 mb-4">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiring Soon</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">
                           {contracts.filter(c => c.status === 'EXPIRING').length}
                        </h3>
                     </div>
                     <div className="w-12 h-12 text-orange-600 opacity-90">
                        <GeoClock className="w-full h-full" />
                     </div>
                  </div>
                  <div className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                     <AlertCircle size={14} className="mr-1" />
                     Action Required
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500 opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start relative z-10 mb-4">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Global Coverage</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">12</h3>
                     </div>
                     <div className="w-12 h-12 text-purple-600 opacity-90">
                        <GeoGlobe className="w-full h-full" />
                     </div>
                  </div>
                  <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded">
                     Countries Covered
                  </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500 opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start relative z-10 mb-4">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Annual Spend</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">₹8.9Cr</h3>
                     </div>
                     <div className="w-12 h-12 text-emerald-600 opacity-90">
                        <GeoCoin className="w-full h-full" />
                     </div>
                  </div>
                  <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded">
                     Under Contract
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-12 gap-6 h-[600px]">
               {/* CONTRACT LIST */}
               <div className="col-span-8 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                     <div className="relative w-80">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                           type="text"
                           placeholder="Search contracts..."
                           className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                        />
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                           <Filter size={18} />
                        </button>
                        <button onClick={handleExport} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                           <Download size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="overflow-auto flex-1">
                     <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                           <tr>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Carrier & ID</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Lane / Scope</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Validity</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredContracts.map(contract => (
                              <tr key={contract.id} className="hover:bg-blue-50 transition-colors group">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
                                          {contract.carrier.substring(0, 2).toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-gray-900">{contract.carrier}</p>
                                          <p className="text-xs text-gray-500 font-mono">{contract.refId}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-700">{contract.laneDescription}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                       {contract.mode === 'Road' && <Truck size={12} className="text-gray-400" />}
                                       {contract.mode === 'Air' && <Plane size={12} className="text-gray-400" />}
                                       {contract.mode === 'Sea' && <Ship size={12} className="text-gray-400" />}
                                       <span className="text-xs text-gray-500">{contract.mode}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${contract.contractType === 'Fixed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                       contract.contractType === 'Index-Linked' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                          'bg-gray-50 text-gray-700 border-gray-200'
                                       }`}>
                                       {contract.contractType}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="text-xs text-gray-600">
                                       <p>From: {contract.validFrom}</p>
                                       <p>To: {contract.validTo}</p>
                                    </div>
                                    {contract.expiryDays < 90 && (
                                       <span className="text-[10px] font-bold text-red-600 mt-1 block">
                                          Expiring in {contract.expiryDays} days
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(contract.status)}`}>
                                       {contract.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <button
                                       onClick={() => setSelectedContract(contract)}
                                       className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-white"
                                    >
                                       <ChevronRight size={20} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* DETAILS & BENCHMARKING (Side Panel) */}
               <div className="col-span-4 flex flex-col gap-6">
                  {/* Selected Contract Quick View */}
                  {selectedContract ? (
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="mb-6 pb-6 border-b border-gray-100">
                           <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{selectedContract.carrier}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(selectedContract.status)}`}>
                                 {selectedContract.status}
                              </span>
                           </div>
                           <p className="text-sm text-gray-500 break-all font-mono">{selectedContract.refId}</p>

                           <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                 <p className="text-xs text-gray-500 uppercase mb-1">Spend YTD</p>
                                 <p className="text-lg font-bold text-gray-900">₹{(selectedContract.spendYTD / 100000).toFixed(2)}L</p>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                 <p className="text-xs text-gray-500 uppercase mb-1">Commitment</p>
                                 <div className="flex items-center gap-2">
                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                       <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={selectedContract.allocationActual >= selectedContract.allocationTarget ? "#10B981" : "#F59E0B"} strokeWidth="3" strokeDasharray={`${selectedContract.allocationActual}, 100`} />
                                       </svg>
                                       <span className="absolute text-[10px] font-bold">{selectedContract.allocationActual}%</span>
                                    </div>
                                    <span className="text-xs text-gray-500">of {selectedContract.allocationTarget}% Target</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Benchmarking Chart - Academic Style */}
                        <div className="flex-1">
                           <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-black/10 pb-3">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                 <path d="M4 18L10 12L14 16L20 8" stroke="#0F62FE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                 <path d="M16 8H20V12" stroke="#0F62FE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Rate Benchmarking Analysis
                           </h4>
                           <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={BENCHMARK_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                                    <XAxis
                                       dataKey="month"
                                       tick={{ fontSize: 10, fill: '#161616', fontWeight: 600 }}
                                       axisLine={{ stroke: '#161616', strokeWidth: 1 }}
                                       tickLine={false}
                                    />
                                    <YAxis
                                       hide
                                       domain={['dataMin - 200', 'dataMax + 200']}
                                    />
                                    <Tooltip
                                       contentStyle={{
                                          borderRadius: '8px',
                                          border: '1px solid #161616',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                          background: '#FFFFFF',
                                          padding: '12px'
                                       }}
                                       labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#161616' }}
                                       itemStyle={{ fontSize: '11px', color: '#161616' }}
                                       formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                                    />
                                    <Legend
                                       wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                       iconType="square"
                                       iconSize={8}
                                    />
                                    {/* Market Average - Dashed Gray */}
                                    <Line
                                       type="monotone"
                                       dataKey="market"
                                       stroke="#9CA3AF"
                                       strokeWidth={1.5}
                                       strokeDasharray="6 4"
                                       dot={false}
                                       name="Market Index"
                                    />
                                    {/* Spot Rate - Red Line */}
                                    <Line
                                       type="monotone"
                                       dataKey="spot"
                                       stroke="#DC2626"
                                       strokeWidth={2}
                                       dot={false}
                                       name="Spot Rate"
                                    />
                                    {/* Your Contract Rate - IBM Blue with dots */}
                                    <Line
                                       type="monotone"
                                       dataKey="contract"
                                       stroke="#0F62FE"
                                       strokeWidth={2.5}
                                       dot={{ r: 4, fill: '#0F62FE', stroke: '#FFFFFF', strokeWidth: 2 }}
                                       activeDot={{ r: 6, fill: '#0F62FE', stroke: '#FFFFFF', strokeWidth: 2 }}
                                       name="Contract Rate"
                                    />
                                 </LineChart>
                              </ResponsiveContainer>
                           </div>

                           {/* Academic Insight Box */}
                           <div className="mt-4 p-3 bg-[#FEF3C7] border-l-4 border-[#F59E0B] text-xs">
                              <div className="flex items-start gap-2">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="#92400E">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                    <path d="M2 17L12 22L22 17" stroke="#92400E" strokeWidth="2" fill="none" />
                                    <path d="M2 12L12 17L22 12" stroke="#92400E" strokeWidth="2" fill="none" />
                                 </svg>
                                 <div>
                                    <p className="font-bold text-[#92400E] mb-0.5">Market Intelligence</p>
                                    <p className="text-[#78350F]">Current market index is trending <span className="font-bold">5% below</span> your contracted rate. Consider renegotiation at renewal.</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                           <button
                              onClick={() => onViewContract && onViewContract(selectedContract.id)}
                              className="flex-1 px-3 py-2 bg-[#0F62FE] text-white text-sm font-bold rounded hover:bg-[#0043CE] transition-colors"
                           >
                              View Full Contract
                           </button>
                           <button className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
                              <MoreHorizontal size={18} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="bg-gray-100 rounded-xl border border-gray-200 border-dashed h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">Select a contract to view details & benchmarking analytics</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* SLIDE-OVERS / MODALS */}

         {/* Rate Calculator Modal */}
         {calcOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
               <div className="w-[400px] bg-white h-full shadow-2xl p-6 overflow-auto animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold">Quick Rate Check</h2>
                     <button onClick={() => { setCalcOpen(false); setCalcResult(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                        <div className="relative">
                           <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                           <input type="text" value={calcOrigin} onChange={e => setCalcOrigin(e.target.value)} placeholder="e.g. Delhi" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <div className="relative">
                           <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                           <input type="text" value={calcDest} onChange={e => setCalcDest(e.target.value)} placeholder="e.g. Mumbai" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                     </div>

                     <div className="pt-2">
                        <button onClick={handleCalculate} disabled={isCalculating} className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                           {isCalculating ? 'Checking Repository...' : 'Get Contracted Rate'}
                        </button>
                     </div>

                     {calcResult && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in zoom-in-95">
                           <div className="flex items-center gap-2 mb-2 text-green-800 font-bold">
                              <CheckCircle size={18} /> Rate Found
                           </div>
                           <div className="text-3xl font-bold text-gray-900 mb-1">₹{calcResult.baseRate.toLocaleString()}</div>
                           <p className="text-xs text-gray-500 mb-3">Base Freight • {calcResult.equipment}</p>

                           <div className="text-sm space-y-1 text-gray-700">
                              <div className="flex justify-between">
                                 <span>Validity:</span>
                                 <span className="font-medium">{calcResult.validity}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span>Transit:</span>
                                 <span className="font-medium">{calcResult.transitTime}</span>
                              </div>
                           </div>
                        </div>
                     )}

                     {!calcResult && !isCalculating && calcOrigin && calcDest && (
                        <div className="mt-4 text-center">
                           <p className="text-sm text-gray-500">Enter cities to check valid rates</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Import Modal */}
         {showImport && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Cloud size={32} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Import Rate Sheet</h2>
                  <p className="text-gray-500 mb-6 text-sm">Upload your carrier rate card (Excel/PDF). Our AI will extract lanes, rates, and accessorials automatically.</p>

                  {importStep === 0 && (
                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={handleImport}>
                        <Upload size={32} className="text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-blue-600">Click to Browse</p>
                        <p className="text-xs text-gray-400 mt-1">or drag and drop here</p>
                     </div>
                  )}

                  {importStep > 0 && (
                     <div className="py-8">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                           <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importStep * 33}%` }}></div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                           {importStep === 1 && 'Scanning Document Structure...'}
                           {importStep === 2 && 'Extracting Rate Tables...'}
                           {importStep === 3 && 'Validating Locations...'}
                        </p>
                     </div>
                  )}

                  <button onClick={() => setShowImport(false)} className="mt-6 text-sm text-gray-500 hover:text-gray-800">
                     Cancel
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};
