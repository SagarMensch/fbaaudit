// Workflow Engine for Master Data Governance
// Multi-level approvals, change requests, audit trails

export type WorkflowStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type WorkflowType = 'LOCATION_CREATE' | 'LOCATION_UPDATE' | 'LOCATION_DELETE' |
    'FUEL_RULE_CREATE' | 'FUEL_RULE_UPDATE' |
    'LANE_CREATE' | 'LANE_RATE_CHANGE' |
    'VEHICLE_CREATE' | 'ACCESSORIAL_CREATE';

export interface WorkflowRequest {
    id: string;
    type: WorkflowType;
    title: string;
    description: string;
    requestedBy: string;
    requestedDate: string;
    status: WorkflowStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    // Change details
    entityId?: string;
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    currentData?: any;
    proposedData: any;

    // Approval chain
    approvalLevels: ApprovalLevel[];
    currentLevel: number;

    // Audit
    comments: WorkflowComment[];
    auditTrail: AuditEntry[];
}

export interface ApprovalLevel {
    level: number;
    approverRole: string;
    approverName?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedDate?: string;
    comments?: string;
}

export interface WorkflowComment {
    id: string;
    author: string;
    date: string;
    text: string;
    type: 'COMMENT' | 'QUESTION' | 'RESPONSE';
}

export interface AuditEntry {
    timestamp: string;
    action: string;
    performedBy: string;
    details: string;
}

class WorkflowEngine {
    private STORAGE_KEY = 'workflow_requests_v1';
    private requests: WorkflowRequest[] = [];

    constructor() {
        this.load();
    }

