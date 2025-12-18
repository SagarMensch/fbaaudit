import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Check, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    chartData?: any;
    chartType?: 'pie' | 'bar' | 'line';
    chartTitle?: string;
    intent?: string;
    actionResult?: string;
}

import { generateOllamaResponse } from '../services/ollamaService';
import { MOCK_INVOICES, SPEND_DATA, KPIS, MOCK_RATES, MOCK_PARTNERS, MOCK_BATCHES } from '../constants';
import { InvoiceStatus } from '../types';

interface AetherChatbotProps {
    onAction?: (action: string, entityId: string, details?: string) => boolean;
}

export const AetherChatbot: React.FC<AetherChatbotProps> = ({ onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Systems online. I am Vector. Ready to analyze your logistics data.", sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useOllama, setUseOllama] = useState(true); // Default to trying Ollama
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processLocalIntent = (input: string): Message | null => {
        const lowerInput = input.toLowerCase();

        // --- CONTEXTUAL CHARTS ---

        // 1. CARRIER GRAPH / PARTNER GRAPH
        if (lowerInput.includes('carrier') && (lowerInput.includes('graph') || lowerInput.includes('chart') || lowerInput.includes('count'))) {
            const carrierData = [
                { name: 'Ocean', value: MOCK_PARTNERS.filter(p => p.mode === 'Ocean').length * 10 }, // Speculative scaling for demo
                { name: 'Road', value: MOCK_PARTNERS.filter(p => p.mode.includes('Road')).length * 15 },
                { name: 'Air', value: 5 }
            ];
            return {
                id: Date.now().toString(),
                text: "Generating Engineering Schematic: **Carrier Network Density**.",
                sender: 'ai',
                timestamp: new Date(),
                chartType: 'bar',
                chartTitle: 'CARRIER COUNT BY MODE',
                chartData: carrierData
            };
        }

        // 2. SPEND GRAPH / TREND
        if (lowerInput.includes('spend') && (lowerInput.includes('graph') || lowerInput.includes('chart') || lowerInput.includes('trend'))) {
            const trendData = [
                { name: 'JAN', value: 45000 },
                { name: 'FEB', value: 52000 },
                { name: 'MAR', value: 48000 },
                { name: 'APR', value: 61000 },
                { name: 'MAY', value: 55000 },
                { name: 'JUN', value: 67000 },
            ];
            return {
                id: Date.now().toString(),
                text: "Generating Engineering Schematic: **6-Month Spend Trend**.",
                sender: 'ai',
                timestamp: new Date(),
                chartType: 'bar', // Using Bar for technical look, could be Line
                chartTitle: 'SPEND VELOCITY (K)',
                chartData: trendData
            };
        }

        // 3. INVOICE STATUS GRAPH
        if (lowerInput.includes('invoice') && (lowerInput.includes('graph') || lowerInput.includes('chart') || lowerInput.includes('status'))) {
            const statusData = [
                { name: 'PEND', value: MOCK_INVOICES.filter(i => i.status === 'PENDING').length },
                { name: 'APPR', value: MOCK_INVOICES.filter(i => i.status === 'APPROVED').length },
                { name: 'PAID', value: MOCK_INVOICES.filter(i => i.status === 'PAID').length },
                { name: 'EXCP', value: MOCK_INVOICES.filter(i => i.status === 'EXCEPTION').length }
            ];
            return {
                id: Date.now().toString(),
                text: "Generating Engineering Schematic: **Invoice Workflow Status**.",
                sender: 'ai',
                timestamp: new Date(),
                chartType: 'bar',
                chartTitle: 'INVOICE VOLUME BY STATUS',
                chartData: statusData
            };
        }

        // --- STANDARD INTENTS (Prioritized if no graph requested) ---

        // 1. PENDING INVOICES
        if (lowerInput.includes('pending') || (lowerInput.includes('how many') && lowerInput.includes('invoice'))) {
            const pendingInvoices = MOCK_INVOICES.filter(inv => inv.status === InvoiceStatus.PENDING);
            const count = pendingInvoices.length;
            const totalValue = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString();

            return {
                id: Date.now().toString(),
                text: `I found ${count} pending invoices awaiting approval, totaling ₹${totalValue}.\n\nWould you like me to highlight the urgent ones?`,
                sender: 'ai',
                timestamp: new Date(),
                intent: 'FILTER_PENDING'
            };
        }

        // 2. PLATFORM INFO / "WHAT IS THIS" / "EVERYTHING"
        if (lowerInput.includes('what is') || lowerInput.includes('platform') || lowerInput.includes('demo') || lowerInput.includes('everything')) {
            return {
                id: Date.now().toString(),
                text: `This is the **SequelString AI Control Tower** (v3.0).\n\n**Live System Status:**\n- **Contracts:** ${MOCK_RATES.length} Active Rate Cards\n- **Invoices:** ${MOCK_INVOICES.length} Processed (Last 30 Days)\n- **Payments:** ${MOCK_BATCHES.length} Batches Sent to Bank\n- **Vendors:** 3 Strategic Partners Integrated\n\nI am monitoring all logistics and finance flows in real-time.`,
                sender: 'ai',
                timestamp: new Date()
            };
        }

        // 3. TOTAL SPEND / FINANCIALS
        if (lowerInput.includes('spend') || lowerInput.includes('cost') || lowerInput.includes('budget')) {
            const totalSpend = KPIS.find(k => k.label === 'TOTAL SPEND (YTD)')?.value || '₹24.5M';
            return {
                id: Date.now().toString(),
                text: `Total Logistics Spend (YTD) is **${totalSpend}**.\n\nHere is the breakdown by mode:`,
                sender: 'ai',
                timestamp: new Date(),
                chartType: 'pie',
                chartTitle: 'SPEND BY MODE',
                chartData: SPEND_DATA.map(d => ({ name: d.name, value: d.spend }))
            };
        }

        // 4. APPROVED / PAID STATUS / PAYMENT STATUS
        if (lowerInput.includes('approved') || lowerInput.includes('paid') || lowerInput.includes('payment status')) {
            const paidCount = MOCK_INVOICES.filter(inv => inv.status === InvoiceStatus.PAID).length;
            const batches = MOCK_BATCHES.length;
            return {
                id: Date.now().toString(),
                text: `Payment Pipeline is **Active**.\n\n- **${paidCount}** Invoices Paid\n- **${batches}** Batches processed this week\n- Next Payment Run: Tomorrow, 10:00 AM IST.`,
                sender: 'ai',
                timestamp: new Date()
            };
        }

        // 5. CONTRACTS / RATES
        if (lowerInput.includes('contract') || lowerInput.includes('rate') || lowerInput.includes('agreement')) {
            const activeContracts = MOCK_RATES.length;
            return {
                id: Date.now().toString(),
                text: `There are **${activeContracts} Active Contracts** loaded in the Master.\n\nKey Partners: Maersk (Ocean), TCI Express (Road). All rates are live and being used for audit.`,
                sender: 'ai',
                timestamp: new Date()
            };
        }

        // 6. DEEP DIVE REPORT (AI ANALYSIS)
        if (lowerInput.includes('report') || lowerInput.includes('summary') || lowerInput.includes('analyze') || lowerInput.includes('analysis')) {
            // Find all matching data points to feed the AI
            const relevantInvoices = MOCK_INVOICES.filter(inv =>
                inv.carrier.toLowerCase().includes(lowerInput) ||
                inv.invoiceNumber.toLowerCase().includes(lowerInput)
            );
            const relevantRates = MOCK_RATES.filter(r =>
                r.carrier.toLowerCase().includes(lowerInput)
            );

            // If we found specific data, valid "Report" generation
            if (relevantInvoices.length > 0 || relevantRates.length > 0) {
                // Return null here to Fallback to the OLLAMA block below, 
                // BUT we need to pass this context. 
                // Since processLocalIntent is synchronous, we can't call async Ollama here easily.
                // STRATEGY: We will return a special "TRIGGER_AI" message or handle this in handleSend.
                // Simpler approach: Rewrite handleSend to detect this outcome.
                return {
                    id: Date.now().toString(),
                    text: `__TRIGGER_AI_REPORT__:${JSON.stringify({ invoices: relevantInvoices, rates: relevantRates })}`,
                    sender: 'ai',
                    timestamp: new Date(),
                    intent: 'AI_REPORT'
                };
            }
        }

        // 7. UNIVERSAL SEARCH (Fallback for simple "Find One" lookups)
        // Search Invoices
        const invoiceMatch = MOCK_INVOICES.find(inv =>
            inv.invoiceNumber.toLowerCase().includes(lowerInput) ||
            inv.carrier.toLowerCase().includes(lowerInput) ||
            inv.id.toLowerCase().includes(lowerInput)
        );
        if (invoiceMatch) {
            return {
                id: Date.now().toString(),
                text: `**Found Invoice #${invoiceMatch.invoiceNumber}**\n- Carrier: ${invoiceMatch.carrier}\n- Amount: ₹${invoiceMatch.amount.toLocaleString()}\n- Status: **${invoiceMatch.status}**\n- Date: ${invoiceMatch.date}`,
                sender: 'ai',
                timestamp: new Date()
            };
        }

        // Search Rates
        const rateMatch = MOCK_RATES.find(rate =>
            rate.carrier.toLowerCase().includes(lowerInput) ||
            rate.origin.toLowerCase().includes(lowerInput) ||
            rate.destination.toLowerCase().includes(lowerInput)
        );
        if (rateMatch) {
            return {
                id: Date.now().toString(),
                text: `**Found Contract Rate for ${rateMatch.carrier}**\n- Route: ${rateMatch.origin} -> ${rateMatch.destination}\n- Rate: ₹${rateMatch.rate.toLocaleString()}\n- Valid Until: ${rateMatch.validTo}`,
                sender: 'ai',
                timestamp: new Date()
            };
        }

        return null;
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        // DELAY SIMULATION FOR REALISM OR OLLAMA LATENCY
        setTimeout(async () => {
            try {
                // 1. TRY LOCAL INTELLIGENCE (Charts & Specific Lookups) FIRST
                // This ensures charts are always generated by our React code, which LLM can't do easily.
                const localResponse = processLocalIntent(newUserMessage.text);

                if (localResponse) {
                    // CHECK FOR AI REPORT TRIGGER
                    if (localResponse.text.startsWith('__TRIGGER_AI_REPORT__:')) {
                        const dataContext = JSON.parse(localResponse.text.replace('__TRIGGER_AI_REPORT__:', ''));

                        // GENERATE RICHER PROMPT FOR OLLAMA
                        const richPrompt = `
User Query: "${newUserMessage.text}"

I have retrieved the following specific data from the system:
INVOICES: ${JSON.stringify(dataContext.invoices)}
RATE CARDS: ${JSON.stringify(dataContext.rates)}

INSTRUCTIONS:
Please write a comprehensive, professional Logistics Report based EXACTLY on the invoices and rates provided above.
 Analyze the spend, carriers involved, and any status issues (pending vs paid).
 Do not make up data. Use the JSON provided using specific Invoice Numbers and Amounts.
`;
                        // Call Ollama with the Rich Prompt
                        if (useOllama) {
                            const reportText = await generateOllamaResponse(richPrompt);
                            if (reportText) {
                                let finalText = reportText;
                                let chartData = null;
                                let chartType = null;
                                let chartTitle = null;

                                const chartRegex = /\[\[CHART:(.*?)\]\]/s;
                                const match = reportText.match(chartRegex);
                                if (match && match[1]) {
                                    try {
                                        const chartConfig = JSON.parse(match[1]);
                                        chartData = chartConfig.data;
                                        chartType = chartConfig.type;
                                        chartTitle = chartConfig.title;
                                        finalText = reportText.replace(chartRegex, '').trim();
                                    } catch (e) { }
                                }

                                const aiMsg: Message = {
                                    id: Date.now().toString(),
                                    text: finalText,
                                    sender: 'ai',
                                    timestamp: new Date(),
                                    chartData, chartType: chartType as any, chartTitle
                                };
                                setMessages(prev => [...prev, aiMsg]);
                                setIsLoading(false);
                                return;
                            }
                        }
                    }

                    setMessages(prev => [...prev, localResponse]);
                    setIsLoading(false);
                    return;
                }

                // 2. TRY OLLAMA (Real LLM)
                if (useOllama) {
                    const rawResponse = await generateOllamaResponse(newUserMessage.text);
                    if (rawResponse) {
                        let finalText = rawResponse;
                        let chartData = null;
                        let chartType = null;
                        let chartTitle = null;

                        // PARSE DYNAMIC CHART PROTOCOL
                        const chartRegex = /\[\[CHART:(.*?)\]\]/s;
                        const match = rawResponse.match(chartRegex);

                        if (match && match[1]) {
                            try {
                                const chartConfig = JSON.parse(match[1]);
                                chartData = chartConfig.data;
                                chartType = chartConfig.type;
                                chartTitle = chartConfig.title;
                                // Remove the protocol text from the user display
                                finalText = rawResponse.replace(chartRegex, '').trim();
                            } catch (e) {
                                console.error("Failed to parse AI chart data", e);
                            }
                        }

                        const ollamaResponse: Message = {
                            id: (Date.now() + 1).toString(),
                            text: finalText,
                            sender: 'ai',
                            timestamp: new Date(),
                            chartData,
                            chartType: chartType as any,
                            chartTitle
                        };
                        setMessages(prev => [...prev, ollamaResponse]);
                        setIsLoading(false);
                        return;
                    }
                }

                // 3. FALLBACK TO MOCK AI (If Ollama fails or is off)
                const genericResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "I am analyzing that specific data point. Please refine your query to 'Pending Invoices', 'Total Spend', or 'Platform Overview' for precise real-time analytics.\n\n(Ollama connection unavailable).",
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, genericResponse]);

            } catch (error) {
                // ... error handling
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-slate-950 border border-slate-700 rounded-sm shadow-2xl flex flex-col overflow-hidden pointer-events-auto font-mono">
                    {/* HEADER */}
                    <div className="p-4 bg-slate-950 flex justify-between items-center border-b border-slate-800">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-slate-800 border border-slate-700 flex items-center justify-center mr-3">
                                <span className="text-emerald-500 font-bold text-lg">{`>`}</span>
                            </div>
                            <div>
                                <h3 className="text-slate-100 font-bold text-sm tracking-wider uppercase">Vector</h3>
                                <p className="text-emerald-500 text-[10px] tracking-widest uppercase">AI Terminal</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-950">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-slate-900 text-slate-200 border border-slate-700'
                                    : 'bg-slate-950 text-emerald-400 border border-emerald-900/30 font-mono'
                                    }`}>
                                    <span className="opacity-50 text-[10px] uppercase block mb-1 tracking-wider">
                                        {msg.sender === 'user' ? 'USER' : 'VECTOR'}
                                    </span>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* VISUAL RESPONSE RENDERER */}
                                    {msg.chartData && msg.chartType && (
                                        <div className="mt-4 bg-[#0B1221] p-4 rounded-sm border border-emerald-900/50 w-full h-48 relative overflow-hidden">
                                            {/* Technical Grid Overlay */}
                                            <div className="absolute inset-0 pointer-events-none opacity-10"
                                                style={{ backgroundImage: 'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                            </div>

                                            {msg.chartTitle && <div className="flex items-center mb-2 border-b border-emerald-900/30 pb-1">
                                                <div className="w-2 h-2 bg-emerald-500 mr-2 animate-pulse"></div>
                                                <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">{msg.chartTitle}</p>
                                            </div>}

                                            <ResponsiveContainer width="100%" height="80%">
                                                {msg.chartType === 'pie' ? (
                                                    <PieChart>
                                                        <Pie data={msg.chartData} innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                                                            {msg.chartData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color || ['#10B981', '#059669', '#34D399', '#064E3B'][index % 4]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip
                                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #10B981', fontSize: '10px', fontFamily: 'monospace', color: '#10B981' }}
                                                            itemStyle={{ color: '#10B981' }}
                                                        />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={msg.chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                                                        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #10B981', fontSize: '10px', fontFamily: 'monospace' }}
                                                            cursor={{ fill: '#1E293B', opacity: 0.5 }}
                                                            itemStyle={{ color: '#10B981' }}
                                                        />
                                                        <Bar dataKey="value" fill="#10B981" radius={[0, 0, 0, 0]} barSize={20} />
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800">
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-emerald-500 font-bold">{`>`}</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Execute command..."
                                className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-10 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500/50 focus:ring-0 placeholder-slate-600 font-mono"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading}
                                className={`absolute right-2 p-1.5 text-slate-400 hover:text-emerald-500 transition-colors ${isLoading ? 'opacity-50' : ''}`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-slate-900 hover:bg-slate-800 rounded-sm shadow-xl flex items-center justify-center text-emerald-500 hover:text-emerald-400 transition-all duration-200 pointer-events-auto border border-slate-700"
            >
                {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
            </button>
        </div>
    );
};
