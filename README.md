# Freight Audit & Settlement Platform

> **Enterprise-Grade Freight Invoice Audit & Settlement System**  
> Automated 3-Way Matching | AI-Powered Audit | India Tax Compliance | Multi-Carrier Support

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Access the application at `http://localhost:5173`

---

## 📋 Overview

The **Freight Audit & Settlement Platform** is a comprehensive solution for automating freight invoice processing, audit, and payment settlement. Built for enterprises managing high-volume logistics operations, it combines AI-powered automation with human-in-the-loop workflows.

### Key Capabilities

- **Multi-Channel Ingestion**: PDF OCR, EDI (210/810), Email, API
- **Intelligent Audit Engine**: 3-Way Match (Invoice ↔ Contract ↔ POD)
- **India Tax Compliance**: GST, TDS, Reverse Charge Mechanism (RCM)
- **Parcel Audit**: Small package optimization (GSR, Dim Weight, Residential)
- **AI Assistant (Aether)**: Natural language queries and insights
- **Comprehensive Reporting**: Vendor scorecards, contract utilization, exception analysis

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (React 19 + TypeScript)                      │
│  ├─ Organization Dashboard                             │
│  ├─ Vendor Portal                                       │
│  └─ Finance Terminal                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Business Logic (Services)                              │
│  ├─ Audit Engine (3-Way Match)                         │
│  ├─ Tax Service (India GST/TDS)                        │
│  ├─ OCR Engine (PaddleOCR)                             │
│  └─ Workflow Engine (RBAC)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Data Layer                                             │
│  ├─ Invoice Storage (In-Memory / PostgreSQL)           │
│  ├─ Master Data (Vendors, Rates, GL Codes)            │
│  └─ Audit Trail (Immutable Logs)                       │
└─────────────────────────────────────────────────────────┘
```

For detailed architecture diagrams, see [`docs/architecture_blueprint.d2`](./docs/architecture_blueprint.d2) and [`docs/process_workflow.d2`](./docs/process_workflow.d2).

---

## 🎯 Core Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| **Invoice Workbench** | Central hub for invoice processing | Bulk upload, smart filters, status tracking |
| **Audit Engine** | Automated validation and matching | 3-way match, rate validation, anomaly detection |
| **Contract Manager** | Rate card and agreement management | GRI simulation, multi-tier pricing |
| **Settlement & Finance** | Payment batch generation | GL coding, TDS calculation, ERP integration |
| **Intelligence Hub** | Analytics and reporting | Spend analysis, carrier performance, KPIs |
| **Vendor Portal** | Self-service for suppliers | Invoice upload, dispute management, status tracking |
| **Aether AI** | Conversational AI assistant | Natural language queries, chart generation |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.2 with TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: TailwindCSS 4.1
- **Charts**: Recharts 3.5
- **Icons**: Lucide React

### Backend Services (Simulated in Frontend)
- **OCR**: PaddleOCR integration (Python backend)
- **AI**: Ollama (local LLM) / Google Generative AI
- **PDF Generation**: jsPDF + jsPDF-AutoTable

### Data Management
- **State**: React Hooks + Context API
- **Storage**: In-memory (demo) / PostgreSQL (production)
- **Caching**: LocalStorage for session persistence

---

## 📦 Installation

### Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+
- **Git**: For version control

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newown\ -\ Copy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   # Create .env file for API keys
   VITE_OLLAMA_URL=http://localhost:11434
   VITE_GOOGLE_AI_KEY=your_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open browser: `http://localhost:5173`
   - Default login: Use demo personas (no authentication required in demo mode)

---

## 👥 User Roles & Personas

The platform supports role-based access control (RBAC):

| Role | Persona | Access Level |
|------|---------|--------------|
| **Operations Manager** | Sarah Chen | Full audit access, workflow management |
| **Finance Controller** | David Kumar | Settlement approval, GL coding |
| **Vendor/Supplier** | John (Oman Steel) | Invoice upload, dispute chat |
| **System Admin** | Admin | Full system access, configuration |

