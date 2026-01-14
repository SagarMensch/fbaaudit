"""
s-ETS Shock-Proof Rate Benchmark API Routes
Endpoints for rate validation, disruption management, and benchmark queries
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import mysql.connector
import logging

from db_config import DB_CONFIG
from ml.shock_ets import shock_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/shock", tags=["Shock Rate Benchmark"])


# Pydantic Models
class ValidateRateRequest(BaseModel):
    lane: str
    rate: float
    update_model: bool = True


class DisruptionRequest(BaseModel):
    lane: str
    is_disruption: bool
    event_type: Optional[str] = "STRIKE"  # STRIKE, FESTIVAL, WEATHER, OTHER
    region: Optional[str] = None


class InitializeLaneRequest(BaseModel):
    lane: str
    initial_rate: float


class BenchmarkResponse(BaseModel):
    lane: str
    base_level: float
    shock_component: float
    total_benchmark: float
    is_disruption: bool
    confidence: float


class ValidationResponse(BaseModel):
    submitted_rate: float
    benchmark: float
    base_level: float
    shock_premium: float
    variance_pct: float
    verdict: str
    is_disruption: bool
    explanation: str


# MySQL Connection
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def init_shock_tables():
    """Create tables if they don't exist"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_benchmarks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lane VARCHAR(100) NOT NULL UNIQUE,
                current_level DECIMAL(12,2),
                current_shock DECIMAL(12,2),
                last_rate DECIMAL(12,2),
                is_disruption BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disruption_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type ENUM('STRIKE','FESTIVAL','WEATHER','OTHER') DEFAULT 'STRIKE',
                region VARCHAR(100),
                affected_lanes TEXT,
                start_date DATETIME,
                end_date DATETIME,
                impact_factor DECIMAL(3,2) DEFAULT 1.5,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_validations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lane VARCHAR(100),
                submitted_rate DECIMAL(12,2),
                benchmark DECIMAL(12,2),
                variance_pct DECIMAL(5,2),
                verdict ENUM('APPROVED','FLAGGED_HIGH','FLAGGED_LOW'),
                is_disruption BOOLEAN,
                validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        db.commit()
        cursor.close()
        db.close()
        logger.info("Shock benchmark tables initialized")
    except Exception as e:
        logger.warning(f"Could not init shock tables: {e}")


# Initialize tables
init_shock_tables()


