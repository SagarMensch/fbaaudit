import React, { useState, useEffect } from 'react';
import { IndianLogisticsPartner, IndianLogisticsService } from '../services/indianLogisticsService';
import { LogOut, Bell, Table } from 'lucide-react';
import { IndianSupplierService, SupplierNotification } from '../services/supplierService';
import {
    Geo3DChart, Geo3DTruck, Geo3DGavel, Geo3DDocument,
    Geo3DWallet, Geo3DMessageSquare, Geo3DBadge, Geo3DStack
} from './supplier/components/3DGeometricIcons';
import { SilverGlobe } from './supplier/components/SilverGlobe';
import { CommandCenter } from './supplier/CommandCenter';
import { LiveOperations } from './supplier/LiveOperations';
import { SpotMarket } from './supplier/SpotMarket';
import { SmartInvoicing } from './supplier/SmartInvoicing';
import { PaymentsFinance } from './supplier/PaymentsFinance';
import { ResolutionCenter } from './supplier/ResolutionCenter';
import { ProfileCompliance } from './supplier/ProfileCompliance';
import { Invoices } from './supplier/Invoices';
import { BulkInvoiceUpload } from './supplier/BulkInvoiceUpload';

interface SupplierPortalViewProps {
    supplierId: string;
    onLogout: () => void;
}

type TabId = 'dashboard' | 'operations' | 'spot' | 'invoicing' | 'bulk-upload' | 'invoices' | 'payments' | 'resolution' | 'profile';

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({ supplierId, onLogout }) => {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<SupplierNotification[]>([]);
    const supplier = IndianSupplierService.getSupplierById(supplierId);

    // Load notifications
    useEffect(() => {
        if (supplier) {
            const notifs = IndianSupplierService.getSupplierNotifications(supplierId, false);
            setNotifications(notifs);
        }
    }, [supplierId, supplier]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notif: SupplierNotification) => {
        IndianSupplierService.markNotificationAsRead(supplierId, notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        if (notif.type === 'invoice' || notif.type === 'pod_pending' || notif.type === 'lr_tracking') {
            setActiveTab('invoices');
        } else if (notif.type === 'rate_negotiation' || notif.type === 'rate_revision') {
            setActiveTab('payments');
        }
        setShowNotifications(false);
    };

    if (!supplier) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Supplier Not Found</h2>
                    <button onClick={onLogout} className="bg-gray-900 text-white px-6 py-2 font-medium text-sm">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const NAVIGATION = [
        { id: 'dashboard', label: 'Command Center', icon: Geo3DChart },
        { id: 'operations', label: 'Live Operations', icon: Geo3DTruck },
        { id: 'spot', label: 'Spot Market', icon: Geo3DGavel },
        { id: 'invoicing', label: 'Smart Invoicing', icon: Geo3DDocument },
        { id: 'bulk-upload', label: 'Bulk Invoice Upload', icon: Geo3DStack },
        { id: 'invoices', label: 'Invoices', icon: Geo3DDocument },
        { id: 'payments', label: 'Payments & Finance', icon: Geo3DWallet },
        { id: 'resolution', label: 'Resolution Center', icon: Geo3DMessageSquare },
        { id: 'profile', label: 'Profile & Compliance', icon: Geo3DBadge },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <CommandCenter supplier={supplier} onNavigate={setActiveTab} />;
            case 'operations': return <LiveOperations supplier={supplier} />;
            case 'spot': return <SpotMarket supplier={supplier} />;
            case 'invoicing': return <SmartInvoicing supplier={supplier} />;
            case 'bulk-upload': return <BulkInvoiceUpload supplier={supplier} />;
            case 'invoices': return <Invoices supplier={supplier} />;
            case 'payments': return <PaymentsFinance supplier={supplier} />;
            case 'resolution': return <ResolutionCenter supplier={supplier} />;
            case 'profile': return <ProfileCompliance supplier={supplier} />;
            default: return <CommandCenter supplier={supplier} />;
        }
    };

    return (
        <>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="h-[111.1111vh] min-h-[111.1111vh] bg-[#F3F4F6] flex overflow-hidden">
                {/* Sidebar Navigation - UPDATED TO BLACK */}
                <div className="w-64 bg-black text-white flex flex-col shadow-2xl z-20">
                    <div className="p-6 border-b border-gray-900">
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <SilverGlobe size={32} />
                            Atlas
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider pl-10">Business OS</p>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {NAVIGATION.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabId)}
                                className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all border-l-4 ${activeTab === item.id
                                    ? 'bg-gray-900 text-white border-blue-500' // Darker active state
                                    : 'text-slate-400 hover:text-white hover:bg-gray-900 border-transparent'
                                    }`}
                            >
                                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500'} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 border-t border-gray-900 bg-black">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm uppercase border border-slate-700">
                                {supplier.name.substring(0, 2)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate text-white">{supplier.name}</p>
                                <p className="text-xs text-slate-500 truncate">{supplier.contacts[0].name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-slate-300 py-2.5 rounded-lg text-xs font-bold transition-colors border border-gray-800"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Top Bar - Updated for consistency */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                            {NAVIGATION.find(n => n.id === activeTab)?.icon && React.createElement(NAVIGATION.find(n => n.id === activeTab)!.icon, { size: 24, className: "text-slate-800" })}
                            {NAVIGATION.find(n => n.id === activeTab)?.label}
                        </h2>
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Bell size={20} className="text-gray-600" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                        <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                            <span className="font-bold text-sm text-gray-800">Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="text-xs text-gray-500">{unreadCount} unread</span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                                            ) : (
                                                notifications.slice(0, 10).map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${!notif.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                            <div className="flex-1">
                                                                <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                                    {notif.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(notif.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                System Online
                            </span>
                        </div>
                    </header>

                    {/* Content Scroll Area */}
                    <main className="flex-1 overflow-y-auto p-8 relative bg-[#F3F4F6] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="max-w-7xl mx-auto">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default SupplierPortalView;