    private load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.requests = JSON.parse(stored);
        }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.requests));
    }

    /**
     * Create a new workflow request
     */
    public createRequest(request: Omit<WorkflowRequest, 'id' | 'requestedDate' | 'status' | 'currentLevel' | 'comments' | 'auditTrail'>): WorkflowRequest {
        const newRequest: WorkflowRequest = {
            ...request,
            id: `WF-${Date.now()}`,
            requestedDate: new Date().toISOString(),
            status: 'DRAFT',
            currentLevel: 0,
            comments: [],
            auditTrail: [{
                timestamp: new Date().toISOString(),
                action: 'REQUEST_CREATED',
                performedBy: request.requestedBy,
                details: `Created ${request.type} request`
            }]
        };

        this.requests.push(newRequest);
        this.save();
        return newRequest;
    }

    /**
     * Submit request for approval
     */
    public submitForApproval(requestId: string): boolean {
        const request = this.requests.find(r => r.id === requestId);
        if (!request || request.status !== 'DRAFT') return false;

        request.status = 'PENDING_APPROVAL';
        request.currentLevel = 0;
        request.approvalLevels[0].status = 'PENDING';

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'SUBMITTED_FOR_APPROVAL',
            performedBy: request.requestedBy,
            details: `Submitted to ${request.approvalLevels[0].approverRole}`
        });

        this.save();
        return true;
    }

    /**
     * Approve a request at current level
     */
    public approve(requestId: string, approverName: string, comments?: string): {
        success: boolean;
        message: string;
        finalApproval?: boolean;
    } {
        const request = this.requests.find(r => r.id === requestId);
        if (!request || request.status !== 'PENDING_APPROVAL') {
            return { success: false, message: 'Request not found or not pending approval' };
        }

        const currentLevel = request.approvalLevels[request.currentLevel];
        if (!currentLevel) {
            return { success: false, message: 'Invalid approval level' };
        }

        // Mark current level as approved
        currentLevel.status = 'APPROVED';
        currentLevel.approverName = approverName;
        currentLevel.approvedDate = new Date().toISOString();
        currentLevel.comments = comments;

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'LEVEL_APPROVED',
            performedBy: approverName,
            details: `Approved at level ${request.currentLevel + 1} (${currentLevel.approverRole})`
        });

        // Check if there are more levels
        if (request.currentLevel < request.approvalLevels.length - 1) {
            // Move to next level
            request.currentLevel++;
            request.approvalLevels[request.currentLevel].status = 'PENDING';

            request.auditTrail.push({
                timestamp: new Date().toISOString(),
                action: 'ESCALATED_TO_NEXT_LEVEL',
                performedBy: 'SYSTEM',
                details: `Escalated to ${request.approvalLevels[request.currentLevel].approverRole}`
            });

            this.save();
            return {
                success: true,
                message: `Approved. Escalated to ${request.approvalLevels[request.currentLevel].approverRole}`,
                finalApproval: false
            };
        } else {
            // Final approval - execute the change
            request.status = 'APPROVED';

            request.auditTrail.push({
                timestamp: new Date().toISOString(),
                action: 'FINAL_APPROVAL',
                performedBy: approverName,
                details: 'All approval levels completed. Request approved.'
            });

            // Execute the change
            this.executeChange(request);

            this.save();
            return {
                success: true,
                message: 'Request fully approved and executed',
                finalApproval: true
            };
        }
    }

    /**
     * Reject a request
     */
    public reject(requestId: string, approverName: string, reason: string): boolean {
        const request = this.requests.find(r => r.id === requestId);
        if (!request || request.status !== 'PENDING_APPROVAL') return false;

        const currentLevel = request.approvalLevels[request.currentLevel];
        currentLevel.status = 'REJECTED';
        currentLevel.approverName = approverName;
        currentLevel.approvedDate = new Date().toISOString();
        currentLevel.comments = reason;

        request.status = 'REJECTED';

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'REJECTED',
            performedBy: approverName,
            details: `Rejected at level ${request.currentLevel + 1}: ${reason}`
        });

        this.save();
        return true;
    }

    /**
     * Add comment to request
     */
    public addComment(requestId: string, author: string, text: string, type: WorkflowComment['type'] = 'COMMENT'): boolean {
        const request = this.requests.find(r => r.id === requestId);
        if (!request) return false;

        const comment: WorkflowComment = {
            id: `CMT-${Date.now()}`,
            author,
            date: new Date().toISOString(),
            text,
            type
        };

        request.comments.push(comment);

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'COMMENT_ADDED',
            performedBy: author,
            details: `Added ${type.toLowerCase()}: ${text.substring(0, 50)}...`
        });

        this.save();
        return true;
    }

    /**
     * Execute approved change
     */
    private executeChange(request: WorkflowRequest): void {
        // This would integrate with the actual master data services
        // For now, just log the execution

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'CHANGE_EXECUTED',
            performedBy: 'SYSTEM',
            details: `Executed ${request.changeType} for ${request.type}`
        });

        // In production, this would call:
        // - locationGroupingService.createZone() for LOCATION_CREATE
        // - laneMasterService.updateLane() for LANE_RATE_CHANGE
        // etc.
    }

    /**
     * Get all requests
     */
    public getAllRequests(): WorkflowRequest[] {
        return this.requests;
    }

    /**
     * Get pending requests for a specific approver role
     */
    public getPendingForRole(approverRole: string): WorkflowRequest[] {
        return this.requests.filter(r => {
            if (r.status !== 'PENDING_APPROVAL') return false;
            const currentLevel = r.approvalLevels[r.currentLevel];
            return currentLevel && currentLevel.approverRole === approverRole && currentLevel.status === 'PENDING';
        });
    }

    /**
     * Get requests by status
     */
    public getByStatus(status: WorkflowStatus): WorkflowRequest[] {
        return this.requests.filter(r => r.status === status);
    }

    /**
     * Get request by ID
     */
    public getById(id: string): WorkflowRequest | undefined {
        return this.requests.find(r => r.id === id);
    }

    /**
     * Cancel a request (only if in DRAFT or PENDING_APPROVAL)
     */
    public cancel(requestId: string, cancelledBy: string, reason: string): boolean {
        const request = this.requests.find(r => r.id === requestId);
        if (!request || (request.status !== 'DRAFT' && request.status !== 'PENDING_APPROVAL')) {
            return false;
        }

        request.status = 'CANCELLED';

        request.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'CANCELLED',
            performedBy: cancelledBy,
            details: `Cancelled: ${reason}`
        });

        this.save();
        return true;
    }

    /**
     * Get workflow statistics
     */
    public getStatistics() {
        return {
            total: this.requests.length,
            draft: this.requests.filter(r => r.status === 'DRAFT').length,
            pending: this.requests.filter(r => r.status === 'PENDING_APPROVAL').length,
            approved: this.requests.filter(r => r.status === 'APPROVED').length,
            rejected: this.requests.filter(r => r.status === 'REJECTED').length,
            cancelled: this.requests.filter(r => r.status === 'CANCELLED').length,
            byPriority: {
                critical: this.requests.filter(r => r.priority === 'CRITICAL' && r.status === 'PENDING_APPROVAL').length,
                high: this.requests.filter(r => r.priority === 'HIGH' && r.status === 'PENDING_APPROVAL').length,
                medium: this.requests.filter(r => r.priority === 'MEDIUM' && r.status === 'PENDING_APPROVAL').length,
                low: this.requests.filter(r => r.priority === 'LOW' && r.status === 'PENDING_APPROVAL').length,
            }
        };
    }

    /**
     * Create a standard approval chain based on request type
     */
    public static createStandardApprovalChain(type: WorkflowType, priority: WorkflowRequest['priority']): ApprovalLevel[] {
        const chains: Record<string, ApprovalLevel[]> = {
            'LOCATION_CREATE': [
                { level: 0, approverRole: 'Data Steward', status: 'PENDING' },
                { level: 1, approverRole: 'Master Data Manager', status: 'PENDING' }
            ],
            'LOCATION_UPDATE': [
                { level: 0, approverRole: 'Data Steward', status: 'PENDING' }
            ],
            'LANE_RATE_CHANGE': [
                { level: 0, approverRole: 'Pricing Analyst', status: 'PENDING' },
                { level: 1, approverRole: 'Pricing Manager', status: 'PENDING' },
                { level: 2, approverRole: 'Finance Director', status: 'PENDING' }
            ],
            'FUEL_RULE_CREATE': [
                { level: 0, approverRole: 'Fuel Analyst', status: 'PENDING' },
                { level: 1, approverRole: 'Operations Manager', status: 'PENDING' }
            ]
        };

        let chain = chains[type] || [{ level: 0, approverRole: 'Manager', status: 'PENDING' }];

        // For CRITICAL priority, add executive approval
        if (priority === 'CRITICAL') {
            chain.push({ level: chain.length, approverRole: 'Executive', status: 'PENDING' });
        }

        return chain;
    }
}

export const workflowEngine = new WorkflowEngine();
