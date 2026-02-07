// Enhanced Location Master Tab with Enterprise Features
// Integrates: Data Quality, Workflows, Hierarchies, Analytics

import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, CheckCircle, AlertCircle, XCircle, Eye, GitBranch, BarChart3, Upload, Download, Search, Filter } from 'lucide-react';
import { locationGroupingService } from '../services/locationGroupingService';
import { locationDataQualityService } from '../services/locationDataQualityService';
import { workflowEngine } from '../services/mdmWorkflowEngine';
import { EventBus } from '../services/eventBus';
import { LocationZone } from '../types';

type ViewMode = 'table' | 'hierarchy' | 'quality' | 'workflows';

export const EnhancedLocationMaster: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [zones, setZones] = useState(locationGroupingService.getAllZones());
    const [selectedZone, setSelectedZone] = useState<LocationZone | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [qualityScores, setQualityScores] = useState<Map<string, any>>(new Map());

    useEffect(() => {
        // Calculate quality scores for all zones
        const scores = new Map();
        zones.forEach(zone => {
            const score = locationDataQualityService.calculateDataQuality(zone);
            scores.set(zone.id, score);
        });
        setQualityScores(scores);
    }, [zones]);

    const filteredZones = searchQuery
        ? zones.filter(z =>
            z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            z.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : zones;

    return (
        <div className="space-y-6">
            {/* Header with View Modes */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Location Master</h2>
                    <p className="text-sm text-gray-600 mt-1">Enterprise data quality & governance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 inline mr-2" />
                        Add Location
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
                        <Upload className="h-4 w-4 inline mr-2" />
                        Import
                    </button>
                    <button className="px-4 py-2 border border-gray-400 rounded font-medium hover:bg-gray-100">
                        <Download className="h-4 w-4 inline mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="bg-white border-2 border-gray-300 rounded-lg">
                <div className="flex border-b-2 border-gray-300">
                    {[
                        { id: 'table', label: 'Table View', icon: Database },
                        { id: 'hierarchy', label: 'Hierarchy', icon: GitBranch },
                        { id: 'quality', label: 'Data Quality', icon: CheckCircle },
                        { id: 'workflows', label: 'Workflows', icon: BarChart3 },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as ViewMode)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium ${viewMode === mode.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <mode.icon className="h-4 w-4" />
                            {mode.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {viewMode === 'table' && <TableView zones={filteredZones} qualityScores={qualityScores} onRefresh={onRefresh} />}
                    {viewMode === 'hierarchy' && <HierarchyView zones={zones} />}
                    {viewMode === 'quality' && <DataQualityView zones={zones} qualityScores={qualityScores} />}
                    {viewMode === 'workflows' && <WorkflowsView />}
                </div>
            </div>
        </div>
    );
};

// Table View with Quality Indicators
const TableView: React.FC<{ zones: LocationZone[]; qualityScores: Map<string, any>; onRefresh: () => void }> = ({ zones, qualityScores, onRefresh }) => {
    const handleDelete = (id: string) => {
        if (confirm('Delete this zone?')) {
            locationGroupingService.deleteZone(id);
            onRefresh();
        }
    };

    const getQualityBadge = (score: number) => {
        if (score >= 90) return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">{score}%</span>;
        if (score >= 70) return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded font-bold">{score}%</span>;
        return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">{score}%</span>;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-200 border-b-2 border-gray-300">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Zone</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase">Locations</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase">Quality</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                    {zones.map((zone) => {
                        const quality = qualityScores.get(zone.id);
                        return (
                            <tr key={zone.id} className="hover:bg-gray-100">
                                <td className="px-4 py-3 text-sm font-medium">{zone.name}</td>
                                <td className="px-4 py-3 text-sm font-mono">{zone.code}</td>
                                <td className="px-4 py-3 text-sm">{zone.type}</td>
                                <td className="px-4 py-3 text-sm text-right">{zone.locations.length}</td>
                                <td className="px-4 py-3 text-center">
                                    {quality && getQualityBadge(quality.overall)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 text-xs rounded font-bold ${zone.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                        {zone.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                                        <Eye className="h-4 w-4 inline" />
                                    </button>
                                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                                        <Edit2 className="h-4 w-4 inline" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="h-4 w-4 inline" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Hierarchy View - Tree Structure
const HierarchyView: React.FC<{ zones: LocationZone[] }> = ({ zones }) => {
    const buildHierarchy = () => {
        const regions = zones.filter(z => z.type === 'REGION');
        return regions.map(region => ({
            ...region,
            children: zones.filter(z => z.parentZoneId === region.id)
        }));
    };

    const hierarchy = buildHierarchy();

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Location Hierarchy</h3>
            {hierarchy.map(region => (
                <div key={region.id} className="border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <GitBranch className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-lg">{region.name}</span>
                        <span className="text-sm text-gray-600">({region.type})</span>
                        <span className="ml-auto text-sm text-gray-600">{region.locations.length} locations</span>
                    </div>
                    {region.children && region.children.length > 0 && (
                        <div className="ml-8 space-y-2">
                            {region.children.map((child: any) => (
                                <div key={child.id} className="flex items-center gap-3 p-2 bg-gray-100 rounded">
                                    <div className="w-4 h-4 border-l-2 border-b-2 border-gray-400"></div>
                                    <span className="font-medium">{child.name}</span>
                                    <span className="text-sm text-gray-600">({child.type})</span>
                                    <span className="ml-auto text-sm text-gray-600">{child.locations.length} locations</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Data Quality Dashboard
const DataQualityView: React.FC<{ zones: LocationZone[]; qualityScores: Map<string, any> }> = ({ zones, qualityScores }) => {
    const avgQuality = Array.from(qualityScores.values()).reduce((sum, q) => sum + q.overall, 0) / qualityScores.size;
    const issuesCount = Array.from(qualityScores.values()).reduce((sum, q) => sum + q.issues.length, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Avg Quality Score</p>
                    <p className="text-3xl font-bold mt-2">{avgQuality.toFixed(1)}%</p>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">High Quality</p>
                    <p className="text-3xl font-bold mt-2">{Array.from(qualityScores.values()).filter(q => q.overall >= 90).length}</p>
                </div>
                <div className="bg-yellow-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Medium Quality</p>
                    <p className="text-3xl font-bold mt-2">{Array.from(qualityScores.values()).filter(q => q.overall >= 70 && q.overall < 90).length}</p>
                </div>
                <div className="bg-red-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Total Issues</p>
                    <p className="text-3xl font-bold mt-2">{issuesCount}</p>
                </div>
            </div>

            {/* Detailed Quality Report */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Quality Issues by Zone</h3>
                <div className="space-y-3">
                    {zones.map(zone => {
                        const quality = qualityScores.get(zone.id);
                        if (!quality || quality.issues.length === 0) return null;

                        return (
                            <div key={zone.id} className="border border-gray-300 rounded p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{zone.name}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${quality.overall >= 90 ? 'bg-green-600 text-white' :
                                            quality.overall >= 70 ? 'bg-yellow-600 text-white' :
                                                'bg-red-600 text-white'
                                        }`}>
                                        {quality.overall}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {quality.issues.map((issue: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            {issue.severity === 'HIGH' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                            {issue.severity === 'MEDIUM' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                            {issue.severity === 'LOW' && <AlertCircle className="h-4 w-4 text-gray-600" />}
                                            <span className="text-gray-700">{issue.field}: {issue.issue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Workflows View
const WorkflowsView: React.FC = () => {
    const [requests, setRequests] = useState(workflowEngine.getAllRequests());
    const stats = workflowEngine.getStatistics();

    return (
        <div className="space-y-6">
            {/* Workflow Stats */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Total</p>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="bg-yellow-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Pending</p>
                    <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Approved</p>
                    <p className="text-3xl font-bold mt-2">{stats.approved}</p>
                </div>
                <div className="bg-red-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Rejected</p>
                    <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-4">
                    <p className="text-sm font-medium uppercase">Draft</p>
                    <p className="text-3xl font-bold mt-2">{stats.draft}</p>
                </div>
            </div>

            {/* Workflow List */}
            <div className="bg-white border-2 border-gray-300 rounded-lg">
                <table className="w-full">
                    <thead className="bg-gray-200 border-b-2 border-gray-300">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase">Type</th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase">Priority</th>
                            <th className="px-4 py-3 text-center text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase">Requested By</th>
                            <th className="px-4 py-3 text-right text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                                    No workflow requests yet
                                </td>
                            </tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-100">
                                    <td className="px-4 py-3 text-sm font-mono">{req.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{req.title}</td>
                                    <td className="px-4 py-3 text-sm">{req.type}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded font-bold ${req.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                                                req.priority === 'HIGH' ? 'bg-orange-600 text-white' :
                                                    req.priority === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                                                        'bg-gray-400 text-white'
                                            }`}>
                                            {req.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded font-bold ${req.status === 'APPROVED' ? 'bg-green-600 text-white' :
                                                req.status === 'REJECTED' ? 'bg-red-600 text-white' :
                                                    req.status === 'PENDING_APPROVAL' ? 'bg-yellow-600 text-white' :
                                                        'bg-gray-400 text-white'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{req.requestedBy}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <Eye className="h-4 w-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
