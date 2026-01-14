// Master Data Management Page
// Complete CRUD interface for all master data tables

import React, { useState } from 'react';
import MasterDataService, { VendorMaster, RateMaster, FuelMaster, LocationGrouping, VehicleType } from '../services/masterDataService';
import { Plus, Edit2, Trash2, Check, X, Save } from 'lucide-react';

type MasterType = 'vendor' | 'rate' | 'fuel' | 'location' | 'vehicle';

export const MasterDataManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MasterType>('vendor');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Vendor form state
    const [vendorForm, setVendorForm] = useState<Partial<VendorMaster>>({
        vendorCode: '',
        vendorName: '',
        gstin: '',
        pan: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        status: 'active',
        linkedContracts: [],
        createdBy: 'System Admin'
    });

    // Rate form state
    const [rateForm, setRateForm] = useState<Partial<RateMaster>>({
        contractId: '',
        vendorCode: '',
        deliveryType: 'LTL',
        source: '',
        destination: '',
        rateType: 'per_kg',
        baseRate: 0,
        currency: 'INR',
        validFrom: '',
        validTo: '',
        status: 'active',
        createdBy: 'System Admin'
    });

    const vendors = MasterDataService.getAllVendors();
    const rates = MasterDataService.getAllRates();
    const fuelRates = MasterDataService.getAllFuelRates();
    const locationGroups = MasterDataService.getAllLocationGroups();
    const vehicleTypes = MasterDataService.getAllVehicleTypes();

    const handleCreateVendor = () => {
        const validation = MasterDataService.validateVendor(vendorForm);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        MasterDataService.createVendor(vendorForm as any);
        setShowModal(false);
        resetVendorForm();
        alert('Vendor created successfully!');
    };

    const handleUpdateVendor = () => {
        if (!selectedItem) return;

        MasterDataService.updateVendor(selectedItem.id, {
            ...vendorForm,
            modifiedBy: 'System Admin'
        });
        setShowModal(false);
        resetVendorForm();
        alert('Vendor updated successfully!');
    };

    const handleDeleteVendor = (id: string) => {
        if (confirm('Are you sure you want to delete this vendor?')) {
            MasterDataService.deleteVendor(id);
            alert('Vendor deleted successfully!');
        }
    };

    const handleCreateRate = () => {
        const validation = MasterDataService.validateRate(rateForm);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        MasterDataService.createRate(rateForm as any);
        setShowModal(false);
        resetRateForm();
        alert('Rate created successfully!');
    };

    const resetVendorForm = () => {
        setVendorForm({
            vendorCode: '',
            vendorName: '',
            gstin: '',
            pan: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            status: 'active',
            linkedContracts: [],
            createdBy: 'System Admin'
        });
    };

    const resetRateForm = () => {
        setRateForm({
            contractId: '',
            vendorCode: '',
            deliveryType: 'LTL',
            source: '',
            destination: '',
            rateType: 'per_kg',
            baseRate: 0,
            currency: 'INR',
            validFrom: '',
            validTo: '',
            status: 'active',
            createdBy: 'System Admin'
        });
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedItem(null);
        resetVendorForm();
        resetRateForm();
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setModalMode('edit');
        setSelectedItem(item);
        if (activeTab === 'vendor') {
            setVendorForm(item);
        } else if (activeTab === 'rate') {
            setRateForm(item);
        }
        setShowModal(true);
    };

    return (
        <div className="h-full flex flex-col font-sans p-8 overflow-hidden bg-[#F8F9FA]">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Master Data Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage vendors, rates, fuel, locations, and vehicles</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gray-900 text-white px-4 py-2 font-medium text-sm flex items-center gap-2 hover:bg-gray-800"
                >
                    <Plus size={16} />
                    Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 flex-shrink-0">
                {[
                    { id: 'vendor', label: 'Vendor Master', count: vendors.length },
                    { id: 'rate', label: 'Rate Master', count: rates.length },
                    { id: 'fuel', label: 'Fuel Master', count: fuelRates.length },
                    { id: 'location', label: 'Location Groups', count: locationGroups.length },
                    { id: 'vehicle', label: 'Vehicle Types', count: vehicleTypes.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as MasterType)}
                        className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === tab.id
                            ? 'border-b-2 border-gray-900 text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-white border border-gray-200">
                {/* Vendor Master Table */}
                {activeTab === 'vendor' && (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vendor Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vendor Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">GSTIN</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Approval</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {vendors.map(vendor => (
                                <tr key={vendor.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{vendor.vendorCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.vendorName}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{vendor.gstin}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{vendor.contactEmail}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${vendor.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
                                            }`}>
                                            {vendor.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${vendor.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                                            vendor.approvalStatus === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {vendor.approvalStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEditModal(vendor)}
                                            className="text-gray-900 hover:text-gray-700 mr-3"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVendor(vendor.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Rate Master Table */}
                {activeTab === 'rate' && (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contract ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Lane</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Validity</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rates.map(rate => (
                                <tr key={rate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{rate.contractId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{rate.vendorCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{rate.source} → {rate.destination}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{rate.deliveryType}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{rate.baseRate}/{rate.rateType.replace('per_', '')}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{rate.validFrom} to {rate.validTo}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEditModal(rate)}
                                            className="text-gray-900 hover:text-gray-700 mr-3"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => MasterDataService.deleteRate(rate.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}


                {/* Fuel Master Table */}
                {activeTab === 'fuel' && (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contract ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fuel Rate (₹/L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Effective From</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Effective To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {fuelRates.map(fuel => (
                                <tr key={fuel.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{fuel.contractId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{fuel.contractId.replace('FUEL-', '')}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{fuel.fuelRate.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{fuel.effectiveFrom}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{fuel.effectiveTo}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${fuel.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                            {fuel.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => MasterDataService.deleteFuelRate(fuel.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Location Groups Table */}
                {activeTab === 'location' && (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zone Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zone Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Locations</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vendors</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {locationGroups.map(group => (
                                <tr key={group.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{group.groupCode}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{group.groupName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="max-w-md">
                                            {group.locations.slice(0, 5).join(', ')}
                                            {group.locations.length > 5 && ` +${group.locations.length - 5} more`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{group.vendorMapping.length} vendors</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${group.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                            {group.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => MasterDataService.deleteLocationGroup(group.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Vehicle Types Table */}
                {activeTab === 'vehicle' && (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vehicle Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Capacity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Delivery Types</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {vehicleTypes.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{vehicle.vehicleTypeCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{vehicle.description}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                        {vehicle.capacity} {vehicle.capacityUnit}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {vehicle.applicableDeliveryTypes.join(', ')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${vehicle.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                            {vehicle.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => MasterDataService.deleteVehicleType(vehicle.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && activeTab === 'vendor' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'create' ? 'Create New Vendor' : 'Edit Vendor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Code *</label>
                                    <input
                                        type="text"
                                        value={vendorForm.vendorCode}
                                        onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="VEN001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                                    <input
                                        type="text"
                                        value={vendorForm.vendorName}
                                        onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="ABC Logistics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN *</label>
                                    <input
                                        type="text"
                                        value={vendorForm.gstin}
                                        onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm font-mono"
                                        placeholder="27AABCU9603R1ZM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PAN *</label>
                                    <input
                                        type="text"
                                        value={vendorForm.pan}
                                        onChange={(e) => setVendorForm({ ...vendorForm, pan: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm font-mono"
                                        placeholder="AABCU9603R"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                                    <input
                                        type="text"
                                        value={vendorForm.contactPerson}
                                        onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                                    <input
                                        type="email"
                                        value={vendorForm.contactEmail}
                                        onChange={(e) => setVendorForm({ ...vendorForm, contactEmail: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="contact@vendor.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={vendorForm.contactPhone}
                                        onChange={(e) => setVendorForm({ ...vendorForm, contactPhone: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={vendorForm.status}
                                        onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value as 'active' | 'inactive' })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <textarea
                                        value={vendorForm.address}
                                        onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        rows={2}
                                        placeholder="Full address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={vendorForm.city}
                                        onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={vendorForm.state}
                                        onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Maharashtra"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalMode === 'create' ? handleCreateVendor : handleUpdateVendor}
                                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 font-medium text-sm flex items-center gap-2"
                            >
                                <Save size={16} />
                                {modalMode === 'create' ? 'Create Vendor' : 'Update Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rate Modal */}
            {showModal && activeTab === 'rate' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'create' ? 'Create New Rate' : 'Edit Rate'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract ID *</label>
                                    <input
                                        type="text"
                                        value={rateForm.contractId}
                                        onChange={(e) => setRateForm({ ...rateForm, contractId: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="CNT-2024-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Code *</label>
                                    <select
                                        value={rateForm.vendorCode}
                                        onChange={(e) => setRateForm({ ...rateForm, vendorCode: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.vendorCode}>{v.vendorName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type *</label>
                                    <select
                                        value={rateForm.deliveryType}
                                        onChange={(e) => setRateForm({ ...rateForm, deliveryType: e.target.value as any })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="LTL">LTL</option>
                                        <option value="FTL">FTL</option>
                                        <option value="MIL">MIL</option>
                                        <option value="Express">Express</option>
                                        <option value="Air">Air</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type *</label>
                                    <select
                                        value={rateForm.rateType}
                                        onChange={(e) => setRateForm({ ...rateForm, rateType: e.target.value as any })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="per_kg">Per KG</option>
                                        <option value="per_ton">Per Ton</option>
                                        <option value="per_km">Per KM</option>
                                        <option value="slab_based">Slab Based</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
                                    <input
                                        type="text"
                                        value={rateForm.source}
                                        onChange={(e) => setRateForm({ ...rateForm, source: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Delhi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                                    <input
                                        type="text"
                                        value={rateForm.destination}
                                        onChange={(e) => setRateForm({ ...rateForm, destination: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Rate (₹) *</label>
                                    <input
                                        type="number"
                                        value={rateForm.baseRate}
                                        onChange={(e) => setRateForm({ ...rateForm, baseRate: parseFloat(e.target.value) })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="14.50"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From *</label>
                                    <input
                                        type="date"
                                        value={rateForm.validFrom}
                                        onChange={(e) => setRateForm({ ...rateForm, validFrom: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid To *</label>
                                    <input
                                        type="date"
                                        value={rateForm.validTo}
                                        onChange={(e) => setRateForm({ ...rateForm, validTo: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRate}
                                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 font-medium text-sm flex items-center gap-2"
                            >
                                <Save size={16} />
                                {modalMode === 'create' ? 'Create Rate' : 'Update Rate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDataManagement;
