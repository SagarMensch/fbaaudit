// Invoice Storage Service - MySQL Integration
// Stores submitted invoices from suppliers for organization review

import { SupplierInvoice } from './invoiceMatchingService';

const API_BASE = 'http://localhost:5000';

class InvoiceStorageService {
    private invoices: SupplierInvoice[] = [];
    private loaded = false;

    // ==================== ASYNC API METHODS (MySQL) ====================

    async loadFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    this.invoices = result.data.map(this.mapApiInvoice);
                    this.loaded = true;
                    console.log(`[InvoiceStorageService] Loaded ${this.invoices.length} invoices from MySQL`);
                }
            }
        } catch (error) {
            console.error('[InvoiceStorageService] API error:', error);
        }
    }

    private mapApiInvoice(apiInvoice: any): SupplierInvoice {
        return {
            id: apiInvoice.id,
            supplierId: apiInvoice.vendor_id,
            supplierName: apiInvoice.vendor_name,
            invoiceNumber: apiInvoice.invoice_number,
            invoiceDate: apiInvoice.invoice_date,
            dueDate: apiInvoice.due_date,
            amount: parseFloat(apiInvoice.total_amount || 0),
            currency: apiInvoice.currency || 'INR',
            origin: apiInvoice.origin,
            destination: apiInvoice.destination,
            vehicleNumber: apiInvoice.vehicle_number,
            lrNumber: apiInvoice.lr_number,
            status: apiInvoice.status?.toLowerCase() || 'pending',
            submittedDate: apiInvoice.created_at,
            reviewedDate: apiInvoice.approved_at,
            reviewedBy: apiInvoice.approved_by,
            podStatus: apiInvoice.pod_path ? 'uploaded' : 'pending',
            podUploadDate: apiInvoice.pod_uploaded_at,
            comments: apiInvoice.rejection_reason,
        };
    }

    async fetchAllAsync(): Promise<SupplierInvoice[]> {
        await this.loadFromAPI();
        return this.invoices;
    }

    async fetchByIdAsync(id: string): Promise<SupplierInvoice | null> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices/${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return this.mapApiInvoice(result.data);
                }
            }
        } catch (error) {
            console.error('[InvoiceStorageService] Error fetching invoice:', error);
        }
        return null;
    }

    async submitInvoiceAsync(invoice: any): Promise<string | null> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice_number: invoice.invoiceNumber,
                    invoice_date: invoice.invoiceDate,
                    due_date: invoice.dueDate,
                    vendor_id: invoice.supplierId,
                    vendor_name: invoice.supplierName,
                    origin: invoice.origin,
                    destination: invoice.destination,
                    vehicle_number: invoice.vehicleNumber,
                    lr_number: invoice.lrNumber,
                    total_amount: invoice.amount,
                    base_amount: invoice.amount,
                    currency: invoice.currency || 'INR',
                    status: 'PENDING_VALIDATION',
                    ocr_raw_text: invoice.ocrText,
                    ocr_confidence: invoice.ocrConfidence
                })
            });

            if (response.ok) {
                const result = await response.json();
                await this.loadFromAPI();
                return result.id;
            }
        } catch (error) {
            console.error('[InvoiceStorageService] Error submitting invoice:', error);
        }
        return null;
    }

    async updateStatusAsync(id: string, status: string, reviewedBy?: string, comments?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    approved_by: reviewedBy,
                    rejection_reason: comments
                })
            });
            return response.ok;
        } catch (error) {
            console.error('[InvoiceStorageService] Error updating status:', error);
            return false;
        }
    }

    async approveInvoiceAsync(id: string, approvedBy: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved_by: approvedBy })
            });
            return response.ok;
        } catch (error) {
            console.error('[InvoiceStorageService] Error approving invoice:', error);
            return false;
        }
    }

    async rejectInvoiceAsync(id: string, reason: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/invoices/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            return response.ok;
        } catch (error) {
            console.error('[InvoiceStorageService] Error rejecting invoice:', error);
            return false;
        }
    }

    async getStatsAsync(vendorId?: string): Promise<any> {
        try {
            let url = `${API_BASE}/api/invoices/stats`;
            if (vendorId) {
                url += `?vendor_id=${vendorId}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
        } catch (error) {
            console.error('[InvoiceStorageService] Error fetching stats:', error);
        }
        return {};
    }

    // ==================== SYNC METHODS (Backward Compatibility) ====================

    // Submit new invoice (now syncs to API)
    submitInvoice(invoice: SupplierInvoice): void {
        this.invoices.push(invoice);
        // Fire and forget API call
        this.submitInvoiceAsync(invoice).catch(console.error);
    }

    // Get all invoices
    getAllInvoices(): SupplierInvoice[] {
        if (!this.loaded) {
            this.loadFromAPI();
        }
        return this.invoices;
    }

    // Get invoices by supplier
    getInvoicesBySupplier(supplierId: string): SupplierInvoice[] {
        return this.invoices.filter(inv => inv.supplierId === supplierId);
    }

    // Get invoice by ID
    getInvoiceById(id: string): SupplierInvoice | undefined {
        return this.invoices.find(inv => inv.id === id);
    }

    // Update invoice status
    updateInvoiceStatus(
        id: string,
        status: SupplierInvoice['status'],
        reviewedBy?: string,
        comments?: string
    ): void {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.status = status;
            invoice.reviewedDate = new Date().toISOString().split('T')[0];
            if (reviewedBy) invoice.reviewedBy = reviewedBy;
            if (comments) invoice.comments = comments;
            // Fire and forget API call
            this.updateStatusAsync(id, status.toUpperCase(), reviewedBy, comments).catch(console.error);
        }
    }

    // Update POD status
    updatePODStatus(
        id: string,
        podStatus: SupplierInvoice['podStatus'],
        podUploadDate?: string
    ): void {
        const invoice = this.invoices.find(inv => inv.id === id);
        if (invoice) {
            invoice.podStatus = podStatus;
            if (podUploadDate) invoice.podUploadDate = podUploadDate;
        }
    }
}

export default new InvoiceStorageService();
