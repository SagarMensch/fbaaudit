// Contract Utilization Service
// Tracks contract usage, spend, and links invoices to contracts

import { Contract, Invoice } from '../types';

export interface UtilizationReport {
    contractId: string;
    contractName: string;
    validFrom: string;
    validTo: string;

    // Spend Metrics
    spendMTD: number;
    spendYTD: number;
    budgetMTD?: number;
    budgetYTD?: number;
    utilizationPercent: number;

    // Invoice Tracking
    totalInvoices: number;
    approvedInvoices: number;
    pendingInvoices: number;
    rejectedInvoices: number;
    linkedInvoiceIds: string[];

    // Performance
    avgProcessingTime: number; // days
    onTimePaymentRate: number; // percentage
    disputeRate: number; // percentage

    // Trends
    trend: 'increasing' | 'decreasing' | 'stable';
    monthOverMonthChange: number; // percentage
}

export interface ContractInvoiceLink {
    contractId: string;
    invoiceId: string;
    linkedDate: string;
    linkedBy: string;
    confidence: number; // 0-100, for auto-linked invoices
    method: 'MANUAL' | 'AUTO_RATE_MATCH' | 'AUTO_VENDOR_MATCH';
}

/**
 * Contract Utilization Service
 * 
 * Manages the relationship between contracts and invoices,
 * tracks spend, and provides utilization analytics.
 */
class ContractUtilizationService {
    private links: ContractInvoiceLink[] = [];

    /**
     * Link an invoice to a contract
     */
    linkInvoiceToContract(
        invoiceId: string,
        contractId: string,
        method: 'MANUAL' | 'AUTO_RATE_MATCH' | 'AUTO_VENDOR_MATCH' = 'MANUAL',
        confidence: number = 100
    ): void {
        // Check if link already exists
        const existingLink = this.links.find(
            l => l.invoiceId === invoiceId && l.contractId === contractId
        );

        if (existingLink) {
            console.warn(`Invoice ${invoiceId} already linked to contract ${contractId}`);
            return;
        }

        // Create new link
        const link: ContractInvoiceLink = {
            contractId,
            invoiceId,
            linkedDate: new Date().toISOString(),
            linkedBy: method === 'MANUAL' ? 'User' : 'System',
            confidence,
            method
        };

        this.links.push(link);
        console.log(`✅ Linked invoice ${invoiceId} to contract ${contractId} (${method})`);
    }

    /**
     * Auto-link invoice to contract based on vendor and rate matching
     */
    autoLinkInvoice(invoice: Invoice, contracts: Contract[]): string | null {
        // Try to find matching contract by vendor
        const vendorMatches = contracts.filter(c =>
            c.vendorName.toLowerCase() === invoice.carrier.toLowerCase() &&
            c.status === 'ACTIVE' &&
            new Date(invoice.date) >= new Date(c.validFrom) &&
            new Date(invoice.date) <= new Date(c.validTo)
        );

        if (vendorMatches.length === 0) {
            console.warn(`No active contract found for vendor: ${invoice.carrier}`);
            return null;
        }

        // If single match, link with high confidence
        if (vendorMatches.length === 1) {
            const contract = vendorMatches[0];
            this.linkInvoiceToContract(
                invoice.id,
                contract.id,
                'AUTO_VENDOR_MATCH',
                95
            );
            return contract.id;
        }

        // Multiple matches - try rate matching
        // For now, link to first match with lower confidence
        const contract = vendorMatches[0];
        this.linkInvoiceToContract(
            invoice.id,
            contract.id,
            'AUTO_VENDOR_MATCH',
            75
        );
        return contract.id;
    }

    /**
     * Get all invoices linked to a contract
     */
    getContractInvoices(contractId: string, invoices: Invoice[]): Invoice[] {
        const linkedInvoiceIds = this.links
            .filter(l => l.contractId === contractId)
            .map(l => l.invoiceId);

        return invoices.filter(inv => linkedInvoiceIds.includes(inv.id));
    }

    /**
     * Get contract for an invoice
     */
    getInvoiceContract(invoiceId: string): string | null {
        const link = this.links.find(l => l.invoiceId === invoiceId);
        return link ? link.contractId : null;
    }

