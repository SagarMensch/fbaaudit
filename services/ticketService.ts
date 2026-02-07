/**
 * Ticket Service - API-based (PostgreSQL Backend via Flask)
 * Routes tickets to correct persona using AI classification
 */

const API_BASE = 'http://localhost:5000';

export interface TicketMessage {
    id: number;
    ticket_id: string;
    sender: string;
    role: string;
    content: string;
    created_at: string;
}

export interface Ticket {
    id: number;
    ticket_id: string;
    supplier_id: string;
    supplier_name: string;
    subject: string;
    status: string;
    priority: string;
    assigned_to: string;
    category: string;
    created_at: string;
    messages: TicketMessage[];
}

class TicketService {
    /**
     * Create a new ticket - AI will route it to correct persona
     */
    async createTicket(
        supplierId: string,
        supplierName: string,
        subject: string,
        message: string
    ): Promise<Ticket | null> {
        try {
            const res = await fetch(`${API_BASE}/api/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_id: supplierId,
                    supplier_name: supplierName,
                    subject,
                    message
                })
            });

            if (res.ok) {
                return await res.json();
            }
            console.error('Failed to create ticket:', await res.text());
            return null;
        } catch (e) {
            console.error('Create ticket error:', e);
            return null;
        }
    }

    /**
     * Get all tickets for a supplier
     */
    async getTicketsForSupplier(supplierId: string): Promise<Ticket[]> {
        try {
            const res = await fetch(`${API_BASE}/api/tickets?supplier_id=${encodeURIComponent(supplierId)}`);
            if (res.ok) {
                return await res.json();
            }
            return [];
        } catch (e) {
            console.error('Get tickets error:', e);
            return [];
        }
    }

    /**
     * Get single ticket by ID
     */
    async getTicket(ticketId: string): Promise<Ticket | null> {
        try {
            const res = await fetch(`${API_BASE}/api/tickets/${ticketId}`);
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (e) {
            console.error('Get ticket error:', e);
            return null;
        }
    }

    /**
     * Send a message to a ticket
     */
    async sendMessage(
        ticketId: string,
        sender: string,
        role: 'VENDOR' | 'AUDITOR' | 'SYSTEM',
        content: string
    ): Promise<TicketMessage | null> {
        try {
            const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender, role, content })
            });

            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (e) {
            console.error('Send message error:', e);
            return null;
        }
    }
}

export const ticketService = new TicketService();
