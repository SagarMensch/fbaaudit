import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MessageSquare, Lock, Globe, User, Download } from 'lucide-react';
import { Invoice, ChatMessage } from '../types';
import { disputeService } from '../services/disputeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DisputeChatProps {
    invoice: Invoice;
    onUpdateInvoice: (invoice: Invoice) => void;
    currentUser: { name: string; role: 'VENDOR' | 'AUDITOR' };
}

export const DisputeChat: React.FC<DisputeChatProps> = ({ invoice, onUpdateInvoice, currentUser }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    // Use local state for messages to allow instant updates
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Find the real ticket
    const ticketId = invoice.dispute?.ticketId || disputeService.getTicketByInvoice(invoice.invoiceNumber)?.ticketId;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = () => {
        if (!ticketId) {
            // Fallback to prop if no ticket found (simulated env)
            setMessages(invoice.dispute?.messages || []);
            return;
        }
        const ticket = disputeService.getTicket(ticketId);
        if (ticket) {
            setMessages(ticket.messages);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Dispute Transcript: ${ticketId || 'Unknown'}`, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Invoice: ${invoice.invoiceNumber}`, 14, 30);
        doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 35);

        // Table Data
        const tableData = messages.map(msg => [
            new Date(msg.timestamp).toLocaleString(),
            msg.sender + (msg.isInternal ? ' (Internal)' : ''),
            msg.content
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Time', 'Sender', 'Message']],
            body: tableData,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 40 },
                2: { cellWidth: 'auto' }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`Dispute_Transcript_${ticketId}.pdf`);
    };

    useEffect(() => {
        loadMessages();
        scrollToBottom();

        // Subscribe to updates
        const handleUpdate = () => loadMessages();
        window.addEventListener('disputes-updated', handleUpdate);
        return () => window.removeEventListener('disputes-updated', handleUpdate);
    }, [ticketId, invoice]); // Re-run if invoice changes

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;

        if (ticketId) {
            // Real Service Call
            const updatedTicket = disputeService.sendMessage(
                ticketId,
                newMessage,
                currentUser.name,
                currentUser.role,
                isInternal
            );

            // Optimistic update of parent invoice if needed
            if (updatedTicket) {
                // We don't necessarily need to update the entire invoice prop if we are using local state for messages,
                // but checking if status changed is good.
                // onUpdateInvoice({...invoice, dispute: updatedTicket}); 
            }
        } else {
            console.warn("No active ticket found for this invoice.");
        }

        setNewMessage('');
    };

    // ... (keep handleKeyDown and return JSX) ...
    // Just replace "invoice.dispute?.messages || []" usage with "messages" state

    // Render logic remains similar, just make sure to use `messages` variable from state
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center">
                    <MessageSquare size={18} className="text-gray-500 mr-2" />
                    <h3 className="font-semibold text-gray-800">Dispute Resolution Channel</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        title="Download Transcript"
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                        <Download size={14} /> Export PDF
                    </button>
                    <div className="text-xs text-gray-500">
                        Ticket: <span className="font-mono font-bold text-gray-700">{ticketId || 'NEW'}</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Start the conversation to resolve this dispute.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        // ... rest of map logic is same ...
                        const isMe = msg.role === currentUser.role; // Simplified check
                        const isSystem = msg.role === 'SYSTEM';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-2">
                                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                                        {msg.content} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-lg p-3 shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : msg.isInternal
                                            ? 'bg-yellow-50 border border-yellow-200 text-gray-800 rounded-bl-none'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1 gap-2">
                                        <span className={`text-xs font-bold ${isMe ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {msg.sender}
                                        </span>
                                        <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.isInternal && (
                                            <div className="flex items-center text-xs text-yellow-600 font-bold mb-1 border-b border-yellow-200 pb-1">
                                                <Lock size={10} className="mr-1" /> INTERNAL NOTE
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                {currentUser.role === 'AUDITOR' && (
                    <div className="flex items-center mb-2 space-x-4">
                        <label className="flex items-center text-xs cursor-pointer select-none">
                            <input
                                type="radio"
                                name="vis"
                                checked={!isInternal}
                                onChange={() => setIsInternal(false)}
                                className="mr-1.5"
                            />
                            <Globe size={12} className="mr-1 text-gray-500" />
                            Public (Vendor Visible)
                        </label>
                        <label className="flex items-center text-xs cursor-pointer select-none">
                            <input
                                type="radio"
                                name="vis"
                                checked={isInternal}
                                onChange={() => setIsInternal(true)}
                                className="mr-1.5"
                            />
                            <Lock size={12} className="mr-1 text-yellow-600" />
                            <span className="text-yellow-700 font-medium">Internal Note</span>
                        </label>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isInternal ? "Add an internal note..." : "Type a message to the vendor..."}
                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:outline-none resize-none text-sm transition-all ${isInternal
                                ? 'bg-yellow-50 border-yellow-200 focus:ring-yellow-200 focus:border-yellow-300'
                                : 'bg-gray-50 border-gray-200 focus:ring-blue-100 focus:border-blue-300'
                                }`}
                            rows={2}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className={`p-3 rounded-lg shadow-sm transition-all ${!newMessage.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                            }`}
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 text-right">
                    Press Enter to send • Shift + Enter for new line
                </div>
            </div>
        </div>
    );
};
