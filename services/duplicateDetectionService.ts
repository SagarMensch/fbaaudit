// Duplicate Invoice Detection Service
// 5-year history tracking and vendor-wise uniqueness validation
// Extended with Fuzzy Matching: Levenshtein Distance + Shipment DNA

import { SupplierInvoice } from './invoiceMatchingService';

export interface InvoiceHistory {
    invoiceNumber: string;
    vendorId: string;
    vendorName: string;
    submittedDate: string;
    totalAmount: number;
    status: string;
    lrNumber: string;
    vehicleNumber?: string;
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateType?: 'invoice_number' | 'lr_number' | 'exact_match' | 'fuzzy_match';
    matchedInvoices: InvoiceHistory[];
    confidence: 'high' | 'medium' | 'low';
    message: string;
    similarityScore?: number;
    componentScores?: {
        invoiceNumber: number;
        amount: number;
        date: number;
        vehicleNumber: number;
    };
}

export interface FuzzyDuplicateResult {
    originalInvoice: InvoiceHistory;
    potentialDuplicate: InvoiceHistory;
    overallSimilarity: number;
    componentScores: {
        invoiceNumber: number;
        vendorId: number;
        amount: number;
        date: number;
        vehicleNumber: number;
    };
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: 'BLOCK' | 'REVIEW' | 'ALLOW';
}

class DuplicateDetectionService {
    private invoiceHistory: InvoiceHistory[] = [];
    private readonly HISTORY_YEARS = 5;

    constructor() {
        this.initializeTCIDemoData();
    }

    /**
     * Initialize demo data with TCI Express invoices including duplicates
     * For demo to CXO and business team
     */
    private initializeTCIDemoData(): void {
        const today = new Date();
        const formatDate = (daysAgo: number) => {
            const d = new Date(today);
            d.setDate(d.getDate() - daysAgo);
            return d.toISOString().split('T')[0];
        };

        // TCI Express - Rajesh Sharma - Legitimate invoices
        this.invoiceHistory = [
            {
                invoiceNumber: 'TCI-2024-0501',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(30),
                totalAmount: 45000,
                status: 'PAID',
                lrNumber: 'LR-TCI-99201',
                vehicleNumber: 'MH02AB1234'
            },
            {
                invoiceNumber: 'TCI-2024-0502',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(25),
                totalAmount: 72000,
                status: 'APPROVED',
                lrNumber: 'LR-TCI-99202',
                vehicleNumber: 'MH02CD5678'
            },
            {
                invoiceNumber: 'TCI-2024-0503',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(20),
                totalAmount: 38500,
                status: 'PAID',
                lrNumber: 'LR-TCI-99203',
                vehicleNumber: 'MH02EF9012'
            },
            // DUPLICATE ATTEMPT 1: Same invoice with /A suffix
            {
                invoiceNumber: 'TCI-2024-0501/A',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(28),
                totalAmount: 45000,
                status: 'PENDING',
                lrNumber: 'LR-TCI-99201-A',
                vehicleNumber: 'MH02AB1234'
            },
            // DUPLICATE ATTEMPT 2: Revised invoice
            {
                invoiceNumber: 'TCI-2024-0501-R',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(27),
                totalAmount: 45200,
                status: 'PENDING',
                lrNumber: 'LR-TCI-99201R',
                vehicleNumber: 'MH02AB1234'
            },
            // More legitimate invoices
            {
                invoiceNumber: 'TCI-2024-0600',
                vendorId: 'tci-express',
                vendorName: 'TCI Express',
                submittedDate: formatDate(15),
                totalAmount: 95000,
                status: 'APPROVED',
                lrNumber: 'LR-TCI-99300',
                vehicleNumber: 'MH02GH3456'
            },
            // Blue Dart invoices
            {
                invoiceNumber: 'BDE-INV-1001',
                vendorId: 'blue-dart',
                vendorName: 'Blue Dart Express',
                submittedDate: formatDate(18),
                totalAmount: 28500,
                status: 'PAID',
                lrNumber: 'BD-AWB-500123',
                vehicleNumber: 'DL01AB7890'
            },
            // DUPLICATE ATTEMPT 3: Blue Dart format change
            {
                invoiceNumber: 'BDE/INV/1001',
                vendorId: 'blue-dart',
                vendorName: 'Blue Dart Express',
                submittedDate: formatDate(16),
                totalAmount: 28500,
                status: 'PENDING',
                lrNumber: 'BD-AWB-500123',
                vehicleNumber: 'DL01AB7890'
            }
        ];
    }

