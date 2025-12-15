
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MOCK_INVOICES, MOCK_PARTNERS, SPEND_DATA, KPIS } from "../constants";

// Initialize Gemini Client
// Note: In a real production app, calls should go through a backend to protect the API Key.
// For this demo, we use the key directly as configured in vite.config.ts
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const generateAIResponse = async (userMessage: string, chatHistory: { role: string, content: string }[]) => {
    if (!apiKey) {
        return "I am unable to connect to my neural core (Missing API Key). Please check your configuration.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // --- CONSTRUCT CONTEXT (RAG-Lite) ---
        // We inject a summarized view of the application state into the system prompt.

        const kpiSummary = KPIS.map(k => `${k.label}: ${k.value} (${k.trend})`).join(', ');
        const recentInvoices = MOCK_INVOICES.slice(0, 5).map(inv =>
            `Inv#${inv.invoiceNumber} (${inv.carrier}): $${inv.amount} - ${inv.status}`
        ).join('\n');

        const partners = MOCK_PARTNERS.map(p => p.name).join(', ');

        const systemPrompt = `
You are Aether, an advanced AI Logistics Control Tower Assistant.
You have access to the following real-time data from the SequelString FBA Control Tower:

[KEY PERFORMANCE INDICATORS]
${kpiSummary}

[RECENT INVOICES (Last 5)]
${recentInvoices}

[ACTIVE PARTNERS]
${partners}

[IDENTITY]
- Name: Aether
- Tone: Professional, slightly futuristic, helpful, and data-driven.
- Formatting: Use Markdown for tables or lists if helpful.

[INSTRUCTIONS]
- Answer the user's query based on the provided data.
- If the user asks about something not in the data, try to infer generally or politely state you don't have that specific record.
- Keep answers concise (under 3 sentences) unless asked for a detailed report.
`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Acknowledged. I am Aether, ready to analyze logistics data." }],
                },
                ...chatHistory.map(msg => ({
                    role: msg.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 250,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return text;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I encountered a processing error in my neural network. Please try again.";
    }
};
