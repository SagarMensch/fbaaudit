import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { locationGroupingService } from '../services/locationGroupingService';
import { fuelMasterService } from '../services/fuelMasterService';
import { accessorialService } from '../services/accessorialService';
import { EventBus } from '../services/eventBus';

// Add Zone Modal
export const AddZoneModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'REGION' as 'REGION' | 'STATE' | 'CITY' | 'PINCODE_CLUSTER',
        locations: '',
        parentZoneId: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const locations = formData.locations.split(',').map(l => l.trim()).filter(l => l);

        locationGroupingService.createZone({
            name: formData.name,
            code: formData.code.toUpperCase(),
            type: formData.type,
            locations,
            parentZoneId: formData.parentZoneId || undefined,
            status: 'ACTIVE'
        });

        EventBus.emit('location.zone.changed', { action: 'created' });
        onSuccess();
        onClose();
        setFormData({ name: '', code: '', type: 'REGION', locations: '', parentZoneId: '' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Zone</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., North India"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone Code *</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., NORTH-IND"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="REGION">Region</option>
                            <option value="STATE">State</option>
                            <option value="CITY">City</option>
                            <option value="PINCODE_CLUSTER">Pincode Cluster</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locations (comma-separated) *</label>
                        <textarea
                            required
                            value={formData.locations}
                            onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="e.g., Delhi, Chandigarh, Jaipur"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Zone
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Fuel Price Modal
export const AddFuelPriceModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        city: '',
        dieselPrice: '',
        petrolPrice: '',
        date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        fuelMasterService.addPrice({
            city: formData.city,
            dieselPrice: parseFloat(formData.dieselPrice),
            petrolPrice: formData.petrolPrice ? parseFloat(formData.petrolPrice) : undefined,
            date: formData.date
        });

        EventBus.emit('fuel.price.updated', { city: formData.city });
        onSuccess();
        onClose();
        setFormData({ city: '', dieselPrice: '', petrolPrice: '', date: new Date().toISOString().split('T')[0] });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add Fuel Price</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Mumbai"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Price (₹/L) *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.dieselPrice}
                            onChange={(e) => setFormData({ ...formData, dieselPrice: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 92.50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Petrol Price (₹/L)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.petrolPrice}
                            onChange={(e) => setFormData({ ...formData, petrolPrice: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 102.50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Price
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Vehicle Type Modal
export const AddVehicleModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        capacity: '',
        unit: 'ton',
        types: [] as string[]
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Store in localStorage for now
        const vehicles = JSON.parse(localStorage.getItem('vehicle_types') || '[]');
        vehicles.push({
            id: Date.now().toString(),
            code: formData.code.toUpperCase(),
            description: formData.description,
            capacity: parseFloat(formData.capacity),
            unit: formData.unit,
            types: formData.types
        });
        localStorage.setItem('vehicle_types', JSON.stringify(vehicles));

        EventBus.emit('vehicle.created', { code: formData.code });
        onSuccess();
        onClose();
        setFormData({ code: '', description: '', capacity: '', unit: 'ton', types: [] });
    };

    const toggleType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add Vehicle Type</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Code *</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 32FT-MXL"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 32 Feet Multi-Axle Truck"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="15"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                            <select
                                required
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ton">Ton</option>
                                <option value="kg">Kg</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Applicable For *</label>
                        <div className="flex gap-3">
                            {['FTL', 'LTL', 'Express'].map(type => (
                                <label key={type} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.types.includes(type)}
                                        onChange={() => toggleType(type)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Accessorial Modal
export const AddAccessorialModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        category: 'Fuel',
        chargeType: 'Per Trip',
        amount: '',
        logic: 'Fixed'
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        accessorialService.create({
            code: formData.code.toUpperCase(),
            description: formData.description,
            category: formData.category as any,
            chargeType: formData.chargeType,
            amount: parseFloat(formData.amount),
            currency: 'INR',
            logic: formData.logic as any
        });

        EventBus.emit('accessorial.created', { code: formData.code });
        onSuccess();
        onClose();
        setFormData({ code: '', description: '', category: 'Fuel', chargeType: 'Per Trip', amount: '', logic: 'Fixed' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add Accessorial Charge</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Charge Code *</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., FSC"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Fuel Surcharge"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Fuel">Fuel</option>
                                <option value="Detention">Detention</option>
                                <option value="ODA">ODA</option>
                                <option value="Tolls">Tolls</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logic *</label>
                            <select
                                required
                                value={formData.logic}
                                onChange={(e) => setFormData({ ...formData, logic: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Fixed">Fixed</option>
                                <option value="Pass-through">Pass-through</option>
                                <option value="% of Freight">% of Freight</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type *</label>
                        <input
                            type="text"
                            required
                            value={formData.chargeType}
                            onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Per Trip, Per Day"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount * {formData.logic === '% of Freight' ? '(%)' : '(₹)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={formData.logic === '% of Freight' ? '10' : '2500'}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Accessorial
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