    /**
     * Levenshtein Distance Algorithm
     * Calculates edit distance between two strings
     */
    levenshteinDistance(s1: string, s2: string): number {
        if (!s1) return s2?.length || 0;
        if (!s2) return s1?.length || 0;

        const str1 = String(s1).toUpperCase().trim();
        const str2 = String(s2).toUpperCase().trim();

        const rows = str1.length + 1;
        const cols = str2.length + 1;
        const dist: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        for (let i = 0; i < rows; i++) dist[i][0] = i;
        for (let j = 0; j < cols; j++) dist[0][j] = j;

        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                dist[i][j] = Math.min(
                    dist[i - 1][j] + 1,
                    dist[i][j - 1] + 1,
                    dist[i - 1][j - 1] + cost
                );
            }
        }

        return dist[rows - 1][cols - 1];
    }

    /**
     * Levenshtein Similarity (0 to 1)
     */
    levenshteinSimilarity(s1: string, s2: string): number {
        if (!s1 && !s2) return 1;
        if (!s1 || !s2) return 0;

        const maxLen = Math.max(String(s1).length, String(s2).length);
        if (maxLen === 0) return 1;

        const distance = this.levenshteinDistance(s1, s2);
        return 1 - (distance / maxLen);
    }

    /**
     * Amount Similarity with tolerance
     */
    amountSimilarity(amount1: number, amount2: number, tolerancePercent: number = 2): number {
        if (amount1 === 0 && amount2 === 0) return 1;
        if (amount1 === 0 || amount2 === 0) return 0;

        const diff = Math.abs(amount1 - amount2);
        const avg = (amount1 + amount2) / 2;
        const percentDiff = (diff / avg) * 100;

        if (percentDiff <= tolerancePercent) return 1;
        if (percentDiff <= tolerancePercent * 2) return 0.8;
        if (percentDiff <= tolerancePercent * 5) return 0.5;
        return 0;
    }

    /**
     * Date Similarity with tolerance
     */
    dateSimilarity(date1: string, date2: string, toleranceDays: number = 3): number {
        try {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= toleranceDays) return 1;
            if (diffDays <= toleranceDays * 2) return 0.8;
            if (diffDays <= toleranceDays * 5) return 0.5;
            return 0.2;
        } catch {
            return 0.5;
        }
    }

    /**
     * Calculate Shipment DNA Similarity
     * Weighted multi-factor matching
     */
    calculateShipmentDNA(invoice1: InvoiceHistory, invoice2: InvoiceHistory): {
        overallSimilarity: number;
        componentScores: {
            invoiceNumber: number;
            vendorId: number;
            amount: number;
            date: number;
            vehicleNumber: number;
        };
        isPotentialDuplicate: boolean;
        isLikelyDuplicate: boolean;
    } {
        const weights = {
            invoiceNumber: 0.15,
            vendorId: 0.20,
            amount: 0.30,
            date: 0.20,
            vehicleNumber: 0.15
        };

        const scores = {
            invoiceNumber: this.levenshteinSimilarity(invoice1.invoiceNumber, invoice2.invoiceNumber),
            vendorId: invoice1.vendorId === invoice2.vendorId ? 1 : 0,
            amount: this.amountSimilarity(invoice1.totalAmount, invoice2.totalAmount),
            date: this.dateSimilarity(invoice1.submittedDate, invoice2.submittedDate),
            vehicleNumber: this.levenshteinSimilarity(invoice1.vehicleNumber || '', invoice2.vehicleNumber || '')
        };

        const overallSimilarity =
            scores.invoiceNumber * weights.invoiceNumber +
            scores.vendorId * weights.vendorId +
            scores.amount * weights.amount +
            scores.date * weights.date +
            scores.vehicleNumber * weights.vehicleNumber;

        return {
            overallSimilarity: Math.round(overallSimilarity * 10000) / 10000,
            componentScores: {
                invoiceNumber: Math.round(scores.invoiceNumber * 100) / 100,
                vendorId: scores.vendorId,
                amount: Math.round(scores.amount * 100) / 100,
                date: Math.round(scores.date * 100) / 100,
                vehicleNumber: Math.round(scores.vehicleNumber * 100) / 100
            },
            isPotentialDuplicate: overallSimilarity >= 0.85,
            isLikelyDuplicate: overallSimilarity >= 0.95
        };
    }

    /**
     * Scan all invoices for fuzzy duplicates
     */
    scanFuzzyDuplicates(threshold: number = 0.85): FuzzyDuplicateResult[] {
        const results: FuzzyDuplicateResult[] = [];
        const checkedPairs = new Set<string>();

        for (let i = 0; i < this.invoiceHistory.length; i++) {
            for (let j = i + 1; j < this.invoiceHistory.length; j++) {
                const inv1 = this.invoiceHistory[i];
                const inv2 = this.invoiceHistory[j];

                // Skip different vendors
                if (inv1.vendorId !== inv2.vendorId) continue;

                // Skip already checked pairs
                const pairId = [inv1.invoiceNumber, inv2.invoiceNumber].sort().join('|');
                if (checkedPairs.has(pairId)) continue;
                checkedPairs.add(pairId);

                const dna = this.calculateShipmentDNA(inv1, inv2);

                if (dna.overallSimilarity >= threshold) {
                    results.push({
                        originalInvoice: inv1,
                        potentialDuplicate: inv2,
                        overallSimilarity: dna.overallSimilarity,
                        componentScores: dna.componentScores,
                        riskLevel: dna.isLikelyDuplicate ? 'HIGH' : dna.isPotentialDuplicate ? 'MEDIUM' : 'LOW',
                        recommendation: dna.isLikelyDuplicate ? 'BLOCK' : 'REVIEW'
                    });
                }
            }
        }

        return results.sort((a, b) => b.overallSimilarity - a.overallSimilarity);
    }

    /**
     * Get fuzzy duplicates summary for dashboard
     */
    getFuzzyDuplicateSummary(): {
        totalScanned: number;
        duplicatesFound: number;
        highRiskCount: number;
        mediumRiskCount: number;
        amountAtRisk: number;
        topDuplicates: FuzzyDuplicateResult[];
    } {
        const duplicates = this.scanFuzzyDuplicates(0.85);
        const highRisk = duplicates.filter(d => d.riskLevel === 'HIGH');
        const mediumRisk = duplicates.filter(d => d.riskLevel === 'MEDIUM');

        const amountAtRisk = highRisk.reduce((sum, d) =>
            sum + d.potentialDuplicate.totalAmount, 0);

        return {
            totalScanned: this.invoiceHistory.length,
            duplicatesFound: duplicates.length,
            highRiskCount: highRisk.length,
            mediumRiskCount: mediumRisk.length,
            amountAtRisk,
            topDuplicates: duplicates.slice(0, 5)
        };
    }

    /**
     * Add invoice to history
     */
    addToHistory(invoice: SupplierInvoice): void {
        const historyEntry: InvoiceHistory = {
            invoiceNumber: invoice.invoiceNumber,
            vendorId: invoice.supplierId,
            vendorName: invoice.supplierName,
            submittedDate: invoice.submittedDate,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            lrNumber: invoice.lrNumber,
            vehicleNumber: (invoice as any).vehicleNumber
        };

        this.invoiceHistory.push(historyEntry);
        this.cleanOldHistory();
    }

    /**
     * Check for duplicate invoice (enhanced with fuzzy matching)
     */
    checkDuplicate(invoice: Partial<SupplierInvoice>): DuplicateCheckResult {
        const matches: InvoiceHistory[] = [];
        let duplicateType: DuplicateCheckResult['duplicateType'] | undefined;
        let confidence: DuplicateCheckResult['confidence'] = 'low';
        let similarityScore: number | undefined;
        let componentScores: DuplicateCheckResult['componentScores'] | undefined;

        // 1. Check invoice number uniqueness (vendor-wise) - EXACT
        const invoiceNumberMatches = this.invoiceHistory.filter(h =>
            h.invoiceNumber === invoice.invoiceNumber &&
            h.vendorId === invoice.supplierId
        );

        if (invoiceNumberMatches.length > 0) {
            matches.push(...invoiceNumberMatches);
            duplicateType = 'invoice_number';
            confidence = 'high';
        }

        // 2. Check LR number uniqueness (vendor-wise)
        if (invoice.lrNumber && !duplicateType) {
            const lrMatches = this.invoiceHistory.filter(h =>
                h.lrNumber === invoice.lrNumber &&
                h.vendorId === invoice.supplierId
            );

            if (lrMatches.length > 0) {
                matches.push(...lrMatches);
                duplicateType = 'lr_number';
                confidence = 'high';
            }
        }

        // 3. FUZZY MATCHING - Check for similar invoice numbers
        if (!duplicateType) {
            const targetInvoice: InvoiceHistory = {
                invoiceNumber: invoice.invoiceNumber || '',
                vendorId: invoice.supplierId || '',
                vendorName: '',
                submittedDate: invoice.submittedDate || '',
                totalAmount: invoice.totalAmount || 0,
                status: '',
                lrNumber: invoice.lrNumber || '',
                vehicleNumber: (invoice as any).vehicleNumber
            };

            for (const historyInvoice of this.invoiceHistory) {
                if (historyInvoice.vendorId !== invoice.supplierId) continue;
                if (historyInvoice.invoiceNumber === invoice.invoiceNumber) continue;

                const dna = this.calculateShipmentDNA(targetInvoice, historyInvoice);

                if (dna.isPotentialDuplicate) {
                    matches.push(historyInvoice);
                    duplicateType = 'fuzzy_match';
                    confidence = dna.isLikelyDuplicate ? 'high' : 'medium';
                    similarityScore = dna.overallSimilarity;
                    componentScores = {
                        invoiceNumber: dna.componentScores.invoiceNumber,
                        amount: dna.componentScores.amount,
                        date: dna.componentScores.date,
                        vehicleNumber: dna.componentScores.vehicleNumber
                    };
                    break;
                }
            }
        }

        // 4. Check exact match (amount + date + vendor)
        if (invoice.totalAmount && invoice.submittedDate && !duplicateType) {
            const exactMatches = this.invoiceHistory.filter(h =>
                h.vendorId === invoice.supplierId &&
                h.totalAmount === invoice.totalAmount &&
                h.submittedDate === invoice.submittedDate
            );

            if (exactMatches.length > 0) {
                matches.push(...exactMatches);
                duplicateType = 'exact_match';
                confidence = 'medium';
            }
        }

        // Generate message
        let message = '';
        if (matches.length > 0) {
            switch (duplicateType) {
                case 'invoice_number':
                    message = `Invoice number "${invoice.invoiceNumber}" already exists for this vendor.`;
                    break;
                case 'lr_number':
                    message = `LR number "${invoice.lrNumber}" already exists for this vendor.`;
                    break;
                case 'fuzzy_match':
                    message = `Potential duplicate detected: Similar invoice "${matches[0]?.invoiceNumber}" found with ${Math.round((similarityScore || 0) * 100)}% similarity.`;
                    break;
                case 'exact_match':
                    message = `Possible duplicate: Same vendor, amount, and date found.`;
                    break;
            }
        } else {
            message = 'No duplicates found. Invoice is unique.';
        }

        return {
            isDuplicate: matches.length > 0,
            duplicateType,
            matchedInvoices: matches,
            confidence,
            message,
            similarityScore,
            componentScores
        };
    }

    /**
     * Get invoice history for a vendor
     */
    getVendorHistory(vendorId: string, limit: number = 50): InvoiceHistory[] {
        return this.invoiceHistory
            .filter(h => h.vendorId === vendorId)
            .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
            .slice(0, limit);
    }

    /**
     * Get all history
     */
    getAllHistory(): InvoiceHistory[] {
        return this.invoiceHistory;
    }

    /**
     * Get duplicate attempts (for reporting)
     */
    getDuplicateAttempts(days: number = 30): {
        vendorId: string;
        vendorName: string;
        duplicateCount: number;
        lastAttempt: string;
    }[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const duplicates = new Map<string, { count: number; lastDate: string; name: string }>();

        this.invoiceHistory.forEach(invoice => {
            const invoiceDate = new Date(invoice.submittedDate);
            if (invoiceDate < cutoffDate) return;

            // Check if this invoice number appears multiple times
            const sameInvoiceCount = this.invoiceHistory.filter(h =>
                h.invoiceNumber === invoice.invoiceNumber &&
                h.vendorId === invoice.vendorId
            ).length;

            if (sameInvoiceCount > 1) {
                const existing = duplicates.get(invoice.vendorId);
                if (!existing || invoiceDate > new Date(existing.lastDate)) {
                    duplicates.set(invoice.vendorId, {
                        count: (existing?.count || 0) + 1,
                        lastDate: invoice.submittedDate,
                        name: invoice.vendorName
                    });
                }
            }
        });

        return Array.from(duplicates.entries()).map(([vendorId, data]) => ({
            vendorId,
            vendorName: data.name,
            duplicateCount: data.count,
            lastAttempt: data.lastDate
        }));
    }

    /**
     * Clean history older than 5 years
     */
    private cleanOldHistory(): void {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - this.HISTORY_YEARS);

        this.invoiceHistory = this.invoiceHistory.filter(h => {
            const invoiceDate = new Date(h.submittedDate);
            return invoiceDate >= cutoffDate;
        });
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        totalInvoices: number;
        uniqueVendors: number;
        duplicateRate: number;
        oldestInvoice: string;
        newestInvoice: string;
        fuzzyDuplicatesDetected: number;
        amountAtRisk: number;
    } {
        const uniqueVendors = new Set(this.invoiceHistory.map(h => h.vendorId)).size;

        // Calculate duplicate rate
        const invoiceNumbers = this.invoiceHistory.map(h => h.invoiceNumber);
        const uniqueInvoiceNumbers = new Set(invoiceNumbers).size;
        const duplicateRate = ((invoiceNumbers.length - uniqueInvoiceNumbers) / invoiceNumbers.length) * 100;

        const dates = this.invoiceHistory.map(h => new Date(h.submittedDate));
        const oldestInvoice = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0] : 'N/A';
        const newestInvoice = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0] : 'N/A';

        const fuzzyResults = this.scanFuzzyDuplicates(0.85);
        const amountAtRisk = fuzzyResults
            .filter(d => d.riskLevel === 'HIGH')
            .reduce((sum, d) => sum + d.potentialDuplicate.totalAmount, 0);

        return {
            totalInvoices: this.invoiceHistory.length,
            uniqueVendors,
            duplicateRate: Math.round(duplicateRate * 10) / 10,
            oldestInvoice,
            newestInvoice,
            fuzzyDuplicatesDetected: fuzzyResults.length,
            amountAtRisk
        };
    }

    /**
     * Clear all history (for testing)
     */
    clearHistory(): void {
        this.invoiceHistory = [];
    }

    /**
     * Reset to demo data
     */
    resetToDemoData(): void {
        this.initializeTCIDemoData();
    }
}

export default new DuplicateDetectionService();

