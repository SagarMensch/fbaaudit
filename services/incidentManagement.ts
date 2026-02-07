// Centralized Incident Management Service
// This service manages ALL incidents across the entire application
// Cross-links: Blackbook ↔ Carrier Performance ↔ Vendor Scorecard

import { EventBus } from './eventBus';

export interface GlobalIncident {
    id: string;
    date: string;
    carrier: string;
    carrierId: string;
    type: 'PLACEMENT FAILURE' | 'TRANSIT DELAY' | 'DAMAGE' | 'POD DELAY' | 'INVOICE MISMATCH' | 'SLA BREACH' | 'QUALITY ISSUE';
    route?: string;
    shipmentId?: string;
    remarks: string;
    lossImpact: number;
    status: 'OPEN' | 'RESOLVED' | 'DISPUTED' | 'ESCALATED';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdBy: string;
    createdAt: string;
    resolvedAt?: string;
    escalationId?: string;
}

export interface Escalation {
    id: string;
    incidentId: string;
    carrier: string;
    date: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignedTo: string;
    escalatedBy: string;
    notes?: string;
}

class IncidentManagementService {
    private readonly INCIDENTS_KEY = 'global_incidents';
    private readonly ESCALATIONS_KEY = 'carrier_escalations';

    // Get all incidents
    getAllIncidents(): GlobalIncident[] {
        const incidents = localStorage.getItem(this.INCIDENTS_KEY);
        return incidents ? JSON.parse(incidents) : [];
    }

    // Get incidents by carrier
    getIncidentsByCarrier(carrierName: string): GlobalIncident[] {
        return this.getAllIncidents().filter(inc => inc.carrier === carrierName);
    }

    // Get incidents by status
    getIncidentsByStatus(status: string): GlobalIncident[] {
        return this.getAllIncidents().filter(inc => inc.status === status);
    }

    // Add new incident
    addIncident(incident: Omit<GlobalIncident, 'id' | 'createdAt'>): GlobalIncident {
        const incidents = this.getAllIncidents();
        const newIncident: GlobalIncident = {
            ...incident,
            id: `INC-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        incidents.push(newIncident);
        localStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(incidents));

        // Emit event for cross-module updates
        EventBus.emit('incident.created', {
            incidentId: newIncident.id,
            vendorId: newIncident.carrierId,
            vendorName: newIncident.carrier,
            type: newIncident.type,
            severity: newIncident.severity,
            lossImpact: newIncident.lossImpact
        });

        return newIncident;
    }

    // Update incident status
    updateIncidentStatus(incidentId: string, status: GlobalIncident['status']): void {
        const incidents = this.getAllIncidents();
        const incident = incidents.find(inc => inc.id === incidentId);
        if (incident) {
            incident.status = status;
            if (status === 'RESOLVED') {
                incident.resolvedAt = new Date().toISOString();

                // Emit event when incident is resolved
                EventBus.emit('incident.resolved', {
                    incidentId: incident.id,
                    vendorId: incident.carrierId,
                    vendorName: incident.carrier
                });
            }
            localStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(incidents));
        }
    }

    // Get all escalations
    getAllEscalations(): Escalation[] {
        const escalations = localStorage.getItem(this.ESCALATIONS_KEY);
        return escalations ? JSON.parse(escalations) : [];
    }

    // Create escalation
    createEscalation(incident: GlobalIncident, assignedTo: string = 'Operations Manager'): Escalation {
        const escalations = this.getAllEscalations();
        const escalation: Escalation = {
            id: `ESC-${Date.now()}`,
            incidentId: incident.id,
            carrier: incident.carrier,
            date: new Date().toISOString(),
            status: 'OPEN',
            priority: incident.severity === 'CRITICAL' ? 'CRITICAL' : incident.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            assignedTo,
            escalatedBy: 'System User'
        };
        escalations.push(escalation);
        localStorage.setItem(this.ESCALATIONS_KEY, JSON.stringify(escalations));

        // Update incident status to ESCALATED
        this.updateIncidentStatus(incident.id, 'ESCALATED');

        return escalation;
    }

    // Get escalations by carrier
    getEscalationsByCarrier(carrierName: string): Escalation[] {
        return this.getAllEscalations().filter(esc => esc.carrier === carrierName);
    }

    // Calculate CPS score impact from incidents
    calculateIncidentImpact(carrierName: string): number {
        const incidents = this.getIncidentsByCarrier(carrierName);
        const escalations = this.getEscalationsByCarrier(carrierName);

        let impact = 0;

        // Deduct points for open incidents
        const openIncidents = incidents.filter(inc => inc.status === 'OPEN');
        impact -= openIncidents.length * 2; // -2 points per open incident

        // Deduct points for escalations
        const openEscalations = escalations.filter(esc => esc.status === 'OPEN');
        impact -= openEscalations.length * 5; // -5 points per escalation

        // Deduct points for high severity incidents
        const criticalIncidents = incidents.filter(inc => inc.severity === 'CRITICAL');
        impact -= criticalIncidents.length * 3; // -3 points per critical incident

        return impact;
    }

    // Get incident statistics for a carrier
    getCarrierIncidentStats(carrierName: string) {
        const incidents = this.getIncidentsByCarrier(carrierName);
        const escalations = this.getEscalationsByCarrier(carrierName);

        return {
            total: incidents.length,
            open: incidents.filter(inc => inc.status === 'OPEN').length,
            escalated: incidents.filter(inc => inc.status === 'ESCALATED').length,
            resolved: incidents.filter(inc => inc.status === 'RESOLVED').length,
            totalLoss: incidents.reduce((sum, inc) => sum + inc.lossImpact, 0),
            escalationCount: escalations.length,
            criticalCount: incidents.filter(inc => inc.severity === 'CRITICAL').length
        };
    }

    // Initialize with existing incidents (migration helper)
    initializeFromExisting(incidents: any[]): void {
        const existing = this.getAllIncidents();
        if (existing.length === 0) {
            // Convert old format to new format
            const converted: GlobalIncident[] = incidents.map(inc => ({
                id: inc.id,
                date: inc.date,
                carrier: inc.carrier,
                carrierId: inc.carrierId || '',
                type: inc.type,
                route: inc.route,
                shipmentId: inc.shipmentId,
                remarks: inc.remarks,
                lossImpact: inc.lossImpact,
                status: inc.status,
                severity: inc.lossImpact > 20000 ? 'CRITICAL' : inc.lossImpact > 10000 ? 'HIGH' : inc.lossImpact > 5000 ? 'MEDIUM' : 'LOW',
                createdBy: 'System',
                createdAt: inc.date,
                escalationId: inc.escalationId
            }));
            localStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(converted));
        }
    }
}

export const incidentService = new IncidentManagementService();
