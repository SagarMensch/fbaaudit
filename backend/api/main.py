"""
FastAPI Main Application
Hitachi Energy Freight Audit Platform
PostgreSQL + FastAPI - NO HARDCODING
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.database import engine, Base
from api.routers import rates, invoices, audit, payments, reports, users, kpi

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hitachi Energy Freight Audit Platform",
    description="Enterprise Freight Management & Audit System - Powered by 3SC & SequelString AI",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(rates.router, prefix="/api/rates", tags=["Rate Files"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(audit.router, prefix="/api/audit", tags=["Freight Audit"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(kpi.router, prefix="/api/kpi", tags=["KPI Dashboard"])

@app.get("/")
async def root():
    return {
        "message": "Hitachi Energy Freight Audit Platform API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "database": "PostgreSQL"
    }
