
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MOCK_INVOICES, MOCK_PARTNERS, SPEND_DATA, KPIS } from "../constants";

// Initialize Gemini Client
const apiKey = 'AIzaSyC7ymeYc7U2F78sjmnPja2Io7DoDLvcOs0'; // Provided by User
const genAI = new GoogleGenerativeAI(apiKey);

export const generateAIResponse = async (userMessage: string, chatHistory: { role: string, content: string }[]) => {
    if (!apiKey) {
        return JSON.stringify({ message: "I am unable to connect to my neural core (Missing API Key). Please check your configuration." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // --- CONSTRUCT CONTEXT (RAG-Lite) ---
        const kpiSummary = KPIS.map(k => `${k.label}: ${k.value} (${k.trend})`).join(', ');

        // Mock Spend Data for "Show me spend" queries
        const spendSummary = JSON.stringify([
            { name: 'Ocean FCL', value: 45, color: '#004D40' },
            { name: 'Air Freight', value: 25, color: '#0F62FE' },
            { name: 'Road (FTL)', value: 20, color: '#F59E0B' },
            { name: 'LTL/Parcel', value: 10, color: '#6B7280' }
        ]);

        const ytdSpend = JSON.stringify([
            { month: 'Jan', actual: 1150000 },
            { month: 'Feb', actual: 1250000 },
            { month: 'Mar', actual: 1180000 },
            { month: 'Apr', actual: 1420000 },
            { month: 'May', actual: 1300000 },
            { month: 'Jun', actual: 1390000 },
        ]);

        const systemPrompt = `
You are Aether, an advanced AI Logistics Control Tower Assistant.
You have access to the following real-time data:

[KPIS]
${kpiSummary}

[SPEND DATA - MODE SPLIT]
${spendSummary}

[SPEND DATA - TREND (YTD)]
${ytdSpend}

[INSTRUCTIONS]
- You are a helpful assistant.
- IMPORTANT: You must ALWAYS return your response as a VALID JSON OBJECT.
- Format: { 
    "message": "Text response", 
    "chartType": "pie" | "bar" | "line" | null, 
    "chartData": [...] | null,
    "intent": "APPROVE_INVOICE" | "FLAG_DISPUTE" | "GENERAL_QUERY" | null,
    "entityId": "INV-..." | null,
    "actionDetails": string | null 
  }
- If the user asks for a graph, populate 'chartType' and 'chartData'.
- If the user commands an action (e.g. "Approve invoice INV-001"), set 'intent' to 'APPROVE_INVOICE' and 'entityId' to the invoice number.
- If the user commands to flag a dispute, set 'intent' to 'FLAG_DISPUTE'.
- Keep text responses concise and professional.
`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: JSON.stringify({ message: "Acknowledged. I am Aether, ready to analyze logistics data.", chartType: null, chartData: null }) }],
                },
                ...chatHistory.map(msg => ({
                    role: msg.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            ],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return text; // Should be JSON string

    } catch (error) {
        console.error("Gemini API Error:", error);
        console.log("Falling back to Simulated AI (Rule-Based Engine)...");
        return generateSimulatedResponse(userMessage);
    }
};

// --- SIMULATED AI (FALLBACK) ---
const generateSimulatedResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase();

    // 1. CHART INTENTS
    if (lowerMsg.includes('spend') || lowerMsg.includes('cost') || lowerMsg.includes('breakdown')) {
        if (lowerMsg.includes('trend') || lowerMsg.includes('month') || lowerMsg.includes('time')) {
            // SPEND TREND (Bar Chart)
            return JSON.stringify({
                message: "Here is the spend trend analysis for the current fiscal year (Simulation Mode).",
                chartType: "bar",
                chartData: [
                    { name: 'Jan', value: 1150000 },
                    { name: 'Feb', value: 1250000 },
                    { name: 'Mar', value: 1180000 },
                    { name: 'Apr', value: 1420000 },
                    { name: 'May', value: 1300000 },
                    { name: 'Jun', value: 1390000 },
                ],
                chartTitle: "Monthly Spend Trend (YTD)"
            });
        } else {
            // SPEND BREAKDOWN (Pie Chart)
            return JSON.stringify({
                message: "Generating spend breakdown by transport mode (Simulation Mode).",
                chartType: "pie",
                chartData: [
                    { name: 'Ocean FCL', value: 45, color: '#004D40' },
                    { name: 'Air Freight', value: 25, color: '#0F62FE' },
                    { name: 'Road (FTL)', value: 20, color: '#F59E0B' },
                    { name: 'LTL/Parcel', value: 10, color: '#6B7280' }
                ],
                chartTitle: "Spend by Mode"
            });
        }
    }

    // 2. ACTION INTENTS
    if (lowerMsg.includes('approve') && lowerMsg.includes('invoice')) {
        const match = message.match(/INV-[\w-]+/i);
        const entityId = match ? match[0] : "INV-TOTAL";
        return JSON.stringify({
            message: `Initiating approval workflow for ${entityId}...`,
            intent: "APPROVE_INVOICE",
            entityId: entityId,
            actionDetails: "Approved via Chat Command (Simulated)"
        });
    }

    if (lowerMsg.includes('flag') || lowerMsg.includes('dispute')) {
        const match = message.match(/INV-[\w-]+/i);
        const entityId = match ? match[0] : "UNKNOWN";
        return JSON.stringify({
            message: `Flagging ${entityId} for exception review...`,
            intent: "FLAG_DISPUTE",
            entityId: entityId,
            actionDetails: "Flagged via Chat Command (Simulated)"
        });
    }

    // 3. GENERAL QUERIES
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg.includes('vector')) {
        return JSON.stringify({
            message: "Systems online. I am Vector (Running in Simulation Mode). My neural link to Gemini is currently offline, but I can still generate reports and execute local commands."
        });
    }

    return JSON.stringify({
        message: "I am currently running in Offline Simulation Mode. I can generate charts ('show spend') or execute commands ('approve invoice'), but complex conversational queries are limited."
    });
};
