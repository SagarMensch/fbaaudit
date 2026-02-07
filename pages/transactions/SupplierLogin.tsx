import React, { useState } from 'react';
import { Truck, Lock, Mail, LogIn, Building2, MapPin, IndianRupee } from 'lucide-react';

interface SupplierLoginProps {
    onLoginSuccess: (supplierId: string) => void;
    onBack: () => void;
}

// Indian Supplier Credentials
const INDIAN_SUPPLIERS = [
    {
        id: 'tci-express',
        name: 'TCI Express',
        logo: '',
        email: 'rajesh.sharma@tciexpress.in',
        password: '12345678',
        location: 'Gurugram, Haryana',
        type: 'Surface Transport'
    },
    {
        id: 'bluedart-express',
        name: 'Blue Dart',
        logo: '',
        email: 'priya.desai@bluedart.com',
        password: '12345678',
        location: 'Mumbai, Maharashtra',
        type: 'Express Air & Courier'
    },
    {
        id: 'delhivery',
        name: 'Delhivery',
        logo: '',
        email: 'amit.verma@delhivery.com',
        password: '12345678',
        location: 'Gurugram, Haryana',
        type: 'E-commerce Logistics'
    },
    {
        id: 'vrl-logistics',
        name: 'VRL Logistics',
        logo: '',
        email: 'suresh.reddy@vrllogistics.com',
        password: '12345678',
        location: 'Hubballi, Karnataka',
        type: 'Surface Transport'
    }
];

export const SupplierLogin: React.FC<SupplierLoginProps> = ({ onLoginSuccess, onBack }) => {
    // Pre-filled credentials for TCI Express (Demo Mode)
    const [email, setEmail] = useState('rajesh.sharma@tciexpress.in');
    const [password, setPassword] = useState('12345678');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState('');
    const [showQuickLogin, setShowQuickLogin] = useState(true);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        // Validate credentials
        const supplier = INDIAN_SUPPLIERS.find(
            s => s.email === email && s.password === password
        );

        setTimeout(() => {
            if (supplier) {
                onLoginSuccess(supplier.id);
            } else {
                setError('Invalid email or password. Please try again.');
                setIsLoggingIn(false);
            }
        }, 1000);
    };

    const handleQuickLogin = (supplier: typeof INDIAN_SUPPLIERS[0]) => {
        setEmail(supplier.email);
        setPassword(supplier.password);
        setError('');
        setIsLoggingIn(true);

        setTimeout(() => {
            onLoginSuccess(supplier.id);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Truck className="text-blue-600" size={28} />
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Indian Supplier Portal</h1>
                                <p className="text-xs text-slate-600">Freight Logistics Network</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-6xl grid grid-cols-2 gap-8">

                    {/* Left: Login Form */}
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Supplier Login</h2>
                            <p className="text-sm text-slate-600">
                                Access your portal to manage invoices, upload documents, and track payments
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@company.in"
                                        className="w-full border border-slate-300 bg-white text-slate-900 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <Mail size={18} className="absolute right-3 top-3.5 text-slate-400" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full border border-slate-300 bg-white text-slate-900 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <Lock size={18} className="absolute right-3 top-3.5 text-slate-400" />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLoggingIn
                                    ? 'bg-slate-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Login to Portal
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Forgot Password */}
                        <div className="mt-6 text-center">
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                Forgot Password?
                            </button>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <Lock size={14} className="mt-0.5 text-green-600" />
                                <p>
                                    <span className="font-bold text-green-600">Secure Connection:</span> All data is encrypted with TLS 1.3.
                                    Your credentials are protected with industry-standard security.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Login Options */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white">
                            <h3 className="text-lg font-bold mb-2">Quick Login (Demo)</h3>
                            <p className="text-sm text-blue-100 mb-4">
                                Click any supplier below to login instantly with pre-filled credentials
                            </p>
                        </div>

                        {INDIAN_SUPPLIERS.map((supplier) => (
                            <button
                                key={supplier.id}
                                onClick={() => handleQuickLogin(supplier)}
                                disabled={isLoggingIn}
                                className="w-full bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all p-5 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                                {supplier.name}
                                            </h4>
                                            <p className="text-xs text-slate-600 mb-2">{supplier.type}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {supplier.location}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-600">
                                                <div className="font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                                                    {supplier.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <LogIn size={20} />
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Info Box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-xs text-amber-900">
                                <span className="font-bold">Note:</span> These are demo credentials for testing.
                                In production, each supplier will have their own secure login credentials.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 py-4">
                <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-xs text-slate-600">
                    <p>© 2024 Indian Logistics Network. All rights reserved.</p>
                    <div className="flex gap-4">
                        <button className="hover:text-slate-900">Privacy Policy</button>
                        <button className="hover:text-slate-900">Terms of Service</button>
                        <button className="hover:text-slate-900">Support</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
