import React, { useState, useEffect } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { ticketService, Ticket, TicketMessage } from '../../services/ticketService';
import { Geo3DTicket, Geo3DMessageCircle, Geo3DUser, Geo3DBot, Geo3DPaperclip, Geo3DSend, Geo3DAlertTriangle } from './components/3DGeometricIcons';

interface ResolutionCenterProps {
    supplier: IndianSupplier;
}

export const ResolutionCenter: React.FC<ResolutionCenterProps> = ({ supplier }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Load Tickets from API
    const loadTickets = async () => {
        setLoading(true);
        const data = await ticketService.getTicketsForSupplier(supplier.id);
        setTickets(data);
        if (data.length > 0 && !activeTicket) {
            setActiveTicket(data[0]);
        } else if (activeTicket) {
            const updated = data.find(t => t.ticket_id === activeTicket.ticket_id);
            if (updated) setActiveTicket(updated);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTickets();
        const interval = setInterval(loadTickets, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [supplier.id]);

    const handleSend = async () => {
        if (!activeTicket || !newMessage.trim()) return;

        await ticketService.sendMessage(
            activeTicket.ticket_id,
            supplier.contactPerson || 'Supplier',
            'VENDOR',
            newMessage
        );

        setNewMessage('');
        loadTickets();
    };

    const handleCreateTicket = async () => {
        if (!newSubject.trim() || !newDescription.trim()) return;

        setIsCreating(true);
        const ticket = await ticketService.createTicket(
            supplier.id,
            supplier.name,
            newSubject,
            newDescription
        );

        if (ticket) {
            setActiveTicket(ticket);
            loadTickets();
        }

        setNewSubject('');
        setNewDescription('');
        setShowNewTicketModal(false);
        setIsCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans h-[calc(100vh-140px)] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Resolution Center
                    </h2>
                    <p className="text-slate-500 text-sm">Raise issues - AI routes to the right team</p>
                </div>
                <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00C805] hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 transition-all"
                >
                    <Geo3DTicket size={14} color="white" /> Raise Dispute
                </button>
            </div>

            {/* New Ticket Modal */}
            {showNewTicketModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Raise New Ticket</h3>
                            <p className="text-xs text-slate-500 mt-1">AI will automatically route to the right team</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Subject</label>
                                <input
                                    type="text"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="e.g., Payment delayed for invoice #123"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C805]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C805] resize-none"
                                />
                            </div>
                            <div className="bg-[#0062FF] rounded-lg p-3">
                                <p className="text-xs text-white">
                                    <strong>AI Routing:</strong> Your ticket will be analyzed and sent to:
                                </p>
                                <ul className="text-xs text-white mt-1 list-disc list-inside">
                                    <li>Payment issues → Finance Team (Zeya Kapoor)</li>
                                    <li>Delivery issues → Logistics Ops (Kaai Bansal)</li>
                                    <li>Contract issues → Enterprise Director (Atlas)</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowNewTicketModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTicket}
                                disabled={isCreating || !newSubject.trim() || !newDescription.trim()}
                                className="px-6 py-2 bg-[#00C805] hover:bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? 'Creating...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex gap-6 overflow-hidden">

                {/* Left: Ticket List */}
                <div className="w-1/3 flex flex-col gap-3 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Geo3DTicket size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No tickets yet</p>
                            <p className="text-xs mt-2">Click "Raise Dispute" to create one</p>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div
                                key={ticket.ticket_id}
                                onClick={() => setActiveTicket(ticket)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all group ${activeTicket?.ticket_id === ticket.ticket_id ? 'bg-slate-900 border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-[#00C805]'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${activeTicket?.ticket_id === ticket.ticket_id ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                        {ticket.ticket_id}
                                    </span>
                                    <span className={`text-[10px] font-bold ${activeTicket?.ticket_id === ticket.ticket_id ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {ticket.messages.length > 0 ? new Date(ticket.messages[ticket.messages.length - 1].created_at + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'New'}
                                    </span>
                                </div>
                                <h4 className={`font-bold text-sm mb-1 ${activeTicket?.ticket_id === ticket.ticket_id ? 'text-white' : 'text-slate-800'}`}>
                                    {ticket.subject}
                                </h4>
                                <p className={`text-xs truncate ${activeTicket?.ticket_id === ticket.ticket_id ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].content : 'No messages'}
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ticket.status === 'RESOLVED'
                                        ? 'text-green-500 bg-green-500/10 border border-green-500/20'
                                        : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                                        }`}>
                                        {ticket.status === 'RESOLVED' ? '● RESOLVED' : '● ' + ticket.status.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${activeTicket?.ticket_id === ticket.ticket_id ? 'bg-slate-700 text-slate-300' : 'bg-blue-50 text-blue-600'}`}>
                                        → {ticket.assigned_to}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right: Chat Interface */}
                {activeTicket ? (
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <Geo3DTicket size={32} color="#00C805" />
                                <div>
                                    <h3 className="font-bold text-slate-800">{activeTicket.subject}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase">
                                        {activeTicket.ticket_id} • Assigned to: {activeTicket.assigned_to}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${activeTicket.status === 'RESOLVED'
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}>
                                {activeTicket.status === 'RESOLVED' ? 'Resolved' : 'In Progress'}
                            </span>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                            {activeTicket.messages.map(msg => {
                                const isMe = msg.role === 'VENDOR';
                                return (
                                    <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className="shrink-0">
                                            {isMe ? <Geo3DUser size={32} color="#00C805" /> : <Geo3DBot size={32} color="#3B82F6" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm border max-w-[80%] ${isMe ? 'bg-[#00C805]/10 border-green-100 rounded-tr-none' : 'bg-white border-slate-100 rounded-tl-none'}`}>
                                            <p className="text-slate-800 text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                                            <span className={`text-[10px] font-bold mt-2 block ${isMe ? 'text-green-700' : 'text-slate-400'}`}>
                                                {msg.sender} • {new Date(msg.created_at + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        {activeTicket.status !== 'RESOLVED' && (
                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                        <Geo3DPaperclip size={16} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C805] font-medium"
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="p-3 bg-[#00C805] hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95"
                                    >
                                        <Geo3DSend size={16} color="white" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <div className="text-center text-gray-400">
                            <Geo3DTicket size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Select a ticket to view conversation</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
