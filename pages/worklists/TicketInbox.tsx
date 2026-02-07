import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Send, Filter, RefreshCw } from 'lucide-react';

interface TicketMessage {
    id: number;
    ticket_id: string;
    sender: string;
    role: string;
    content: string;
    created_at: string;
}

interface Ticket {
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

interface TicketInboxProps {
    currentUser: string; // e.g., "Zeya Kapoor", "Kaai Bansal", "Atlas"
}

const API_BASE = 'http://localhost:5000';

const categoryColors: { [key: string]: string } = {
    finance: '#00C805',
    logistics: '#0062FF',
    contracts: '#9945FF',
    technical: '#FF6B00'
};

const statusColors: { [key: string]: { bg: string; text: string } } = {
    OPEN: { bg: 'bg-amber-100', text: 'text-amber-700' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700' }
};

export const TicketInbox: React.FC<TicketInboxProps> = ({ currentUser }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('all');

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tickets?assignee=${encodeURIComponent(currentUser)}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
                if (data.length > 0 && !selectedTicket) {
                    setSelectedTicket(data[0]);
                }
            }
        } catch (e) {
            console.error('Failed to fetch tickets:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/api/tickets/${selectedTicket.ticket_id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: currentUser,
                    role: 'AUDITOR',
                    content: newMessage
                })
            });

            if (res.ok) {
                setNewMessage('');
                fetchTickets();
            }
        } catch (e) {
            console.error('Failed to send message:', e);
        }
    };

    const handleResolve = async () => {
        if (!selectedTicket) return;

        try {
            await fetch(`${API_BASE}/api/tickets/${selectedTicket.ticket_id}/status?status=RESOLVED`, {
                method: 'PUT'
            });
            fetchTickets();
        } catch (e) {
            console.error('Failed to resolve ticket:', e);
        }
    };

    const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

    return (
        <div className="h-full flex flex-col font-sans bg-gray-50">
            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tickets assigned to you from suppliers
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchTickets}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw size={18} className="text-gray-500" />
                        </button>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Ticket List */}
                <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No tickets assigned to you</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <div
                                key={ticket.ticket_id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${selectedTicket?.ticket_id === ticket.ticket_id
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-400">{ticket.ticket_id}</span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[ticket.status]?.bg || 'bg-gray-100'
                                            } ${statusColors[ticket.status]?.text || 'text-gray-600'}`}
                                    >
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">{ticket.subject}</h3>
                                <p className="text-xs text-gray-500 mb-2">
                                    From: {ticket.supplier_name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${categoryColors[ticket.category]}20`, color: categoryColors[ticket.category] }}
                                    >
                                        {ticket.category.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(ticket.created_at + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-gray-800">{selectedTicket.subject}</h2>
                                    <p className="text-xs text-gray-500">
                                        {selectedTicket.ticket_id} • {selectedTicket.supplier_name} • {selectedTicket.category}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.status !== 'RESOLVED' && (
                                        <button
                                            onClick={handleResolve}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {selectedTicket.messages.map((msg) => {
                                    const isMe = msg.role === 'AUDITOR';
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[70%] p-4 rounded-2xl ${isMe
                                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-[10px] mt-2 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {msg.sender} • {new Date(msg.created_at + 'Z').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input */}
                            {selectedTicket.status !== 'RESOLVED' && (
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type your reply..."
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Select a ticket to view conversation</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketInbox;
