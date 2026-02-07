
import { Invoice } from '../types';

export interface GLRule {
    id: string;
    condition: (inv: Invoice) => boolean;
    allocation: {
        code: string;
        segment: string;
        color: string;
    };
    priority: number;
}

// Mock Business Rules Registry
const GL_RULES: GLRule[] = [
    // 1. High Priority: Accessorials like Demurrage/Detention go to specific 'Waste' codes
    {
        id: 'RULE_ACCESSORIAL',
        priority: 1,
        condition: (inv) => inv.lineItems.some(i =>
            i.description.toLowerCase().includes('demurrage') ||
            i.description.toLowerCase().includes('detention') ||
            i.description.toLowerCase().includes('storage')
        ),
        allocation: { code: '999-99', segment: 'Logistics Waste / Penalties', color: 'bg-red-500' }
    },
    // 2. Specific Project: Transformers for Power Grids
    {
        id: 'RULE_PROJECT_TRANSFORMER',
        priority: 2,
        condition: (inv) => inv.logistics?.containerType === '40HC' || inv.logistics?.containerType === '45HC',
        allocation: { code: '101-55', segment: 'Transformers Project (PG)', color: 'bg-teal-500' }
    },
    // 3. Regional Logic: India goes to India Ops
    {
        id: 'RULE_REGION_INDIA',
        priority: 3,
        condition: (inv) => inv.origin.includes(', IN') || inv.destination.includes(', IN') || inv.currency === 'INR',
        allocation: { code: 'IN-101', segment: 'India Operations', color: 'bg-orange-500' }
    },
    // 4. Default: General Freight
    {
        id: 'RULE_DEFAULT',
        priority: 10,
        condition: () => true, // Fallback
        allocation: { code: '101-00', segment: 'General Freight', color: 'bg-blue-500' }
    }
];

export const generateGLAllocation = (invoice: Invoice) => {
    // Sort rules by priority (lower is important)
    const rules = [...GL_RULES].sort((a, b) => a.priority - b.priority);

    // Find primary rule
    const matchedRule = rules.find(r => r.condition(invoice)) || GL_RULES[GL_RULES.length - 1];

    // Logic for Partial Allocation (e.g., if there are multiple line items needing split)
    // For this v1 engine, we will allocate 100% to the highest priority match rule found,
    // UNLESS variance exists, where we might split.

    // Advanced: If variance > 0, split the variance to a variance account?
    // Let's implement that: Base Amount -> Rule, Variance -> Variance Account.

    const segments = [];

    if (invoice.variance > 0 && invoice.status !== 'APPROVED') {
        // Split Logic
        const approvedAmt = invoice.amount - invoice.variance;
        segments.push({
            ...matchedRule.allocation,
            amount: approvedAmt,
            percentage: Math.round((approvedAmt / invoice.amount) * 100),
        });
        segments.push({
            code: 'VAR-001',
            segment: 'Price Variance Suspense',
            amount: invoice.variance,
            percentage: Math.round((invoice.variance / invoice.amount) * 100),
            color: 'bg-amber-500'
        });
    } else {
        // 100% Allocation
        segments.push({
            ...matchedRule.allocation,
            amount: invoice.amount,
            percentage: 100,
        });
    }

    return segments;
};
