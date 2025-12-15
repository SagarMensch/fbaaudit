import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BrainCircuit } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

import { generateAIResponse } from '../services/aiService';

export const AetherChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Greetings. I am Aether. I observe the flow of your logistics data. How may I illuminate your path today?", sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        // Call Real AI Service
        setInputValue('');
        setIsLoading(true);

        try {
            // Convert history for context
            const history = messages.map(m => ({
                role: m.sender,
                content: m.text
            }));

            const responseText = await generateAIResponse(inputValue, history);

            const newAiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "My neural link is currently unstable. Please verify my API key configuration.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="mb-4 w-80 h-96 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-fade-in-up">
                    {/* HEADER */}
                    <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/50">
                                <BrainCircuit size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Aether</h3>
                                <p className="text-indigo-200 text-[10px]">Neural Logistics Core</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask Aether..."
                                className="w-full bg-slate-900 text-white text-xs rounded-full pl-4 pr-10 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading}
                                className={`absolute right-2 p-1.5 rounded-full text-white transition-colors shadow-lg ${isLoading ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
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
                className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-2xl shadow-indigo-600/40 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 pointer-events-auto border-2 border-white/20"
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </div>
    );
};
