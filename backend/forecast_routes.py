"""
Freight Capacity Forecasting API Routes
Uses LSTM model to predict truck demand and generate capacity alerts
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import mysql.connector
import logging

from db_config import DB_CONFIG
from ml.lstm_forecaster import forecaster, generate_sample_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/forecast", tags=["Capacity Forecast"])


# Pydantic Models
class TrainRequest(BaseModel):
    use_sample_data: bool = True
    weeks: int = 52


class TrainResponse(BaseModel):
    status: str
    records_used: int
    baseline_trucks: float
    mape: float


class ForecastPrediction(BaseModel):
    week_number: int
    forecast_date: str
    week_label: str
    predicted_trucks: int
    contracted_trucks: int
    gap: int
    confidence: float
    alert_level: str
    recommendation: str
    season: str
    holiday: Optional[str] = None


class ForecastAlert(BaseModel):
    week: str
    date: str
    alert_level: str
    gap: int
    predicted: int
    contracted: int
    recommendation: str
    holiday: Optional[str] = None
    season: str


# MySQL Connection
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def init_forecast_tables():
    """Create forecast tables if they don't exist"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Historical shipment data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipment_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL,
                route VARCHAR(100),
                origin VARCHAR(50),
                destination VARCHAR(50),
                trucks_used INT,
                shipment_volume_tons DECIMAL(10,2),
                avg_rate_per_truck DECIMAL(10,2),
                is_spot BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_date (date)
            )
        """)
        
        # Demand factors (holidays, seasons)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS demand_factors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL,
                factor_type ENUM('HOLIDAY','SEASON','EVENT') NOT NULL,
                factor_name VARCHAR(100),
                impact_multiplier DECIMAL(3,2) DEFAULT 1.00,
                UNIQUE KEY idx_date_factor (date, factor_name)
            )
        """)
        
        # Stored forecasts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS truck_forecasts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                forecast_date DATE,
                week_number INT,
                predicted_trucks INT,
                contracted_trucks INT,
                gap INT,
                confidence DECIMAL(5,2),
                alert_level ENUM('NORMAL','WARNING','CRITICAL'),
                recommendation TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_date (forecast_date)
            )
        """)
        
        db.commit()
        cursor.close()
        db.close()
        logger.info("Forecast tables initialized")
    except Exception as e:
        logger.warning(f"Could not init forecast tables: {e}")


# Initialize tables on import
init_forecast_tables()


@router.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    """
    Train the LSTM model on historical data
    
    If use_sample_data=True, generates realistic sample data for demo
    Otherwise, loads from MySQL shipment_history table
    """
    try:
        if request.use_sample_data:
            # Generate and use sample data
            data = generate_sample_data(weeks=request.weeks)
            
            # Also save to MySQL for future use
            db = get_db()
            cursor = db.cursor()
            
            for record in data:
                cursor.execute("""
                    INSERT INTO shipment_history (date, route, trucks_used, shipment_volume_tons, avg_rate_per_truck, is_spot)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE trucks_used = VALUES(trucks_used)
                """, (
                    record["date"],
                    record["route"],
                    record["trucks_used"],
                    record["volume_tons"],
                    record["avg_rate_per_truck"],
                    record["is_spot"]
                ))
            
            db.commit()
            cursor.close()
            db.close()
            
            logger.info(f"Saved {len(data)} sample records to MySQL")
        else:
            # Load from MySQL
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT date, route, trucks_used, shipment_volume_tons as volume_tons, 
                       avg_rate_per_truck, is_spot
                FROM shipment_history
                ORDER BY date DESC
                LIMIT %s
            """, (request.weeks * 7,))
            
            data = []
            for row in cursor.fetchall():
                data.append({
                    "date": str(row["date"]),
                    "route": row["route"],
                    "trucks_used": row["trucks_used"],
                    "volume_tons": float(row["volume_tons"]) if row["volume_tons"] else 0,
                    "avg_rate_per_truck": float(row["avg_rate_per_truck"]) if row["avg_rate_per_truck"] else 0,
                    "is_spot": bool(row["is_spot"])
                })
            
            cursor.close()
            db.close()
        
        # Train the model
        result = forecaster.train(data)
        
        return TrainResponse(**result)
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict", response_model=List[ForecastPrediction])
async def get_predictions(weeks: int = 8, contracted: int = 30):
    """
    Get truck demand predictions for the next N weeks
    
    Args:
        weeks: Number of weeks to forecast (default: 8)
        contracted: Currently contracted truck capacity (default: 30)
    
    Returns:
        List of weekly predictions with alerts and recommendations
    """
    try:
        # Auto-train if not already trained
        if not forecaster.is_trained:
            data = generate_sample_data(weeks=52)
            forecaster.train(data)
        
        predictions = forecaster.predict(weeks_ahead=weeks, contracted_trucks=contracted)
        
        # Store predictions in MySQL
        db = get_db()
        cursor = db.cursor()
        
        for pred in predictions:
            cursor.execute("""
                INSERT INTO truck_forecasts 
                (forecast_date, week_number, predicted_trucks, contracted_trucks, gap, confidence, alert_level, recommendation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                pred["forecast_date"],
                pred["week_number"],
                pred["predicted_trucks"],
                pred["contracted_trucks"],
                pred["gap"],
                pred["confidence"],
                pred["alert_level"],
                pred["recommendation"]
            ))
        
        db.commit()
        cursor.close()
        db.close()
        
        return predictions
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[ForecastAlert])
async def get_alerts(contracted: int = 30):
    """
    Get active capacity alerts for the next 4 weeks
    
    Only returns weeks where there's a WARNING or CRITICAL gap
    """
    try:
        # Auto-train if needed
        if not forecaster.is_trained:
            data = generate_sample_data(weeks=52)
            forecaster.train(data)
        
        alerts = forecaster.get_alerts(contracted_trucks=contracted)
        
        return alerts
        
    except Exception as e:
        logger.error(f"Alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(limit: int = 52):
    """
    Get historical shipment data from MySQL
    """
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT date, route, trucks_used, shipment_volume_tons, avg_rate_per_truck, is_spot
            FROM shipment_history
            ORDER BY date DESC
            LIMIT %s
        """, (limit,))
        
        data = cursor.fetchall()
        
        # Convert dates to strings
        for row in data:
            row["date"] = str(row["date"])
            row["shipment_volume_tons"] = float(row["shipment_volume_tons"]) if row["shipment_volume_tons"] else 0
            row["avg_rate_per_truck"] = float(row["avg_rate_per_truck"]) if row["avg_rate_per_truck"] else 0
        
        cursor.close()
        db.close()
        
        return data
        
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
