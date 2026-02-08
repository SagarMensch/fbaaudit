/**
 * API Client Service
 * SAP-style: Frontend calls backend APIs. Backend is source of truth.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
    data: T;
    meta: {
        total?: number;
        limit?: number;
        offset?: number;
        entity_id?: string;
        current_status?: string;
        allowed_actions?: string[];
    };
    audit?: {
        last_modified_by?: string;
        last_modified_at?: string;
    };
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errorBody}`);
        }

        return response.json();
    }

    async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }
        return this.request<T>(url, { method: 'GET' });
    }

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Singleton instance
export const apiClient = new ApiClient();

// ==================== VENDORS API ====================

export interface VendorFromAPI {
    id: string;
    name: string;
    type: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    is_active: boolean;
    performance_grade?: string;
    onboarding_status?: string;
    created_at?: string;
}

export interface VendorContractFromAPI {
    id: string;
    contract_number: string;
    service_type: string;
    valid_from: string;
    valid_to: string;
    status: string;
}

export interface VendorRateFromAPI {
    id: string;
    contract_id: string;
    origin: string;
    destination: string;
    vehicle_type: string;
    rate_basis: string;
    base_rate: number;
    transit_time_days?: number;
}

export const VendorsAPI = {
    /**
     * Get all vendors from database
     */
    async getAll(params?: {
        is_active?: boolean;
        type?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<VendorFromAPI[]>> {
        return apiClient.get('/api/vendors', params);
    },

    /**
     * Get single vendor by ID with contracts
     */
    async getById(vendorId: string): Promise<{
        data: VendorFromAPI;
        meta: { entity_id: string; current_status: string; allowed_actions: string[] };
        contracts: VendorContractFromAPI[];
    }> {
        return apiClient.get(`/api/vendors/${vendorId}`);
    },

    /**
     * Get vendor's contracts
     */
    async getContracts(vendorId: string): Promise<ApiResponse<VendorContractFromAPI[]>> {
        return apiClient.get(`/api/vendors/${vendorId}/contracts`);
    },

    /**
     * Get vendor's freight rates
     */
    async getRates(vendorId: string): Promise<ApiResponse<VendorRateFromAPI[]>> {
        return apiClient.get(`/api/vendors/${vendorId}/rates`);
    },

    /**
     * Get vendor's invoices
     */
    async getInvoices(vendorId: string, status?: string): Promise<ApiResponse<unknown[]>> {
        return apiClient.get(`/api/vendors/${vendorId}/invoices`, { status: status || '' });
    }
};

// ==================== CONFIG API ====================

export interface SystemConfig {
    [key: string]: string;
}

export interface CurrencyConfig {
    currency_symbol: string;
    currency_code: string;
    locale: string;
}

export interface AuditThresholds {
    variance_tolerance_pct: number;
    high_value_threshold: number;
    auto_approve_enabled: boolean;
    ai_approval_enabled: boolean;
}

export const ConfigAPI = {
    /**
     * Get all system configuration
     */
    async getAll(category?: string): Promise<ApiResponse<SystemConfig>> {
        return apiClient.get('/api/config', category ? { category } : undefined);
    },

    /**
     * Get currency configuration for frontend
     */
    async getCurrency(): Promise<CurrencyConfig> {
        return apiClient.get('/api/config/finance/currency');
    },

    /**
     * Get audit thresholds
     */
    async getAuditThresholds(): Promise<AuditThresholds> {
        return apiClient.get('/api/config/audit/thresholds');
    },

    /**
     * Get SLA timers
     */
    async getSLATimers(): Promise<{ dispute_resolution_hours: number; pod_submission_days: number }> {
        return apiClient.get('/api/config/sla/timers');
    }
};

// ==================== INVOICES API ====================

export const InvoicesAPI = {
    /**
     * Get all invoices
     */
    async getAll(params?: {
        status?: string;
        vendor_id?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<unknown[]>> {
        return apiClient.get('/api/invoices', params);
    },

    /**
     * Get single invoice by ID
     */
    async getById(invoiceId: string): Promise<ApiResponse<unknown>> {
        return apiClient.get(`/api/invoices/${invoiceId}`);
    },

    /**
     * Process invoice through workflow
     */
    async process(invoiceId: string): Promise<{
        workflow_id: string;
        status: string;
        result: unknown;
    }> {
        return apiClient.post(`/api/workflows/invoice/process`, { invoice_id: invoiceId });
    }
};

export default apiClient;
