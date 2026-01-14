# Deployment Guide - Freight Audit & Settlement Platform

**Version 3.0** | Enterprise Deployment Guide

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Build](#production-build)
4. [Cloud Deployment](#cloud-deployment)
5. [On-Premise Deployment](#on-premise-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Security & SSL](#security--ssl)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

#### Minimum
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB
- **OS**: Linux (Ubuntu 20.04+), Windows Server 2019+, macOS 12+

#### Recommended (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies

```bash
# Node.js (v18 LTS or higher)
node --version  # Should be >= 18.0.0

# npm (v9 or higher)
npm --version   # Should be >= 9.0.0

# Git
git --version
```

---

## Local Development

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd newown\ -\ Copy

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Access application
# Open http://localhost:5173 in browser
```

### Development Environment Variables

Create `.env.local` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_OLLAMA_URL=http://localhost:11434

# AI Services
VITE_GOOGLE_AI_KEY=your_google_ai_key_here

# Feature Flags
VITE_ENABLE_OCR=true
VITE_ENABLE_AI_CHAT=true

# Debug Mode
VITE_DEBUG=true
```

---

## Production Build

### Building for Production

```bash
# 1. Install dependencies (production only)
npm ci --production

# 2. Build application
npm run build

# 3. Output directory
# dist/ contains production-ready files
```

### Build Optimization

The build process automatically:
- Minifies JavaScript and CSS
- Optimizes images
- Generates source maps
- Tree-shakes unused code
- Code-splits for lazy loading

### Preview Production Build Locally

```bash
npm run preview
# Access at http://localhost:4173
```

---

## Cloud Deployment

### AWS Deployment

#### Option 1: S3 + CloudFront (Static Hosting)

```bash
# 1. Build application
npm run build

# 2. Create S3 bucket
aws s3 mb s3://freight-audit-app

# 3. Enable static website hosting
aws s3 website s3://freight-audit-app \
  --index-document index.html \
  --error-document index.html

# 4. Upload build files
aws s3 sync dist/ s3://freight-audit-app \
  --delete \
  --cache-control max-age=31536000

# 5. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name freight-audit-app.s3.amazonaws.com \
  --default-root-object index.html
```

#### Option 2: EC2 with Docker

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ubuntu@ec2-instance-ip

# 2. Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# 3. Clone repository
git clone <repository-url>
cd freight-audit-app

# 4. Build and run
docker-compose up -d
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    restart: always
```

### Azure Deployment

#### Azure Static Web Apps

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login
az login

# 3. Create resource group
az group create --name freight-audit-rg --location eastus

# 4. Create static web app
az staticwebapp create \
  --name freight-audit-app \
  --resource-group freight-audit-rg \
  --source <repository-url> \
  --location eastus \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment

```bash
# 1. Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/freight-audit

# 2. Deploy to Cloud Run
gcloud run deploy freight-audit \
  --image gcr.io/PROJECT_ID/freight-audit \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## On-Premise Deployment

### Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --production

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

#### Build and Run

```bash
# Build image
docker build -t freight-audit:latest .

# Run container
docker run -d \
  --name freight-audit \
  -p 80:3000 \
  -e NODE_ENV=production \
  freight-audit:latest
```

### Kubernetes Deployment

#### Deployment Manifest

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: freight-audit
  labels:
    app: freight-audit
spec:
  replicas: 3
  selector:
    matchLabels:
      app: freight-audit
  template:
    metadata:
      labels:
        app: freight-audit
    spec:
      containers:
      - name: freight-audit
        image: freight-audit:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: freight-audit-service
spec:
  selector:
    app: freight-audit
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### Deploy to Kubernetes

```bash
# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl get services

# Scale deployment
kubectl scale deployment freight-audit --replicas=5
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# API Endpoints
VITE_API_URL=https://api.freightaudit.com
VITE_OLLAMA_URL=https://ai.freightaudit.com

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/freight_audit

# Redis Cache
REDIS_URL=redis://cache-host:6379

# Authentication
AUTH_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# External Services
ERP_API_URL=https://erp.company.com/api
ERP_API_KEY=your-erp-api-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Feature Flags
ENABLE_OCR=true
ENABLE_AI_CHAT=true
ENABLE_ANALYTICS=true
```

---

## Database Setup

### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE freight_audit;

-- Create user
CREATE USER freight_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE freight_audit TO freight_user;

-- Connect to database
\c freight_audit

-- Create tables (see DATABASE_SCHEMA.md for full schema)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  carrier VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_carrier ON invoices(carrier);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
```

### Redis Setup (Caching)

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
# Should return: PONG
```

---

## Security & SSL

### SSL Certificate Setup

#### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d freightaudit.com -d www.freightaudit.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name freightaudit.com www.freightaudit.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name freightaudit.com www.freightaudit.com;

    ssl_certificate /etc/letsencrypt/live/freightaudit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/freightaudit.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/freight-audit/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Monitoring & Logging

### Application Monitoring

#### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "freight-audit" -- run preview

# Monitor
pm2 monit

# View logs
pm2 logs freight-audit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Log Aggregation

#### Using Winston (Application Logs)

```javascript
// logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;
```

### Health Checks

```bash
# Create health check endpoint
curl https://freightaudit.com/health

# Expected response:
# {"status":"ok","uptime":12345,"timestamp":"2024-12-25T12:00:00Z"}
```

---

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Performance Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
add_header Cache-Control "public, max-age=31536000";
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL
pg_dump freight_audit > backup_$(date +%Y%m%d).sql

# Restore
psql freight_audit < backup_20241225.sql
```

### Application Backup

```bash
# Backup application files
tar -czf freight-audit-backup.tar.gz /var/www/freight-audit

# Restore
tar -xzf freight-audit-backup.tar.gz -C /var/www/
```

---

## Support

For deployment assistance:
- **Email**: devops@freightaudit.com
- **Documentation**: [docs/](../docs/)
- **Emergency**: +1-XXX-XXX-XXXX

---

**Deployment Checklist**:
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] SSL certificates installed
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit performed