---

## 🔧 Configuration

### Master Data Setup

1. **Vendors**: Configure in `services/masterDataService.ts`
2. **Rate Cards**: Define contract rates in `constants.ts`
3. **GL Codes**: Set up accounting segments in `services/glCodingService.ts`
4. **Workflow**: Customize approval chains in `services/workflowEngine.ts`

### Tax Configuration (India)

The platform includes a sophisticated India tax engine:

```typescript
// Example: Configure GST and TDS rates
{
  gstRate: 18,        // Standard GST rate
  tdsRate: 2,         // TDS under Section 194C
  isRcm: false,       // Reverse Charge Mechanism
  sectionCode: '194C' // Income Tax Section
}
```

---

## 📊 Key Features

### 1. Intelligent Invoice Ingestion
- **OCR Extraction**: Automatic data capture from PDF invoices
- **EDI Parsing**: Support for X12 (210, 810) and EDIFACT
- **Duplicate Detection**: 30-day lookback with fuzzy matching
- **Validation**: Pre-audit checks for data quality

### 2. Advanced Audit Capabilities
- **3-Way Match**: Invoice ↔ Purchase Order ↔ Proof of Delivery
- **Contract Rate Validation**: Automatic rate card lookup
- **Parcel Audit**: Small package optimization (FedEx, UPS, DHL)
  - Late Delivery (Guaranteed Service Refund)
  - Dimensional Weight verification
  - Residential surcharge validation
- **Tax Compliance**: India GST/TDS/RCM calculation

### 3. Collaborative Dispute Resolution
- **Real-time Chat**: Vendor ↔ Auditor communication
- **Attachment Support**: Upload supporting documents
- **Audit Trail**: Complete history of all interactions
- **Auto-escalation**: SLA-based workflow triggers

### 4. Comprehensive Reporting
- **Vendor Freight Cost**: Spend analysis by carrier
- **Contract Utilization**: % of spend on contract vs. spot
- **Exception Frequency**: Root cause analysis
- **Duplicate Attempts**: Fraud detection metrics
- **Approval TAT**: Turnaround time tracking

### 5. AI-Powered Insights (Aether)
- **Natural Language Queries**: "Show me pending invoices"
- **Chart Generation**: Automatic visualization
- **Predictive Analytics**: Spend forecasting
- **Anomaly Detection**: Outlier identification

---

## 🚢 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
# Output: dist/
```

### Deployment Options

#### 1. **Cloud (AWS/Azure/GCP)**
```bash
# Build and deploy to S3 + CloudFront
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

#### 2. **On-Premise (Docker)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

#### 3. **Kubernetes**
See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for detailed Kubernetes manifests.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [User Guide](./docs/USER_GUIDE.md) | End-user manual for all modules |
| [API Documentation](./docs/API_DOCUMENTATION.md) | Backend service reference |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Installation and deployment |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | Data models and relationships |
| [Integration Guide](./docs/INTEGRATION_GUIDE.md) | ERP and external system integration |
| [Product Overview](./docs/PRODUCT_OVERVIEW.md) | Executive summary |
| [Features](./docs/FEATURES.md) | Detailed feature list |

---

## 🔐 Security

- **Authentication**: RBAC with role-based permissions
- **Data Encryption**: TLS 1.3 for data in transit
- **Audit Logging**: Immutable trail of all actions
- **Compliance**: SOC 2, GDPR-ready architecture

---

## 🤝 Support

For technical support or questions:
- **Email**: support@freightaudit.com
- **Documentation**: [docs/](./docs/)
- **Issue Tracker**: GitHub Issues

---

## 📝 License

Proprietary - All Rights Reserved

---

## 🎉 Acknowledgments

Built with modern web technologies and best practices for enterprise logistics operations.

**Version**: 3.0.0  
**Last Updated**: December 2024
