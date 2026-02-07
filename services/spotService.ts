import { SpotIndent, SpotVendor, SpotVendorRequest, SpotBid } from '../types';

// --- SEED DATA: SPOT VENDORS ---
const SEED_VENDORS: SpotVendor[] = [
    { id: 'V-SPOT-001', name: 'Sharma Transporters', gstin: '27AABCS1234H1Z5', phone: '+91 98765 43210', rating: 3.8 },
    { id: 'V-SPOT-002', name: 'VRL Logistics', gstin: '29AABCV5555L1Z2', phone: '+91 99887 76655', rating: 4.8 },
    { id: 'V-SPOT-003', name: 'Ghatge Patil', gstin: '27AAACG6666J1Z9', phone: '+91 91234 56789', rating: 4.2 },
    { id: 'V-SPOT-004', name: 'Blue Dart', gstin: '29AABCV5555L1Z9', phone: '+91 99887 76659', rating: 4.9 }, // The "Panic Button" option
    { id: 'V-SPOT-005', name: 'TCI Express', gstin: '29AABCV5555L1Z8', phone: '+91 99887 76658', rating: 4.5 }
];

class SpotService {
    private INDENT_KEY = 'spot_indents_v1';
    private VENDOR_KEY = 'spot_vendors_v1';

    private indents: SpotIndent[] = [];
    private vendors: SpotVendor[] = [];

    constructor() {
        this.load();
    }

    private load() {
        const iStorage = localStorage.getItem(this.INDENT_KEY);
        const vStorage = localStorage.getItem(this.VENDOR_KEY);

        if (vStorage) {
            this.vendors = JSON.parse(vStorage);
        } else {
            this.vendors = SEED_VENDORS;
            this.saveVendors();
        }

        if (iStorage) {
            this.indents = JSON.parse(iStorage);
        }
    }

    private saveIndents() {
        localStorage.setItem(this.INDENT_KEY, JSON.stringify(this.indents));
    }

    private saveVendors() {
        localStorage.setItem(this.VENDOR_KEY, JSON.stringify(this.vendors));
    }

    // --- READERS ---
    getVendors(): SpotVendor[] {
        return this.vendors;
    }

