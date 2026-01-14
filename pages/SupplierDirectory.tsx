import React, { useState } from 'react';
import { IndianSupplier, IndianSupplierService } from '../services/supplierService';
import { SupplierProfile } from './SupplierProfile';
import { crossLinkService } from '../services/crossLinkService';
import {
    Search, Filter, TrendingUp, TrendingDown, MapPin, Phone, Mail,
    Building2, IndianRupee, Package, Truck, Award, Clock, Bell,
    ChevronRight, Grid, List, Download, Plus, FileText, BarChart3
} from 'lucide-react';

export const SupplierDirectory: React.FC = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'surface' | 'express' | 'air' | 'multimodal'>('all');
    const [filterRegion, setFilterRegion] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'onTime' | 'credit'>('name');

    const suppliers = IndianSupplierService.getAllSuppliers();

    // Filter suppliers
    let filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || s.type === filterType;
        const matchesRegion = filterRegion === 'all' ||
            s.coverage.regions.some(r => r.toLowerCase().includes(filterRegion.toLowerCase())) ||
            s.coverage.strongIn.some(c => c.toLowerCase().includes(filterRegion.toLowerCase()));

        return matchesSearch && matchesType && matchesRegion;
    });

    // Sort suppliers
    filteredSuppliers = filteredSuppliers.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'onTime') return b.performance.onTimeDelivery - a.performance.onTimeDelivery;
        if (sortBy === 'credit') return b.financial.creditLimit - a.financial.creditLimit;
        return 0;
    });

    // Get all notifications
    const allNotifications = IndianSupplierService.getAllNotifications(true);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Supplier Directory</h1>
                        <p className="text-slate-600">Manage and monitor all logistics suppliers</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                            <Plus size={20} />
                            Add Supplier
                        </button>
                        <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-300">
                            <Download size={20} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Total Suppliers</span>
                            <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{suppliers.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Active Contracts</span>
                            <Package className="text-green-600" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {suppliers.filter(s => s.status === 'active').length}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Total Credit Limit</span>
                            <IndianRupee className="text-purple-600" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            ₹{(suppliers.reduce((sum, s) => sum + s.financial.creditLimit, 0) / 10000000).toFixed(1)}Cr
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Unread Messages</span>
                            <Bell className="text-red-600" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{allNotifications.length}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="grid grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search suppliers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="surface">Surface</option>
                                <option value="express">Express</option>
                                <option value="air">Air</option>
                                <option value="multimodal">Multimodal</option>
                            </select>
                        </div>

                        {/* Region Filter */}
                        <div>
                            <select
                                value={filterRegion}
                                onChange={(e) => setFilterRegion(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Regions</option>
                                <option value="north">North India</option>
                                <option value="south">South India</option>
                                <option value="east">East India</option>
                                <option value="west">West India</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">Name</option>
                                <option value="onTime">On-Time %</option>
                                <option value="credit">Credit Limit</option>
                            </select>
                            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="mb-4 text-sm text-slate-600">
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 gap-6">
                    {filteredSuppliers.map(supplier => {
                        const unreadCount = supplier.notifications.filter(n => !n.read).length;
                        return (
                            <div
                                key={supplier.id}
                                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedSupplier(supplier.id)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-4xl">{supplier.logo}</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{supplier.name}</h3>
                                            <p className="text-sm text-slate-600">{supplier.fullName}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${supplier.type === 'surface' ? 'bg-blue-100 text-blue-800' :
                                                    supplier.type === 'express' ? 'bg-green-100 text-green-800' :
                                                        supplier.type === 'air' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {supplier.type.toUpperCase()}
                                                </span>
                                                {supplier.stockListed && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                                                        LISTED
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                            <Bell size={12} />
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <div className="text-xs text-green-700 mb-1">On-Time</div>
                                        <div className="text-lg font-bold text-green-900">{supplier.performance.onTimeDelivery}%</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="text-xs text-blue-700 mb-1">Credit</div>
                                        <div className="text-lg font-bold text-blue-900">₹{(supplier.financial.creditLimit / 100000).toFixed(0)}L</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3">
                                        <div className="text-xs text-purple-700 mb-1">Rating</div>
                                        <div className="text-lg font-bold text-purple-900">{supplier.performance.customerSatisfaction}/5</div>
                                    </div>
                                </div>

                                {/* Coverage */}
                                <div className="mb-4">
                                    <div className="text-xs text-slate-600 mb-1">Strong In:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {supplier.coverage.strongIn.slice(0, 3).map((city, idx) => (
                                            <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                                {city}
                                            </span>
                                        ))}
                                        {supplier.coverage.strongIn.length > 3 && (
                                            <span className="text-xs text-slate-500">
                                                +{supplier.coverage.strongIn.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Cross-Links */}
                                <div className="border-t pt-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `/contracts?vendor=${supplier.id}`;
                                            }}
                                            className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-1">
                                                <FileText size={14} />
                                                Contracts
                                            </span>
                                            <span className="bg-blue-200 px-2 py-0.5 rounded-full">
                                                {crossLinkService.getSupplierContractCount(supplier.id)}
                                            </span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `/carrier-scorecard?vendor=${supplier.id}`;
                                            }}
                                            className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg font-bold hover:bg-green-100 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-1">
                                                <BarChart3 size={14} />
                                                CPS Score
                                            </span>
                                            <span className="bg-green-200 px-2 py-0.5 rounded-full">
                                                {supplier.performance.onTimeDelivery >= 95 ? '96+' : '85+'}
                                            </span>
                                        </button>
                                    </div>
                                    <button className="w-full text-blue-600 font-bold flex items-center justify-center gap-1 hover:gap-2 transition-all text-sm">
                                        View Full Profile
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-left text-sm font-bold text-slate-700">
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Coverage</th>
                                <th className="p-4">On-Time %</th>
                                <th className="p-4">Credit Limit</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map(supplier => {
                                const unreadCount = supplier.notifications.filter(n => !n.read).length;
                                return (
                                    <tr
                                        key={supplier.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => setSelectedSupplier(supplier.id)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{supplier.logo}</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{supplier.name}</div>
                                                    <div className="text-xs text-slate-600">{supplier.headquarters}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${supplier.type === 'surface' ? 'bg-blue-100 text-blue-800' :
                                                supplier.type === 'express' ? 'bg-green-100 text-green-800' :
                                                    supplier.type === 'air' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-orange-100 text-orange-800'
                                                }`}>
                                                {supplier.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700">{supplier.coverage.pinCodes} PINs</div>
                                            <div className="text-xs text-slate-500">{supplier.coverage.branches}+ branches</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-green-600">{supplier.performance.onTimeDelivery}%</div>
                                                {supplier.performance.onTimeDelivery >= 95 && <TrendingUp size={14} className="text-green-600" />}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-slate-900">
                                                ₹{(supplier.financial.creditLimit / 100000).toFixed(1)}L
                                            </div>
                                            <div className="text-xs text-slate-500">{supplier.financial.paymentTerms}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Award size={14} className="text-yellow-500" />
                                                <span className="text-sm font-bold text-slate-900">{supplier.performance.customerSatisfaction}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-600">{supplier.contacts[0].name}</div>
                                            <div className="text-xs text-slate-500">{supplier.contacts[0].phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {unreadCount > 0 && (
                                                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                                <ChevronRight size={20} className="text-slate-400" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {filteredSuppliers.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                    <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No suppliers found</h3>
                    <p className="text-slate-600 mb-4">Try adjusting your filters or search query</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterType('all');
                            setFilterRegion('all');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Supplier Profile Modal */}
            {selectedSupplier && (
                <SupplierProfile
                    supplierId={selectedSupplier}
                    onClose={() => setSelectedSupplier(null)}
                />
            )}
        </div>
    );
};
