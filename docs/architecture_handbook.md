# Freight Audit Platform: Technical Architecture Handbook

## 1. System Overview
The Freight Audit Platform is a high-performance SaaS/On-Premise solution designed to automate invoice processing, audit logistics costs against contracts, and streamline financial settlements.

## 2. Module Architecture

### 2.1 Ingestion Layer
- **EDI Gateway**: Handles EDI 210 (Invoices) and 204 (Load Tenders) for direct carrier communication.
- **OCR Engine**: AI-powered extraction of data from PDF/Image invoices using PaddleOCR/Vision LLMs.
- **Integration Hub**: Pre-built connectors for External ERPs (SAP, Oracle, MS Dynamics).

### 2.2 Core Audit Engine
- **Contract Manager**: Centralized repository for complex rate cards, GRI simulators, and contract terms.
- **Auto-Match Engine**: 3-way match (Invoice vs. Contract vs. Delivery Proof) with anomaly detection.
- **Dispute Workflow**: Collaborative module for vendors and ops to resolve variances.

### 2.3 Portal Layer
- **Control Tower (Admin)**: Full visibility into network performance, RBAC, and system configurations.
- **Vendor Portal**: Self-service platform for carriers to upload invoices, respond to disputes, and track payments.
- **Finance Terminal**: High-fidelity UI for treasury release and settlement oversight.

### 2.4 Analytics & Intelligence
- **Intelligence Hub**: Predictive modeling for "Cost to Serve" and "Carrier Performance".
- **Aether AI Chatbot**: Natural language interface for querying platform data and executing actions.

---

## 3. Technical Blueprint (D2)
The architectural blueprint is maintained in **[architecture_blueprint.d2](file:///c:/Users/sagar/Downloads/newown%20-%20Copy/docs/architecture_blueprint.d2)**.

![Freight Audit Platform Blueprint](file:///c:/Users/sagar/Downloads/newown%20-%20Copy/docs/architecture_blueprint.png)

This file uses the D2 definition language to provide a "Blueprint-Style" visualization of the system, including:
- **Interactive Layers**: Front-end portals and AI interfaces.
- **Service Mesh**: Core processing logic and audit engines.
- **Persistence Layer**: Multi-database strategy (Postgres, Mongo, Redis).
- **Ingestion Pipeline**: OCR, EDI, and API gateways.

---

## 4. Technical Process Flow (Logic)

## 4. Deployment Architecture

### 4.1 Cloud Deployment (SaaS)
*Target: AWS / Azure / GCP*
- **Front-end**: React SPA hosted on AWS S3/CloudFront.
- **API Tier**: Serverless Functions (Lambda) or EKS (Kubernetes) for scalability.
- **Data Layer**: PostgreSQL (RDS) for transactional data + MongoDB for unstructured document metadata.
- **Security**: OAuth2.0 / JWT via Auth0 or AWS Cognito.

### 4.2 On-Premise Deployment (Enterprise)
*Target: Private Data Center / Air-gapped Environments*
- **Containerization**: Docker Swarm or Kubernetes (K3s) for orchestration.
- **Database**: Ported PostgreSQL/Redis instances.
- **Integration**: Local SFTP/Queue-based ingestion for legacy internal systems.
- **Identity**: Active Directory / LDAP Integration.

---

## 5. Deployment Comparison Table

| Feature | Cloud (SaaS) | On-Premise |
| :--- | :--- | :--- |
| **Scalability** | Elastic / Automatic | Hardware Dependent |
| **Updates** | Continuous (CI/CD) | Manual / Scheduled |
| **Control** | Shared Responsibility | Full Internal Sovereignty |
| **Cost** | OpEx (Subscription) | CapEx (Infrastructure) |
| **Latency** | Network Dependent | Extreme Low (Local Network) |