    getAllIndents(): SpotIndent[] {
        this.load();
        return this.indents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    getIndentById(id: string): SpotIndent | undefined {
        return this.indents.find(i => i.id === id);
    }

    // Helper for Guest Page
    getRequestByToken(token: string): { indent: SpotIndent, request: SpotVendorRequest, vendor: SpotVendor } | null {
        this.load();
        for (const indent of this.indents) {
            const req = indent.vendorRequests.find(r => r.token === token);
            if (req) {
                const vendor = this.vendors.find(v => v.id === req.vendorId);
                if (vendor) return { indent, request: req, vendor };
            }
        }
        return null;
    }

    // --- SUPPLIER PORTAL METHODS ---

    /**
     * Find vendor by company name (for Supplier Portal linking)
     */
    getVendorByName(companyName: string): SpotVendor | undefined {
        this.load();
        // Fuzzy match: normalize names for comparison
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const normalizedSearch = normalize(companyName);
        return this.vendors.find(v => normalize(v.name) === normalizedSearch);
    }

    /**
     * Get all active indents where this vendor is invited (for Supplier Portal)
     */
    getIndentsForVendor(vendorId: string): SpotIndent[] {
        this.load();
        return this.indents
            .filter(indent => {
                // Check if vendor is in vendorRequests
                const isInvited = indent.vendorRequests.some(r => r.vendorId === vendorId);
                // Only show BIDDING status
                const isActive = indent.status === 'BIDDING';
                return isInvited && isActive;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    /**
     * Get vendor request from an indent for a specific vendor
     */
    getVendorRequest(indentId: string, vendorId: string): SpotVendorRequest | undefined {
        this.load();
        const indent = this.indents.find(i => i.id === indentId);
        if (!indent) return undefined;
        return indent.vendorRequests.find(r => r.vendorId === vendorId);
    }

    /**
     * Submit bid from Supplier Portal (using vendorId instead of token)
     */
    submitBidFromSupplier(indentId: string, vendorId: string, amount: number, remarks: string): { success: boolean, message: string } {
        this.load();
        const indent = this.indents.find(i => i.id === indentId);
        if (!indent) return { success: false, message: 'Indent not found' };

        const request = indent.vendorRequests.find(r => r.vendorId === vendorId);
        if (!request) return { success: false, message: 'You are not invited to this bid' };

        const vendor = this.vendors.find(v => v.id === vendorId);

        // Create Bid
        const newBid: SpotBid = {
            id: `BID-${Date.now()}`,
            requestId: request.id,
            vendorName: vendor?.name || 'Unknown Vendor',
            amount: amount,
            remarks: remarks,
            bidTime: new Date().toISOString()
        };

        // Update Request
        request.status = 'BID_RECEIVED';
        request.bid = newBid;

        // Save
        this.saveIndents();
        console.log(`[Supplier Portal] Bid submitted: ${vendor?.name} bid ₹${amount} on ${indentId}`);
        return { success: true, message: 'Bid submitted successfully' };
    }

    // --- ACTIONS ---

    // 1. Create & Broadcast
    createIndent(data: { origin: string, destination: string, vehicleType: string, weightTon: number, benchmarkPrice: number, selectedVendorIds: string[] }): SpotIndent {
        const indentId = `IND-${Date.now().toString().slice(-6)}`;

        const newIndent: SpotIndent = {
            id: indentId,
            requestorId: 'USER-1',
            origin: data.origin,
            destination: data.destination,
            vehicleType: data.vehicleType as any,
            weightTon: data.weightTon,
            benchmarkPrice: data.benchmarkPrice,
            status: 'BIDDING', // Immediately Open
            vendorRequests: [],
            createdAt: new Date().toISOString()
        };

        // Create Requests for selected vendors
        newIndent.vendorRequests = data.selectedVendorIds.map(vId => {
            const token = `guest-${Math.random().toString(36).substring(7)}`; // Simple simulation token
            // Mock WhatsApp API Call
            console.log(`[WhatsApp API] To Vendor ${vId}: Output Load ${data.origin}-${data.destination}. Link: /guest-bid/${token}`);

            return {
                id: `REQ-${Math.random().toString(36).substring(7)}`,
                indentId: indentId,
                vendorId: vId,
                token: token,
                status: 'SENT',
                whatsappSent: true
            };
        });

        this.indents.unshift(newIndent);
        this.saveIndents();
        return newIndent;
    }

    // 2. Submit Bid (Guest)
    submitBid(token: string, amount: number, remarks: string): boolean {
        this.load();
        const match = this.getRequestByToken(token);
        if (!match) return false;

        const { indent, request } = match;

        // Create Bid
        const newBid: SpotBid = {
            id: `BID-${Date.now()}`,
            requestId: request.id,
            vendorName: match.vendor.name, // Denormalize
            amount: amount,
            remarks: remarks,
            bidTime: new Date().toISOString()
        };

        // Update Request
        request.status = 'BID_RECEIVED';
        request.bid = newBid;

        // Save
        this.saveIndents();
        this.saveIndents();
        return true;
    }

    // 2.5 internal Simulation Bid
    simulateBid(indentId: string, vendorId: string, amount: number, remarks: string) {
        this.load();
        const indent = this.indents.find(i => i.id === indentId);
        if (!indent) return;

        // Find or create a request for this vendor
        let req = indent.vendorRequests.find(r => r.vendorId === vendorId);
        if (!req) {
            // If vendor wasn't originally invited, invite them now (simulating open market)
            req = {
                id: `REQ-${Math.random().toString(36).substring(7)}`,
                indentId: indentId,
                vendorId: vendorId,
                token: 'sim-token',
                status: 'SENT',
                whatsappSent: true
            };
            indent.vendorRequests.push(req);
        }

        const vendor = this.vendors.find(v => v.id === vendorId);

        const newBid: SpotBid = {
            id: `BID-${Date.now()}`,
            requestId: req.id,
            vendorName: vendor?.name || 'Unknown Vendor',
            amount: amount,
            remarks: remarks,
            bidTime: new Date().toISOString()
        };

        req.status = 'BID_RECEIVED';
        req.bid = newBid;
        this.saveIndents();
    }

    // 3. Approve Booking
    approveBooking(indentId: string, bidId: string): { success: boolean, message: string, bookingRef?: string } {
        const indent = this.indents.find(i => i.id === indentId);
        if (!indent) return { success: false, message: 'Indent not found' };

        // Find the bid (nested in requests)
        let winningBid: SpotBid | undefined;
        let winningReq: SpotVendorRequest | undefined;

        for (const req of indent.vendorRequests) {
            if (req.bid && req.bid.id === bidId) {
                winningBid = req.bid;
                winningReq = req;
                break;
            }
        }

        if (!winningBid || !winningReq) return { success: false, message: 'Bid not found' };

        // Variance Check
        const variance = (winningBid.amount - indent.benchmarkPrice) / indent.benchmarkPrice;
        // Note: Using 15% threshold from PRD
        if (variance > 0.15) {
            // In a real app, this would trigger "Pending VP Approval" status
            // For this demo, we'll allow it but flag it
            console.warn(`[Variance Alert] Price is ${variance * 100}% higher than benchmark.`);
        }

        // Finalize
        indent.status = 'BOOKED';
        indent.winningBidId = winningBid.id;
        indent.approvedPrice = winningBid.amount;
        indent.spotBookingRef = `SPOT-${indent.id.split('-')[1]}-${Math.floor(Math.random() * 1000)}`;

        this.saveIndents();

        const winningVendor = this.vendors.find(v => v.id === winningReq!.vendorId);
        console.log(`[WhatsApp API] To Vendor ${winningVendor?.name}: Booking Confirmed! Ref: ${indent.spotBookingRef}`);

        return { success: true, bookingRef: indent.spotBookingRef, message: 'Booking Confirmed' };
    }
}

export const spotService = new SpotService();
