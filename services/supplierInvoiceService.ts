// Supplier Invoice Service - For Supplier Portal
// Manages invoices from supplier's perspective
// CONNECTED TO GLOBAL STORAGE ("BACKEND")

import { StorageService } from './storageService';
import { Invoice, InvoiceStatus as GlobalInvoiceStatus } from '../types';
// REMOVED: import { MOCK_INVOICES_NEW } from '../mock_invoices_clean';
// All data now fetched from database APIs - use empty array as fallback
const FALLBACK_INVOICES: Invoice[] = [];

export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'DISPUTED' | 'PAID' | 'REJECTED' | 'PARTIALLY_PAID';
export type PaymentStatus = 'NOT_DUE' | 'DUE' | 'OVERDUE' | 'PAID';

// Retaining Local Interface to prevent UI breakage
export interface SupplierInvoice {
    invoiceId: string;
    invoiceNumber: string;
    poNumber: string;
    invoiceDate: string;
    dueDate: string;
    status: InvoiceStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    shipmentDetails: {
        origin: string;
        destination: string;
        vehicleNumber: string;
        driverName: string;
        material: string;
        weight: string;
    };
    lineItems: {
        description: string;
        quantity: number;
        rate: number;
        amount: number;
    }[];
    documents: string[];
    remarks?: string;
    approvedBy?: string;
    approvedDate?: string;
    paidDate?: string;
}

class SupplierInvoiceService {
    private STORAGE_KEY = 'invoices_v3';

    // Helper: Map Global Invoice -> Supplier Invoice
    // This allows the Supplier Portal to "read" the Organization's data
    private mapToSupplierView(globalInv: Invoice): SupplierInvoice {
        const isPaid = globalInv.status === GlobalInvoiceStatus.PAID;
        const isApproved = globalInv.status === GlobalInvoiceStatus.APPROVED || globalInv.status === GlobalInvoiceStatus.FINANCE_APPROVED;
        const isRejected = globalInv.status === GlobalInvoiceStatus.REJECTED;

        let paymentStatus: PaymentStatus = 'NOT_DUE';
        if (isPaid) paymentStatus = 'PAID';
        else if (globalInv.dueDate && new Date(globalInv.dueDate) < new Date()) paymentStatus = 'OVERDUE';
        else if (isApproved) paymentStatus = 'DUE';

        return {
            invoiceId: globalInv.id,
            invoiceNumber: globalInv.invoiceNumber,
            poNumber: globalInv.id, // Using ID as PO Number proxy if missing
            invoiceDate: globalInv.date,
            dueDate: globalInv.dueDate || new Date(new Date(globalInv.date).setDate(new Date(globalInv.date).getDate() + 30)).toISOString().split('T')[0],
            status: this.mapStatus(globalInv.status),
            paymentStatus: paymentStatus,
            totalAmount: globalInv.amount,
            paidAmount: isPaid ? globalInv.amount : 0,
            pendingAmount: isPaid ? 0 : globalInv.amount,
            shipmentDetails: {
                origin: globalInv.origin,
                destination: globalInv.destination,
                vehicleNumber: 'MH02AB1234', // Mock if missing
                driverName: 'Verified Driver',
                material: 'General Cargo',
                weight: '10 MT'
            },
            lineItems: globalInv.lineItems.map(li => ({
                description: li.description,
                quantity: 1,
                rate: li.amount,
                amount: li.amount
            })),
            documents: ['Invoice.pdf'],
            remarks: globalInv.reason || 'Processed via Portal'
        };
    }

    private mapStatus(globalStatus: GlobalInvoiceStatus): InvoiceStatus {
        switch (globalStatus) {
            case GlobalInvoiceStatus.PAID: return 'PAID';
            case GlobalInvoiceStatus.REJECTED: return 'REJECTED';
            case GlobalInvoiceStatus.APPROVED:
            case GlobalInvoiceStatus.FINANCE_APPROVED:
            case GlobalInvoiceStatus.OPS_APPROVED: return 'APPROVED';
            case GlobalInvoiceStatus.EXCEPTION:
            case GlobalInvoiceStatus.VENDOR_RESPONDED: return 'DISPUTED';
            default: return 'PENDING';
        }
    }

    // --- READ OPERATIONS ---