@router.post("/validate-rate", response_model=ValidationResponse)
async def validate_rate(request: ValidateRateRequest):
    """
    Validate a submitted rate against the s-ETS benchmark.
    
    Returns APPROVED if within tolerance, FLAGGED_HIGH if over, FLAGGED_LOW if under.
    Automatically accounts for disruption premium when active.
    """
    try:
        result = shock_model.validate_rate(
            lane=request.lane,
            submitted_rate=request.rate,
            update_state=request.update_model
        )
        
        # Log validation to MySQL
        try:
            db = get_db()
            cursor = db.cursor()
            cursor.execute("""
                INSERT INTO rate_validations (lane, submitted_rate, benchmark, variance_pct, verdict, is_disruption)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                request.lane,
                request.rate,
                result.benchmark,
                result.variance_pct,
                result.verdict,
                result.is_disruption
            ))
            db.commit()
            cursor.close()
            db.close()
        except Exception as e:
            logger.warning(f"Could not log validation: {e}")
        
        return ValidationResponse(
            submitted_rate=result.submitted_rate,
            benchmark=result.benchmark,
            base_level=result.base_level,
            shock_premium=result.shock_premium,
            variance_pct=result.variance_pct,
            verdict=result.verdict,
            is_disruption=result.is_disruption,
            explanation=result.explanation
        )
        
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/benchmark/{lane}", response_model=BenchmarkResponse)
async def get_benchmark(lane: str):
    """
    Get current benchmark for a lane.
    
    Returns base level, shock component, and total benchmark.
    """
    try:
        benchmark = shock_model.calculate_benchmark(lane)
        
        return BenchmarkResponse(
            lane=benchmark.lane,
            base_level=benchmark.base_level,
            shock_component=benchmark.shock_component,
            total_benchmark=benchmark.total_benchmark,
            is_disruption=benchmark.is_disruption,
            confidence=benchmark.confidence
        )
        
    except Exception as e:
        logger.error(f"Benchmark error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/benchmarks", response_model=List[BenchmarkResponse])
async def get_all_benchmarks():
    """Get benchmarks for all tracked lanes from MySQL"""
    try:
        rows = shock_model.get_all_benchmarks()
        benchmarks = []
        
        for row in rows:
            level = float(row['current_level'] or 0)
            shock = float(row['current_shock'] or 0)
            is_dis = bool(row['is_disruption'])
            total = level + (shock if is_dis else 0)
            
            benchmarks.append(BenchmarkResponse(
                lane=row['lane'],
                base_level=level,
                shock_component=shock,
                total_benchmark=total,
                is_disruption=is_dis,
                confidence=85.0
            ))
        
        return benchmarks
        
    except Exception as e:
        logger.error(f"Benchmarks error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/disruption")
async def toggle_disruption(request: DisruptionRequest):
    """
    Toggle disruption state for a lane.
    
    When disruption is activated, the shock component starts absorbing the premium.
    When deactivated, the shock resets to 0 and benchmark snaps back to base level.
    """
    try:
        result = shock_model.set_disruption(
            lane=request.lane,
            is_disruption=request.is_disruption,
            event_type=request.event_type
        )
        
        # Log to MySQL
        try:
            db = get_db()
            cursor = db.cursor()
            
            if request.is_disruption:
                cursor.execute("""
                    INSERT INTO disruption_events (event_type, region, affected_lanes, start_date, is_active)
                    VALUES (%s, %s, %s, NOW(), TRUE)
                """, (request.event_type, request.region, request.lane))
            else:
                cursor.execute("""
                    UPDATE disruption_events 
                    SET end_date = NOW(), is_active = FALSE 
                    WHERE affected_lanes = %s AND is_active = TRUE
                """, (request.lane,))
            
            db.commit()
            cursor.close()
            db.close()
        except Exception as e:
            logger.warning(f"Could not log disruption: {e}")
        
        # Get updated benchmark
        benchmark = shock_model.calculate_benchmark(request.lane)
        
        return {
            **result,
            "new_benchmark": benchmark.total_benchmark,
            "base_level": benchmark.base_level,
            "shock_reset_to": benchmark.shock_component
        }
        
    except Exception as e:
        logger.error(f"Disruption toggle error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/initialize-lane")
async def initialize_lane(request: InitializeLaneRequest):
    """Initialize a new lane with a base rate"""
    try:
        result = shock_model.initialize_lane(
            lane=request.lane,
            initial_level=request.initial_rate
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Initialize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{lane}")
async def get_history(lane: str, limit: int = 50):
    """Get rate validation history for a lane from MySQL"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT submitted_rate, benchmark, base_level, shock_premium, 
                   variance_pct, verdict, is_disruption, validated_at
            FROM rate_validations 
            WHERE lane = %s 
            ORDER BY validated_at DESC 
            LIMIT %s
        """, (lane, limit))
        
        rows = cursor.fetchall()
        cursor.close()
        db.close()
        
        # Convert datetime to string
        for row in rows:
            if row.get('validated_at'):
                row['validated_at'] = str(row['validated_at'])
            for key in ['submitted_rate', 'benchmark', 'base_level', 'shock_premium', 'variance_pct']:
                if row.get(key):
                    row[key] = float(row[key])
        
        return {"lane": lane, "history": rows}
        
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active-disruptions")
async def get_active_disruptions():
    """Get all currently active disruptions"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM disruption_events 
            WHERE is_active = TRUE 
            ORDER BY start_date DESC
        """)
        
        events = cursor.fetchall()
        cursor.close()
        db.close()
        
        # Convert datetime to string
        for event in events:
            if event.get('start_date'):
                event['start_date'] = str(event['start_date'])
            if event.get('end_date'):
                event['end_date'] = str(event['end_date'])
            if event.get('created_at'):
                event['created_at'] = str(event['created_at'])
        
        return {"active_disruptions": events}
        
    except Exception as e:
        logger.warning(f"Could not fetch disruptions: {e}")
        return {"active_disruptions": []}
