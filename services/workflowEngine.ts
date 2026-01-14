// Workflow Engine for Multi-Stage Invoice Approvals
// Dynamic workflow routing based on vendor, amount, delivery type, and exceptions

import { SupplierInvoice } from './invoiceMatchingService';

export interface WorkflowStage {
    id: string;
    name: string;
    description: string;
    approverRole: string;
    approverEmail?: string;
    sequence: number;
    slaHours: number;
    escalationRole?: string;
    autoApprove?: boolean;
    autoApproveConditions?: {
        maxAmount?: number;
        noExceptions?: boolean;
        podUploaded?: boolean;
    };
}

export interface WorkflowRule {
    id: string;
    name: string;
    priority: number;
    conditions: {
        vendorCodes?: string[];
        minAmount?: number;
        maxAmount?: number;
        deliveryTypes?: string[];
        hasExceptions?: boolean;
        exceptionTypes?: string[];
        newLane?: boolean;
    };
    stages: WorkflowStage[];
    active: boolean;
}

export interface WorkflowInstance {
    id: string;
    invoiceId: string;
    ruleId: string;
    currentStage: number;
    stages: WorkflowStage[];
    history: {
        stageId: string;
        stageName: string;
        action: 'approved' | 'rejected' | 'sent_back' | 'escalated';
        approver: string;
        timestamp: string;
        comments?: string;
        slaBreached: boolean;
    }[];
    status: 'in_progress' | 'approved' | 'rejected' | 'escalated';
    createdDate: string;
    completedDate?: string;
}

class WorkflowEngine {
    private rules: WorkflowRule[] = [];
    private instances: WorkflowInstance[] = [];

    constructor() {
        this.initializeDefaultRules();
    }

    /**
     * Initialize default workflow rules
     */
    private initializeDefaultRules(): void {
        // Rule 1: High value invoices (>5L)
        this.rules.push({
            id: 'WF-HIGH-VALUE',
            name: 'High Value Invoice Workflow',
            priority: 1,
            conditions: {
                minAmount: 500000
            },
            stages: [
                {
                    id: 'STAGE-1',
                    name: 'Logistics Team Review',
                    description: 'Initial review by logistics team',
                    approverRole: 'LOGISTICS_MANAGER',
                    sequence: 1,
                    slaHours: 24
                },
                {
                    id: 'STAGE-2',
                    name: 'Finance Verification',
                    description: 'Financial validation and compliance check',
                    approverRole: 'FINANCE_MANAGER',
                    sequence: 2,
                    slaHours: 48
                },
                {
                    id: 'STAGE-3',
                    name: 'Director Approval',
                    description: 'Final approval by director',
                    approverRole: 'DIRECTOR',
                    sequence: 3,
                    slaHours: 72,
                    escalationRole: 'CFO'
                }
            ],
            active: true
        });

        // Rule 2: Exception invoices
        this.rules.push({
            id: 'WF-EXCEPTION',
            name: 'Exception Invoice Workflow',
            priority: 2,
            conditions: {
                hasExceptions: true
            },
            stages: [
                {
                    id: 'STAGE-1',
                    name: 'Exception Review',
                    description: 'Review discrepancies and exceptions',
                    approverRole: 'LOGISTICS_MANAGER',
                    sequence: 1,
                    slaHours: 12
                },
                {
                    id: 'STAGE-2',
                    name: 'Finance Approval',
                    description: 'Approve exception handling',
                    approverRole: 'FINANCE_MANAGER',
                    sequence: 2,
                    slaHours: 24
                }
            ],
            active: true
        });

        // Rule 3: New lane invoices
        this.rules.push({
            id: 'WF-NEW-LANE',
            name: 'New Lane Approval Workflow',
            priority: 3,
            conditions: {
                newLane: true
            },
            stages: [
                {
                    id: 'STAGE-1',
                    name: 'Contract Team Review',
                    description: 'Validate new lane and temporary rate',
                    approverRole: 'CONTRACT_MANAGER',
                    sequence: 1,
                    slaHours: 48
                },
                {
                    id: 'STAGE-2',
                    name: 'Logistics Approval',
                    description: 'Approve lane addition',
                    approverRole: 'LOGISTICS_MANAGER',
                    sequence: 2,
                    slaHours: 24
                }
            ],
            active: true
        });

        // Rule 4: Standard workflow (default)
        this.rules.push({
            id: 'WF-STANDARD',
            name: 'Standard Invoice Workflow',
            priority: 99,
            conditions: {},
            stages: [
                {
                    id: 'STAGE-1',
                    name: 'Logistics Review',
                    description: 'Standard logistics review',
                    approverRole: 'LOGISTICS_TEAM',
                    sequence: 1,
                    slaHours: 24,
                    autoApprove: true,
                    autoApproveConditions: {
                        maxAmount: 100000,
                        noExceptions: true,
                        podUploaded: true
                    }
                },
                {
                    id: 'STAGE-2',
                    name: 'Finance Posting',
                    description: 'Post to finance system',
                    approverRole: 'FINANCE_TEAM',
                    sequence: 2,
                    slaHours: 48
                }
            ],
            active: true
        });
    }