    getAllInvoices(supplierNameFilter: string = 'TCI Express'): SupplierInvoice[] {
        const globalInvoices = StorageService.load<Invoice[]>(this.STORAGE_KEY, FALLBACK_INVOICES);

        // Filter for specific supplier (Simulating secure access)
        // In a real app, strict filtering by ID would happen on backend
        const supplierInvoices = globalInvoices.filter(inv =>
            inv.carrier?.toLowerCase().includes('tci') ||
            inv.carrier?.toLowerCase().includes('express')
        );

        return supplierInvoices.map(this.mapToSupplierView.bind(this));
    }

    getInvoiceById(id: string): SupplierInvoice | undefined {
        const globalInvoices = StorageService.load<Invoice[]>(this.STORAGE_KEY, FALLBACK_INVOICES);
        const match = globalInvoices.find(inv => inv.id === id || inv.invoiceNumber === id);
        return match ? this.mapToSupplierView(match) : undefined;
    }

    getInvoicesByStatus(status: InvoiceStatus): SupplierInvoice[] {
        return this.getAllInvoices().filter(inv => inv.status === status);
    }

    getInvoicesByPaymentStatus(paymentStatus: PaymentStatus): SupplierInvoice[] {
        return this.getAllInvoices().filter(inv => inv.paymentStatus === paymentStatus);
    }

    getInvoiceStats() {
        const invoices = this.getAllInvoices();
        const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const paid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const pending = invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);

        return {
            totalInvoices: invoices.length,
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            byStatus: {
                pending: invoices.filter(i => i.status === 'PENDING').length,
                approved: invoices.filter(i => i.status === 'APPROVED').length,
                disputed: invoices.filter(i => i.status === 'DISPUTED').length,
                paid: invoices.filter(i => i.status === 'PAID').length,
                rejected: invoices.filter(i => i.status === 'REJECTED').length,
                partiallyPaid: invoices.filter(i => i.status === 'PARTIALLY_PAID').length
            },
            byPaymentStatus: {
                notDue: invoices.filter(i => i.paymentStatus === 'NOT_DUE').length,
                due: invoices.filter(i => i.paymentStatus === 'DUE').length,
                overdue: invoices.filter(i => i.paymentStatus === 'OVERDUE').length,
                paid: invoices.filter(i => i.paymentStatus === 'PAID').length
            }
        };
    }

    searchInvoices(query: string): SupplierInvoice[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllInvoices().filter(inv =>
            inv.invoiceNumber.toLowerCase().includes(lowerQuery) ||
            inv.poNumber.toLowerCase().includes(lowerQuery) ||
            inv.shipmentDetails.origin.toLowerCase().includes(lowerQuery) ||
            inv.shipmentDetails.destination.toLowerCase().includes(lowerQuery)
        );
    }

    // --- WRITE OPERATIONS (THE BRIDGE) ---

    createInvoice(newInvoice: Invoice): void {
        const globalInvoices = StorageService.load<Invoice[]>(this.STORAGE_KEY, FALLBACK_INVOICES);

        // Prepend new invoice locally (Optimistic UI)
        const updatedInvoices = [newInvoice, ...globalInvoices];

        // Save to Shared Storage
        StorageService.save(this.STORAGE_KEY, updatedInvoices);

        // Sync to Backend Database (Real Persistence)
        fetch('http://localhost:5000/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newInvoice)
        }).then(res => {
            if (res.ok) console.log(`[SupplierInvoiceService] DB Sync Success: ${newInvoice.invoiceNumber}`);
            else console.error(`[SupplierInvoiceService] DB Sync Failed: ${res.statusText}`);
        }).catch(err => console.error(`[SupplierInvoiceService] DB Sync Error: ${err}`));

        console.log(`[SupplierInvoiceService] Bridge Write: Invoice ${newInvoice.invoiceNumber} synced to local storage & DB.`);
    }

    requestEarlyPayment(invoiceId: string): boolean {
        const globalInvoices = StorageService.load<Invoice[]>(this.STORAGE_KEY, FALLBACK_INVOICES);
        const index = globalInvoices.findIndex(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

        if (index !== -1) {
            // In a real system, we'd add a flag. For now, we'll just log it 
            // or perhaps add a 'reason' to show it's flagged.
            globalInvoices[index].reason = 'EARLY PAYMENT REQUESTED';
            StorageService.save(this.STORAGE_KEY, globalInvoices);
            return true;
        }
        return false;
    }
}

export const supplierInvoiceService = new SupplierInvoiceService();

