import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetRoleName: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess, targetRoleName }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '12345678') {
            onSuccess();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Lock size={18} className="mr-2 text-teal-600" />
                        Security Verification
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            You are attempting to switch to the <span className="font-bold text-gray-900">{targetRoleName}</span> profile.
                            Please enter your administrative password to proceed.
                        </p>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                            placeholder="Enter password..."
                            autoFocus
                        />

                        {error && (
                            <div className="flex items-center mt-3 text-red-600 text-xs font-bold animate-shake">
                                <AlertCircle size={14} className="mr-1.5" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors"
                        >
                            Verify & Switch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