    /**
     * Calculate spend metrics for a contract
     */
    calculateSpendMTD(contractId: string, invoices: Invoice[]): number {
        const contractInvoices = this.getContractInvoices(contractId, invoices);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return contractInvoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getMonth() === currentMonth &&
                    invDate.getFullYear() === currentYear &&
                    (inv.status === 'APPROVED' || inv.status === 'PAID');
            })
            .reduce((sum, inv) => sum + inv.amount, 0);
    }

    /**
     * Calculate year-to-date spend
     */
    calculateSpendYTD(contractId: string, invoices: Invoice[]): number {
        const contractInvoices = this.getContractInvoices(contractId, invoices);
        const currentYear = new Date().getFullYear();

        return contractInvoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getFullYear() === currentYear &&
                    (inv.status === 'APPROVED' || inv.status === 'PAID');
            })
            .reduce((sum, inv) => sum + inv.amount, 0);
    }

    /**
     * Calculate utilization percentage
     */
    calculateUtilization(contractId: string, invoices: Invoice[], budgetYTD?: number): number {
        if (!budgetYTD) return 0;

        const spendYTD = this.calculateSpendYTD(contractId, invoices);
        return (spendYTD / budgetYTD) * 100;
    }

    /**
     * Get comprehensive utilization report
     */
    getUtilizationReport(
        contract: Contract,
        invoices: Invoice[],
        budgetMTD?: number,
        budgetYTD?: number
    ): UtilizationReport {
        const contractInvoices = this.getContractInvoices(contract.id, invoices);
        const spendMTD = this.calculateSpendMTD(contract.id, invoices);
        const spendYTD = this.calculateSpendYTD(contract.id, invoices);

        // Calculate invoice status breakdown
        const approved = contractInvoices.filter(inv =>
            inv.status === 'APPROVED' || inv.status === 'PAID'
        ).length;
        const pending = contractInvoices.filter(inv =>
            inv.status === 'PENDING' || inv.status === 'OPS_APPROVED' || inv.status === 'FINANCE_APPROVED'
        ).length;
        const rejected = contractInvoices.filter(inv =>
            inv.status === 'REJECTED'
        ).length;

        // Calculate performance metrics
        const avgProcessingTime = this.calculateAvgProcessingTime(contractInvoices);
        const onTimePaymentRate = this.calculateOnTimePaymentRate(contractInvoices);
        const disputeRate = this.calculateDisputeRate(contractInvoices);

        // Calculate trend
        const { trend, change } = this.calculateTrend(contract.id, invoices);

        return {
            contractId: contract.id,
            contractName: contract.vendorName,
            validFrom: contract.validFrom,
            validTo: contract.validTo,

            spendMTD,
            spendYTD,
            budgetMTD,
            budgetYTD,
            utilizationPercent: budgetYTD ? (spendYTD / budgetYTD) * 100 : 0,

            totalInvoices: contractInvoices.length,
            approvedInvoices: approved,
            pendingInvoices: pending,
            rejectedInvoices: rejected,
            linkedInvoiceIds: contractInvoices.map(inv => inv.id),

            avgProcessingTime,
            onTimePaymentRate,
            disputeRate,

            trend,
            monthOverMonthChange: change
        };
    }

    /**
     * Calculate average processing time in days
     */
    private calculateAvgProcessingTime(invoices: Invoice[]): number {
        const processedInvoices = invoices.filter(inv =>
            inv.status === 'APPROVED' || inv.status === 'PAID' || inv.status === 'REJECTED'
        );

        if (processedInvoices.length === 0) return 0;

        const totalDays = processedInvoices.reduce((sum, inv) => {
            const submitDate = new Date(inv.date);
            const lastHistory = inv.workflowHistory?.slice(-1)[0];
            if (!lastHistory?.timestamp) return sum;

            const processDate = new Date(lastHistory.timestamp);
            const days = Math.ceil((processDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);

        return totalDays / processedInvoices.length;
    }

    /**
     * Calculate on-time payment rate
     */
    private calculateOnTimePaymentRate(invoices: Invoice[]): number {
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
        if (paidInvoices.length === 0) return 100;

        const onTime = paidInvoices.filter(inv => {
            if (!inv.dueDate) return true;
            const lastHistory = inv.workflowHistory?.slice(-1)[0];
            if (!lastHistory?.timestamp) return true;

            return new Date(lastHistory.timestamp) <= new Date(inv.dueDate);
        }).length;

        return (onTime / paidInvoices.length) * 100;
    }

    /**
     * Calculate dispute rate
     */
    private calculateDisputeRate(invoices: Invoice[]): number {
        if (invoices.length === 0) return 0;

        const disputed = invoices.filter(inv =>
            inv.status === 'EXCEPTION' || inv.dispute
        ).length;

        return (disputed / invoices.length) * 100;
    }

    /**
     * Calculate spend trend
     */
    private calculateTrend(contractId: string, invoices: Invoice[]): {
        trend: 'increasing' | 'decreasing' | 'stable';
        change: number
    } {
        const contractInvoices = this.getContractInvoices(contractId, invoices);
        const now = new Date();
        const currentMonth = now.getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const currentYear = now.getFullYear();
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthSpend = contractInvoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getMonth() === currentMonth &&
                    invDate.getFullYear() === currentYear &&
                    (inv.status === 'APPROVED' || inv.status === 'PAID');
            })
            .reduce((sum, inv) => sum + inv.amount, 0);

        const lastMonthSpend = contractInvoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getMonth() === lastMonth &&
                    invDate.getFullYear() === lastMonthYear &&
                    (inv.status === 'APPROVED' || inv.status === 'PAID');
            })
            .reduce((sum, inv) => sum + inv.amount, 0);

        if (lastMonthSpend === 0) {
            return { trend: 'stable', change: 0 };
        }

        const change = ((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (change > 5) trend = 'increasing';
        else if (change < -5) trend = 'decreasing';

        return { trend, change };
    }

    /**
     * Get all links
     */
    getAllLinks(): ContractInvoiceLink[] {
        return [...this.links];
    }

    /**
     * Remove a link
     */
    removeLink(invoiceId: string, contractId: string): void {
        this.links = this.links.filter(
            l => !(l.invoiceId === invoiceId && l.contractId === contractId)
        );
    }

    /**
     * Clear all links (for testing)
     */
    clearAllLinks(): void {
        this.links = [];
    }
}

// Export singleton instance
export default new ContractUtilizationService();