    /**
     * Find applicable workflow rule for invoice
     */
    findApplicableRule(
        invoice: Partial<SupplierInvoice>,
        hasExceptions: boolean,
        isNewLane: boolean
    ): WorkflowRule | null {
        const applicableRules = this.rules
            .filter(rule => {
                if (!rule.active) return false;

                const cond = rule.conditions;

                // Check vendor codes
                if (cond.vendorCodes && invoice.supplierId && !cond.vendorCodes.includes(invoice.supplierId)) {
                    return false;
                }

                // Check amount range
                if (cond.minAmount && invoice.totalAmount && invoice.totalAmount < cond.minAmount) {
                    return false;
                }
                if (cond.maxAmount && invoice.totalAmount && invoice.totalAmount > cond.maxAmount) {
                    return false;
                }

                // Check exceptions
                if (cond.hasExceptions !== undefined && cond.hasExceptions !== hasExceptions) {
                    return false;
                }

                // Check new lane
                if (cond.newLane !== undefined && cond.newLane !== isNewLane) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => a.priority - b.priority);

        return applicableRules[0] || null;
    }

    /**
     * Create workflow instance for invoice
     */
    createWorkflowInstance(
        invoiceId: string,
        invoice: Partial<SupplierInvoice>,
        hasExceptions: boolean,
        isNewLane: boolean
    ): WorkflowInstance | null {
        const rule = this.findApplicableRule(invoice, hasExceptions, isNewLane);
        if (!rule) return null;

        const instance: WorkflowInstance = {
            id: `WFI-${Date.now()}`,
            invoiceId,
            ruleId: rule.id,
            currentStage: 0,
            stages: rule.stages,
            history: [],
            status: 'in_progress',
            createdDate: new Date().toISOString()
        };

        this.instances.push(instance);
        return instance;
    }

    /**
     * Approve current stage
     */
    approveStage(
        instanceId: string,
        approver: string,
        comments?: string
    ): WorkflowInstance | null {
        const instance = this.instances.find(i => i.id === instanceId);
        if (!instance) return null;

        const currentStage = instance.stages[instance.currentStage];
        const slaBreached = this.isSLABreached(instance, instance.currentStage);

        instance.history.push({
            stageId: currentStage.id,
            stageName: currentStage.name,
            action: 'approved',
            approver,
            timestamp: new Date().toISOString(),
            comments,
            slaBreached
        });

        // Move to next stage or complete
        if (instance.currentStage < instance.stages.length - 1) {
            instance.currentStage++;
        } else {
            instance.status = 'approved';
            instance.completedDate = new Date().toISOString();
        }

        return instance;
    }

    /**
     * Reject invoice
     */
    rejectStage(
        instanceId: string,
        approver: string,
        comments: string
    ): WorkflowInstance | null {
        const instance = this.instances.find(i => i.id === instanceId);
        if (!instance) return null;

        const currentStage = instance.stages[instance.currentStage];
        const slaBreached = this.isSLABreached(instance, instance.currentStage);

        instance.history.push({
            stageId: currentStage.id,
            stageName: currentStage.name,
            action: 'rejected',
            approver,
            timestamp: new Date().toISOString(),
            comments,
            slaBreached
        });

        instance.status = 'rejected';
        instance.completedDate = new Date().toISOString();

        return instance;
    }

    /**
     * Send back for clarification
     */
    sendBack(
        instanceId: string,
        approver: string,
        comments: string
    ): WorkflowInstance | null {
        const instance = this.instances.find(i => i.id === instanceId);
        if (!instance) return null;

        const currentStage = instance.stages[instance.currentStage];

        instance.history.push({
            stageId: currentStage.id,
            stageName: currentStage.name,
            action: 'sent_back',
            approver,
            timestamp: new Date().toISOString(),
            comments,
            slaBreached: false
        });

        return instance;
    }

    /**
     * Escalate to higher authority
     */
    escalate(
        instanceId: string,
        approver: string,
        reason: string
    ): WorkflowInstance | null {
        const instance = this.instances.find(i => i.id === instanceId);
        if (!instance) return null;

        const currentStage = instance.stages[instance.currentStage];

        instance.history.push({
            stageId: currentStage.id,
            stageName: currentStage.name,
            action: 'escalated',
            approver,
            timestamp: new Date().toISOString(),
            comments: reason,
            slaBreached: true
        });

        instance.status = 'escalated';

        return instance;
    }

    /**
     * Check if SLA is breached
     */
    isSLABreached(instance: WorkflowInstance, stageIndex: number): boolean {
        const stage = instance.stages[stageIndex];
        const stageStartTime = stageIndex === 0
            ? new Date(instance.createdDate)
            : new Date(instance.history[stageIndex - 1].timestamp);

        const now = new Date();
        const hoursPassed = (now.getTime() - stageStartTime.getTime()) / (1000 * 60 * 60);

        return hoursPassed > stage.slaHours;
    }

    /**
     * Get pending approvals for role
     */
    getPendingApprovals(role: string): WorkflowInstance[] {
        return this.instances.filter(i => {
            if (i.status !== 'in_progress') return false;
            const currentStage = i.stages[i.currentStage];
            return currentStage.approverRole === role;
        });
    }

    /**
     * Get workflow instance by invoice ID
     */
    getWorkflowByInvoiceId(invoiceId: string): WorkflowInstance | undefined {
        return this.instances.find(i => i.invoiceId === invoiceId);
    }

    /**
     * Get all workflow instances
     */
    getAllInstances(): WorkflowInstance[] {
        return this.instances;
    }

    /**
     * Get workflow statistics
     */
    getStatistics(): {
        totalWorkflows: number;
        inProgress: number;
        approved: number;
        rejected: number;
        escalated: number;
        avgApprovalTime: number;
        slaBreachRate: number;
    } {
        const total = this.instances.length;
        const inProgress = this.instances.filter(i => i.status === 'in_progress').length;
        const approved = this.instances.filter(i => i.status === 'approved').length;
        const rejected = this.instances.filter(i => i.status === 'rejected').length;
        const escalated = this.instances.filter(i => i.status === 'escalated').length;

        // Calculate average approval time
        const completedInstances = this.instances.filter(i => i.completedDate);
        const totalTime = completedInstances.reduce((sum, i) => {
            const start = new Date(i.createdDate).getTime();
            const end = new Date(i.completedDate!).getTime();
            return sum + (end - start);
        }, 0);
        const avgApprovalTime = completedInstances.length > 0
            ? totalTime / completedInstances.length / (1000 * 60 * 60) // hours
            : 0;

        // Calculate SLA breach rate
        const totalStages = this.instances.reduce((sum, i) => sum + i.history.length, 0);
        const breachedStages = this.instances.reduce((sum, i) =>
            sum + i.history.filter(h => h.slaBreached).length, 0
        );
        const slaBreachRate = totalStages > 0 ? (breachedStages / totalStages) * 100 : 0;

        return {
            totalWorkflows: total,
            inProgress,
            approved,
            rejected,
            escalated,
            avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
            slaBreachRate: Math.round(slaBreachRate * 10) / 10
        };
    }
}

export default new WorkflowEngine();
