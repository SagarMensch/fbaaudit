import { OnboardingVendor } from '../types';

class OnboardingService {
    private STORAGE_KEY = 'onboarding_vendors_v1';

    // --- API SIMULATION: GST LOOKUP ---
    async fetchGSTDetails(gstin: string): Promise<{ success: boolean; data?: any; message?: string }> {
        // Mock Network Delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Regex Validation (Simple)
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(gstin)) {
            return { success: false, message: 'Invalid GSTIN Format (State+PAN+Entity+Z+Check)' };
        }

        // 1. Proprietorship Mock (Sharma)
        if (gstin.startsWith('27ABCD')) {
            return {
                success: true,
                data: {
                    legalName: 'SHARMA ROADLINES',
                    tradeName: 'Sharma Transport',
                    pan: gstin.substring(2, 12),
                    address: 'Shop 4, Truck Terminal, Vashi, Mumbai, Maharashtra',
                    status: 'Active',
                    constitution: 'Proprietorship',
                    taxpayerType: 'Regular'
                }
            };
        }

        // 2. Pvt Ltd Mock (Rapid)
        if (gstin.startsWith('07AAAC')) {
            return {
                success: true,
                data: {
                    legalName: 'RAPID LOGISTICS PVT LTD',
                    tradeName: 'Rapid Logistics',
                    pan: gstin.substring(2, 12),
                    address: 'Plot 55, Okhla Industrial Estate, Phase III, New Delhi',
                    status: 'Active',
                    constitution: 'Private Ltd',
                    taxpayerType: 'Regular'
                }
            };
        }

        // Fallback for random valid strings
        return {
            success: true,
            data: {
                legalName: 'GENERIC LOGISTICS ENT',
                tradeName: 'Generic Transport',
                pan: gstin.substring(2, 12),
                address: '123, Transport Nagar, Unknown City',
                status: 'Active',
                constitution: 'Proprietorship',
                taxpayerType: 'Regular'
            }
        };
    }

    // --- API SIMULATION: PENNY DROP ---
    async verifyBankAccount(accountNo: string, ifsc: string, intendedName: string): Promise<{ success: boolean; bankName: string; matchScore: number }> {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate Bank API

        // Mock Logic: If name contains "Sharma", return a close match
        if (intendedName.toUpperCase().includes('SHARMA')) {
            const bankName = "SHARMA ROADLINES PROP RAJESH SHARMA";
            // Simple Fuzzy Logic Simulation
            return { success: true, bankName, matchScore: 95 };
        }

        if (intendedName.toUpperCase().includes('RAPID')) {
            return { success: true, bankName: "RAPID LOGISTICS PRIVATE LIMITED", matchScore: 100 };
        }

        // Default: Exact match simulation
        return { success: true, bankName: intendedName, matchScore: 100 };
    }

    // --- BUSINESS LOGIC: FINANCE CONFIG ---
    computeFinanceConfig(details: { isMsme: boolean; constitution: string; lowerDeduction?: boolean }) {
        let paymentTermsDays = 60; // Standard
        if (details.isMsme) {
            paymentTermsDays = 45; // MSME Act Sec 43B(h)
        }

        let tdsRate = 2.0; // Standard Company
        if (details.constitution === 'Proprietorship' || details.constitution === 'Individual' || details.constitution === 'HUF') {
            tdsRate = 1.0; // Sec 194C
        }

        if (details.lowerDeduction) {
            tdsRate = 0.5; // Or whatever certificate says. Mocking 0.5
        }

        return { paymentTermsDays, tdsRate };
    }

    // --- STORAGE ---
    saveProfile(profile: OnboardingVendor) {
        const existing = this.getAll();
        const index = existing.findIndex(p => p.id === profile.id);
        if (index >= 0) {
            existing[index] = profile;
        } else {
            existing.push(profile);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    }

    getAll(): OnboardingVendor[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }
}

export const onboardingService = new OnboardingService();
