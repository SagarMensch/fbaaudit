"""
Config Router - SAP-style system configuration API
Config over Code: All settings come from database, not hardcoded
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional
import os
import asyncpg
from pydantic import BaseModel

router = APIRouter(prefix="/api/config", tags=["config"])


class ConfigResponse(BaseModel):
    data: Dict[str, str]
    meta: dict


class ConfigItemResponse(BaseModel):
    key: str
    value: str
    description: Optional[str]
    category: Optional[str]


# Database connection
async def get_db():
    """Get database connection"""
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database not configured")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()


@router.get("")
async def get_all_config(
    category: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Get all system configuration values
    
    Returns flat key-value dict for easy frontend consumption
    """
    if category:
        rows = await db.fetch(
            "SELECT key, value, description, category FROM system_config WHERE category = $1",
            category
        )
    else:
        rows = await db.fetch(
            "SELECT key, value, description, category FROM system_config ORDER BY category, key"
        )
    
    # Return as flat dict for easy consumption
    config_dict = {row['key']: row['value'] for row in rows}
    
    return {
        "data": config_dict,
        "meta": {
            "total": len(rows),
            "categories": list(set(row['category'] or 'general' for row in rows))
        }
    }


@router.get("/detailed")
async def get_detailed_config(db = Depends(get_db)):
    """Get all config with descriptions and categories"""
    
    rows = await db.fetch(
        "SELECT key, value, description, category, updated_at FROM system_config ORDER BY category, key"
    )
    
    return {
        "data": [dict(row) for row in rows],
        "meta": {
            "total": len(rows)
        }
    }


@router.get("/{key}")
async def get_config_value(key: str, db = Depends(get_db)):
    """Get single configuration value"""
    
    row = await db.fetchrow(
        "SELECT key, value, description, category FROM system_config WHERE key = $1",
        key
    )
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Config key '{key}' not found")
    
    return dict(row)


@router.get("/finance/currency")
async def get_currency_config(db = Depends(get_db)):
    """
    Get currency configuration
    
    This endpoint provides all currency-related settings for frontend
    """
    keys = ['default_currency', 'currency_code']
    
    rows = await db.fetch(
        "SELECT key, value FROM system_config WHERE key = ANY($1::text[])",
        keys
    )
    
    config = {row['key']: row['value'] for row in rows}
    
    # Provide defaults if not found
    return {
        "currency_symbol": config.get('default_currency', 'USD'),
        "currency_code": config.get('currency_code', 'USD'),
        "locale": "en-US"
    }


@router.get("/audit/thresholds")
async def get_audit_thresholds(db = Depends(get_db)):
    """
    Get audit threshold configuration
    
    Used by audit engine to determine auto-approve vs manual review
    """
    keys = ['variance_tolerance_pct', 'high_value_threshold', 'auto_approve_enabled', 'ai_approval_enabled']
    
    rows = await db.fetch(
        "SELECT key, value FROM system_config WHERE key = ANY($1::text[])",
        keys
    )
    
    config = {row['key']: row['value'] for row in rows}
    
    return {
        "variance_tolerance_pct": float(config.get('variance_tolerance_pct', '3.0')),
        "high_value_threshold": float(config.get('high_value_threshold', '10000')),
        "auto_approve_enabled": config.get('auto_approve_enabled', 'true') == 'true',
        "ai_approval_enabled": config.get('ai_approval_enabled', 'true') == 'true'
    }


@router.get("/sla/timers")
async def get_sla_config(db = Depends(get_db)):
    """Get SLA timer configuration"""
    
    keys = ['sla_dispute_hours', 'sla_pod_days']
    
    rows = await db.fetch(
        "SELECT key, value FROM system_config WHERE key = ANY($1::text[])",
        keys
    )
    
    config = {row['key']: row['value'] for row in rows}
    
    return {
        "dispute_resolution_hours": int(config.get('sla_dispute_hours', '48')),
        "pod_submission_days": int(config.get('sla_pod_days', '7'))
    }
