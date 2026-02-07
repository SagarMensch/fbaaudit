import { MOCK_INVOICES, MOCK_RATES, MOCK_BATCHES, KPIS, SPEND_DATA, MOCK_PARTNERS } from '../constants';

// Direct connection to Ollama - 100% FREE & OPEN SOURCE
const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'llama3:latest'; // Using your installed model

export interface OllamaAgentResponse {
    message: string;
    chartType?: 'pie' | 'bar' | 'line' | null;
    chartData?: any[] | null;
    chartTitle?: string | null;
    intent?: 'APPROVE_INVOICE' | 'FLAG_DISPUTE' | 'GENERAL_QUERY' | null;
    entityId?: string | null;
    actionDetails?: string | null;
}

// Conversation history for context
let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = [];

export const generateOllamaResponse = async (
    prompt: string,
    onStream?: (chunk: string) => void
): Promise<string | null> => {
    try {
        // Build context with REAL data
        const kpiSummary = KPIS.map(k => `${k.label}: ${k.value}`).join(', ');
        const pendingCount = MOCK_INVOICES.filter(i => i.status === 'PENDING').length;
        const totalValue = MOCK_INVOICES.reduce((sum, i) => sum + i.amount, 0).toFixed(2);

        // Build supplier list
        const suppliers = MOCK_PARTNERS.map(p => `${p.name} (${p.mode})`).join(', ');

        const systemContext = `You are Vector, an AI assistant for a logistics platform.

AVAILABLE DATA:
- Suppliers/Carriers: ${suppliers}
- Pending Invoices: ${pendingCount}
- Total Spend: ₹${totalValue}
- Active Contracts: ${MOCK_RATES.length}
- KPIs: ${kpiSummary}

INSTRUCTIONS:
- Answer questions about suppliers, invoices, spend, and logistics data
- Be conversational and helpful
- If asked about suppliers, list them clearly
- If asked about a specific supplier, provide details
- Keep responses concise but informative
- Use the data provided above`;

        // Add system context only on first message
        if (conversationHistory.length === 0) {
            conversationHistory.push({
                role: 'system',
                content: systemContext
            });
        }

        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: prompt
        });

        // Call Ollama Chat API with streaming
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: conversationHistory,
                stream: true, // Enable streaming for better UX
                options: {
                    temperature: 0.7,
                    top_p: 0.9
                }
            }),
        });

        if (!response.ok) {
            console.warn('Ollama not reachable. Make sure Ollama is running (ollama serve)');
            return null;
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            fullResponse += json.message.content;
                            // Stream to UI if callback provided
                            if (onStream) {
                                onStream(json.message.content);
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }

        // Add assistant response to history
        if (fullResponse) {
            conversationHistory.push({
                role: 'assistant',
                content: fullResponse
            });
        }

        return fullResponse || null;

    } catch (error) {
        console.warn('Ollama connection failed. Make sure Ollama is running:', error);
        return null;
    }
};

// Reset conversation history
export const resetConversation = () => {
    conversationHistory = [];
};
