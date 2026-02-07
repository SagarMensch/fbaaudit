import React, { useState } from 'react';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingVendor } from '../../types';
import { Shield, CheckCircle, Smartphone, Building, CreditCard, ChevronRight, FileText, Camera, Check } from 'lucide-react';

export const VendorOnboarding: React.FC = () => {
    // --- WIZARD STATE ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- DATA STATE ---
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [gstin, setGstin] = useState('27ABCDE1234F1Z5'); // Default valid mock
    const [fetchedTaxData, setFetchedTaxData] = useState<any>(null);
    const [bankDetails, setBankDetails] = useState({ account: '', ifsc: 'HDFC0001234' });
    const [bankVerifiedName, setBankVerifiedName] = useState('');
    const [isMsme, setIsMsme] = useState(false);

    // Final Computed Data
    const [finalProfile, setFinalProfile] = useState<OnboardingVendor | null>(null);

    // --- HANDLERS ---

    const handleSendOtp = () => {
        if (mobile.length < 10) return alert("Enter valid mobile");
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(1.5); }, 1000); // Simulate SMS
    };

    const handleVerifyOtp = () => {
        if (otp !== '1234') return alert("Use default OTP: 1234");
        setStep(2);
    };

    const handleFetchGst = async () => {
        setLoading(true);
        const result = await onboardingService.fetchGSTDetails(gstin);
        setLoading(false);
        if (result.success) {
            setFetchedTaxData(result.data);
        } else {
            alert(result.message);
        }
    };

    const handleConfirmTax = () => {
        setStep(3);
    };

    const handleVerifyBank = async () => {
        if (!bankDetails.account || !bankDetails.ifsc) return alert("Details required");
        setLoading(true);
        const result = await onboardingService.verifyBankAccount(bankDetails.account, bankDetails.ifsc, fetchedTaxData.legalName);
        setLoading(false);
        if (result.success) {
            setBankVerifiedName(result.bankName);
        } else {
            alert("Bank Verification Failed");
        }
    };

    const handleFinalSubmit = () => {
        const config = onboardingService.computeFinanceConfig({
            isMsme,
            constitution: fetchedTaxData.constitution
        });

        const profile: OnboardingVendor = {
            id: `V-${Date.now()}`,
            mobile,
            gstin,
            companyName: fetchedTaxData.legalName,
            tradeName: fetchedTaxData.tradeName,
            pan: fetchedTaxData.pan,
            legalStructure: fetchedTaxData.constitution,
            address: fetchedTaxData.address,

            bankAccount: bankDetails.account,
            ifsc: bankDetails.ifsc,
            bankBeneficiaryName: bankVerifiedName,
            isBankVerified: true,

            isMsme,

            paymentTermsDays: config.paymentTermsDays,
            tdsRate: config.tdsRate,

            status: 'COMPLETED'
        };

        onboardingService.saveProfile(profile);
        setFinalProfile(profile);
        setStep(5);
    };

    // --- RENDER STEPS ---

    const renderStep1 = () => (
        <div className="space-y-6 animate-in slide-in-from-right">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[#1B2559]">Welcome Partner</h2>
                <p className="text-gray-500 text-sm mt-2">Enter your mobile number to start onboarding with Atlas Manufacturing.</p>
            </div>

            {step === 1 ? (
                <>
                    <div className="bg-white p-2 border rounded-lg flex items-center">
                        <span className="text-gray-500 font-bold px-3 border-r">+91</span>
                        <input
                            className="flex-1 p-3 outline-none font-bold text-lg tracking-widest"
                            placeholder="99999 99999"
                            value={mobile}
                            onChange={e => setMobile(e.target.value)}
                            type="tel"
                        />
                    </div>
                    <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full bg-[#E56910] text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-orange-700 transition"
                    >
                        {loading ? 'Sending...' : 'Get OTP'}
                    </button>
                </>
            ) : (
                <>
                    <div className="bg-white p-2 border rounded-lg flex items-center text-center">
                        <input
                            className="w-full p-3 outline-none font-bold text-lg tracking-[1em] text-center"
                            placeholder="xxxx"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            maxLength={4}
                        />
                    </div>
                    <p className="text-xs text-center text-gray-400">Enter Dummy OTP: 1234</p>
                    <button
                        onClick={handleVerifyOtp}
                        className="w-full bg-[#1B2559] text-white py-4 rounded-lg font-bold text-lg shadow-lg transition"
                    >
                        Verify & Login
                    </button>
                </>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center space-x-3 text-[#1B2559] mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold">Tax Details</h2>
            </div>

            {!fetchedTaxData ? (
                <>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Enter GSTIN</label>
                    <div className="flex space-x-2">
                        <input
                            className="flex-1 border-2 border-gray-300 rounded-lg p-3 font-mono uppercase font-bold text-lg focus:border-blue-500 outline-none"
                            value={gstin}
                            onChange={e => setGstin(e.target.value)}
                        />
                        <button
                            onClick={handleFetchGst}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 rounded-lg font-bold"
                        >
                            {loading ? '...' : 'Fetch'}
                        </button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Try: 27ABCDE1234F1Z5 (Proprietor) or 07AAACR5555K1Z2 (Pvt Ltd)</p>
                </>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-start">
                        <Building className="text-green-600 mr-3 mt-1" size={24} />
                        <div>
                            <p className="text-xs text-green-600 font-bold uppercase">Legal Name</p>
                            <h3 className="text-lg font-bold text-gray-900">{fetchedTaxData.legalName}</h3>
                        </div>
                    </div>
                    <div className="pl-9">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                                <span className="block text-xs text-gray-500">Trade Name</span>
                                <span className="font-medium">{fetchedTaxData.tradeName}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Constitution</span>
                                <span className="font-medium">{fetchedTaxData.constitution}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">{fetchedTaxData.address}</p>
                    </div>
                    <button onClick={handleConfirmTax} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mt-2">Yes, This is Me</button>
                    <button onClick={() => setFetchedTaxData(null)} className="w-full text-gray-500 text-sm font-medium py-2">No, Search Again</button>
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center space-x-3 text-[#1B2559] mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold">Bank Validaton</h2>
            </div>

            <p className="text-sm text-gray-600">We will deposit ₹1 to verify your identity.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                    <input
                        className="w-full border p-3 rounded-lg font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={bankDetails.account}
                        onChange={e => setBankDetails({ ...bankDetails, account: e.target.value })}
                        placeholder="Enter Account No"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                    <input
                        className="w-full border p-3 rounded-lg font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        value={bankDetails.ifsc}
                        onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                    />
                </div>

                {!bankVerifiedName ? (
                    <button
                        onClick={handleVerifyBank}
                        disabled={loading}
                        className="w-full bg-[#1B2559] text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-900 transition flex items-center justify-center"
                    >
                        {loading ? 'Verifying...' : 'Verify Now (Penny Drop)'}
                    </button>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in">
                        <div className="flex items-center text-green-700 font-bold mb-2">
                            <CheckCircle size={20} className="mr-2" /> Verified Successfully
                        </div>
                        <p className="text-xs text-gray-500">Name at Bank:</p>
                        <p className="font-bold text-gray-800">{bankVerifiedName}</p>
                        <button onClick={() => setStep(4)} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mt-4">Next Step</button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center space-x-3 text-[#1B2559] mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold">3</div>
                <h2 className="text-xl font-bold">MSME & Compliance</h2>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900">Are you MSME Registered?</h3>
                        <p className="text-xs text-gray-500">Micro/Small Enterprise (Udyam)</p>
                    </div>
                    <div
                        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${isMsme ? 'bg-green-500' : 'bg-gray-300'}`}
                        onClick={() => setIsMsme(!isMsme)}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${isMsme ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {isMsme && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center cursor-pointer hover:bg-gray-100">
                        <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-blue-600">Upload Udyam Certificate</p>
                        <p className="text-[10px] text-gray-400">(Simulated Upload)</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-xs space-y-2">
                <p className="font-bold text-blue-800">Finance Configuration Preview:</p>
                <div className="flex justify-between">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span className="font-bold">{isMsme ? '45 Days (Priority)' : '60 Days (Standard)'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">TDS Rate:</span>
                    <span className="font-bold">
                        {fetchedTaxData.constitution === 'Proprietorship' ? '1.0% (Section 194C)' : '2.0% (Corporate)'}
                    </span>
                </div>
            </div>

            <button
                onClick={handleFinalSubmit}
                className="w-full bg-[#1B2559] text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-900 transition flex items-center justify-center"
            >
                Complete Registration <ChevronRight size={20} className="ml-2" />
            </button>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center space-y-6 animate-in zoom-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={48} className="text-green-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Onboarding Complete!</h2>
                <p className="text-gray-500 mt-2 px-8">You are now an approved vendor for Atlas Manufacturing.</p>
            </div>

            <div className="bg-white mx-6 p-4 rounded-xl shadow border border-gray-100 text-left space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vendor ID</span>
                    <span className="font-mono font-bold text-[#1B2559]">{finalProfile?.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Terms</span>
                    <span className="font-bold text-green-600">{finalProfile?.paymentTermsDays} Days</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TDS Rate</span>
                    <span className="font-bold">{finalProfile?.tdsRate}%</span>
                </div>
            </div>

            <p className="text-xs text-gray-400">You can close this window now.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                {/* Header Graphic */}
                <div className="h-32 bg-[#1B2559] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-900/50"></div>
                    <div className="relative z-10 text-center">
                        <span className="text-2xl font-bold text-white tracking-widest">ATLAS</span>
                        <p className="text-[10px] text-blue-200 uppercase tracking-widest">Supplier Onboarding</p>
                    </div>
                </div>

                {/* Wizard Content */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                        {step === 1 || step === 1.5 ? renderStep1() :
                            step === 2 ? renderStep2() :
                                step === 3 ? renderStep3() :
                                    step === 4 ? renderStep4() :
                                        renderSuccess()
                        }
                    </div>

                    {/* Status Bar */}
                    {step < 5 && (
                        <div className="mt-8 flex justify-center space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= Math.floor(step) ? 'bg-[#E56910]' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
