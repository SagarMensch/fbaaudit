import { Invoice, ChatMessage, Dispute } from '../types';

const STORAGE_KEY = 'dispute_tickets_v1';

// Initial Seed Data (so the user sees something immediately)
const INITIAL_TICKETS: Dispute[] = [
    {
        ticketId: 'TKT-9002',
        status: 'OPEN',
        priority: 'HIGH',
        assignedTo: 'Zeya Kapoor',
        invoiceId: 'TCI/2024/002', // Helper link
        subject: 'Shortage Deduction - TCI/2024/002', // Subject line
        messages: [
            {
                id: 'msg-1',
                sender: 'Atlas Bot',
                role: 'SYSTEM',
                content: "Hello! I've received your dispute regarding the shortage deduction. Can you please upload the digitally signed POD copy for verification?",
                timestamp: '2025-12-16T10:00:00Z',
                isInternal: false
            },
            {
                id: 'msg-2',
                sender: 'Rajesh Sharma',
                role: 'VENDOR',
                content: 'Sure, I have attached the signed copy below. Please check. [Attachment: Signed_POD_992.pdf]',
                timestamp: '2025-12-16T10:05:00Z',
                isInternal: false
            }
        ],
        history: []
    }
];

class DisputeService {
    private getAllTickets(): Dispute[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Seed initial data
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
            return INITIAL_TICKETS;
        }
        return JSON.parse(stored);
    }

    private saveAllTickets(tickets: Dispute[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
        // Dispatch event for cross-component sync
        window.dispatchEvent(new Event('disputes-updated'));
    }

    getTickets(): Dispute[] {
        return this.getAllTickets();
    }

    getTicket(ticketId: string): Dispute | undefined {
        return this.getAllTickets().find(t => t.ticketId === ticketId);
    }

    getTicketByInvoice(invoiceNumber: string): Dispute | undefined {
        // Also match partial invoice numbers if needed, but exact is better
        return this.getAllTickets().find(t => t.invoiceId === invoiceNumber || t.subject?.includes(invoiceNumber));
    }

    createTicket(invoice: Invoice, subject: string, initialMessage: string, sender: string, role: 'VENDOR' | 'AUDITOR'): Dispute {
        const tickets = this.getAllTickets();
        const newTicket: Dispute = {
            ticketId: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'OPEN',
            priority: 'MEDIUM',
            invoiceId: invoice.invoiceNumber,
            subject: subject,
            messages: [
                {
                    id: `msg-${Date.now()}`,
                    sender: sender,
                    role: role,
                    content: initialMessage,
                    timestamp: new Date().toISOString(),
                    isInternal: false
                }
            ],
            history: [{
                actor: role === 'VENDOR' ? 'Vendor' : 'SCM',
                timestamp: new Date().toISOString(),
                action: 'Ticket Created',
                comment: 'Dispute ticket raised.'
            }]
        };

        tickets.push(newTicket);
        this.saveAllTickets(tickets);
        return newTicket;
    }

    sendMessage(ticketId: string, content: string, sender: string, role: 'VENDOR' | 'AUDITOR' | 'SYSTEM', isInternal: boolean = false): Dispute | null {
        const tickets = this.getAllTickets();
        const ticketIndex = tickets.findIndex(t => t.ticketId === ticketId);

        if (ticketIndex === -1) return null;

        const ticket = tickets[ticketIndex];
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: sender,
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            isInternal: isInternal
        };

        ticket.messages.push(newMessage);

        // Auto-update status logic
        if (role === 'VENDOR' && ticket.status !== 'RESOLVED') {
            ticket.status = 'VENDOR_RESPONDED';
        } else if (role === 'AUDITOR' && ticket.status === 'VENDOR_RESPONDED') {
            ticket.status = 'UNDER_REVIEW';
        }

        tickets[ticketIndex] = ticket;
        this.saveAllTickets(tickets);
        return ticket;
    }

    // Helper for legacy method signature compatibility (optional)
    legacySendMessage(invoice: Invoice, content: string, sender: string, role: 'VENDOR' | 'AUDITOR' | 'SYSTEM', isInternal: boolean = false): Invoice {
        // This attempts to find the ticket linked to the invoice and update it
        // Then returns the updated invoice object
        const ticket = this.getTicketByInvoice(invoice.invoiceNumber);
        if (ticket) {
            this.sendMessage(ticket.ticketId!, content, sender, role, isInternal);
            // Return shallow copy with updated dispute
            const updatedTicket = this.getTicket(ticket.ticketId!)!;
            return { ...invoice, dispute: updatedTicket };
        } else {
            // fallback create new?
            return invoice;
        }
    }
}

export const disputeService = new DisputeService();
