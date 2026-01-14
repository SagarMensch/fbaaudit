import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface ChatRequest {
    message: string;
}

export interface ChatResponse {
    response: string;
    sources: string[];
}

export interface WorkflowRequest {
    invoice_number: string;
    carrier: string;
    origin: string;
    destination: string;
    amount: number;
    currency: string;
    date: string;
    status: string;
    variance: number;
    extraction_confidence: number;
}

export interface WorkflowResponse {
    workflow_id: string;
    status: string;
    result: any;
    errors: string[];
    execution_time_ms?: number;
}

class BackendService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async healthCheck(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.data;
        } catch (error) {
            console.error('Backend health check failed:', error);
            throw error;
        }
    }

    async chat(message: string): Promise<ChatResponse> {
        try {
            const response = await axios.post<ChatResponse>(`${this.baseUrl}/api/chat`, {
                message
            });
            return response.data;
        } catch (error) {
            console.error('Chat request failed:', error);
            throw error;
        }
    }

    async processInvoiceWorkflow(invoiceData: WorkflowRequest): Promise<WorkflowResponse> {
        try {
            const response = await axios.post<WorkflowResponse>(
                `${this.baseUrl}/api/workflows/invoice/process`,
                invoiceData
            );
            return response.data;
        } catch (error) {
            console.error('Workflow processing failed:', error);
            throw error;
        }
    }

    async validateInvoice(invoiceData: WorkflowRequest): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/invoices/validate`,
                invoiceData
            );
            return response.data;
        } catch (error) {
            console.error('Invoice validation failed:', error);
            throw error;
        }
    }
}

export const backendService = new BackendService();
