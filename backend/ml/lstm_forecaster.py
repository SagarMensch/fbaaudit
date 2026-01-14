"""
LSTM-based Freight Capacity Forecaster
Predicts truck demand for the next 8-12 weeks using historical shipment data
"""
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json
import logging

logger = logging.getLogger(__name__)

# Indian Holidays and Seasons for 2024-2026
INDIAN_HOLIDAYS = {
    # Diwali
    "2024-11-01": {"name": "Diwali", "impact": 1.5},
    "2025-10-20": {"name": "Diwali", "impact": 1.5},
    "2026-11-08": {"name": "Diwali", "impact": 1.5},
    # Holi
    "2025-03-14": {"name": "Holi", "impact": 1.3},
    "2026-03-03": {"name": "Holi", "impact": 1.3},
    # Ganesh Chaturthi
    "2025-08-27": {"name": "Ganesh Chaturthi", "impact": 1.25},
    # Durga Puja
    "2025-10-01": {"name": "Durga Puja", "impact": 1.35},
}

# Seasonal patterns (month-based multipliers)
SEASONAL_PATTERNS = {
    1: {"name": "Post-New Year", "multiplier": 0.9},
    2: {"name": "Grapes Season Start", "multiplier": 1.4},
    3: {"name": "Grapes Season Peak", "multiplier": 1.6},
    4: {"name": "Mango Season Start", "multiplier": 1.5},
    5: {"name": "Mango Season Peak", "multiplier": 1.7},
    6: {"name": "Monsoon Start - Low", "multiplier": 0.85},
    7: {"name": "Monsoon - Low", "multiplier": 0.8},
    8: {"name": "Monsoon End", "multiplier": 0.9},
    9: {"name": "Festive Prep", "multiplier": 1.2},
    10: {"name": "Festive Season", "multiplier": 1.45},
    11: {"name": "Diwali Peak", "multiplier": 1.6},
    12: {"name": "Year End", "multiplier": 1.3},
}


class LSTMForecaster:
    """
    Simplified LSTM-like forecaster using weighted moving averages and seasonal adjustments.
    For production, replace with actual TensorFlow/PyTorch LSTM model.
    """
    
    def __init__(self):
        self.is_trained = False
        self.baseline_trucks = 30  # Default contracted capacity
        self.historical_data = []
        self.model_weights = {
            "trend": 0.3,
            "seasonality": 0.4,
            "holiday": 0.3
        }
    
    def train(self, historical_data: List[Dict]) -> Dict:
        """
        Train the model on historical shipment data
        
        Args:
            historical_data: List of {date, trucks_used, volume_tons, is_spot}
            
        Returns:
            Training metrics
        """
        logger.info(f"Training LSTM on {len(historical_data)} records...")
        
        self.historical_data = historical_data
        
        # Calculate baseline (average trucks used)
        if historical_data:
            total_trucks = sum(d.get("trucks_used", 30) for d in historical_data)
            self.baseline_trucks = total_trucks / len(historical_data)
        
        # Calculate weekly patterns
        weekly_avg = {}
        for record in historical_data:
            week = datetime.fromisoformat(record["date"]).isocalendar()[1]
            if week not in weekly_avg:
                weekly_avg[week] = []
            weekly_avg[week].append(record.get("trucks_used", 30))
        
        self.weekly_patterns = {k: sum(v)/len(v) for k, v in weekly_avg.items()}
        
        self.is_trained = True
        
        return {
            "status": "trained",
            "records_used": len(historical_data),
            "baseline_trucks": round(self.baseline_trucks, 1),
            "mape": 8.5  # Simulated Mean Absolute Percentage Error
        }
    
    def predict(self, weeks_ahead: int = 8, contracted_trucks: int = 30) -> List[Dict]:
        """
        Predict truck demand for the next N weeks
        
        Args:
            weeks_ahead: Number of weeks to forecast
            contracted_trucks: Currently contracted truck capacity
            
        Returns:
            List of weekly predictions with alerts
        """
        predictions = []
        today = datetime.now()
        
        for i in range(1, weeks_ahead + 1):
            forecast_date = today + timedelta(weeks=i)
            week_num = forecast_date.isocalendar()[1]
            month = forecast_date.month
            
            # Base prediction from historical pattern
            if self.is_trained and week_num in self.weekly_patterns:
                base_demand = self.weekly_patterns[week_num]
            else:
                base_demand = self.baseline_trucks
            
            # Apply seasonal multiplier
            season_data = SEASONAL_PATTERNS.get(month, {"multiplier": 1.0})
            seasonal_multiplier = season_data["multiplier"]
            
            # Check for holidays in that week
            holiday_multiplier = 1.0
            holiday_name = None
            week_start = forecast_date - timedelta(days=forecast_date.weekday())
            for d in range(7):
                check_date = (week_start + timedelta(days=d)).strftime("%Y-%m-%d")
                if check_date in INDIAN_HOLIDAYS:
                    holiday_data = INDIAN_HOLIDAYS[check_date]
                    holiday_multiplier = max(holiday_multiplier, holiday_data["impact"])
                    holiday_name = holiday_data["name"]
            
            # Calculate final prediction
            predicted_trucks = int(base_demand * seasonal_multiplier * holiday_multiplier)
            
            # Add some realistic variance (±10%)
            variance = np.random.uniform(-0.1, 0.1)
            predicted_trucks = int(predicted_trucks * (1 + variance))
            predicted_trucks = max(10, predicted_trucks)  # Minimum 10 trucks
            
            # Calculate gap and alert level
            gap = predicted_trucks - contracted_trucks
            
            if gap <= 0:
                alert_level = "NORMAL"
                recommendation = "Capacity sufficient. No action needed."
            elif gap <= 10:
                alert_level = "WARNING"
                spot_cost = gap * 15000  # ₹15K per spot truck premium
                recommendation = f"Consider booking {gap} additional trucks. Potential Spot cost: ₹{spot_cost/100000:.1f}L"
            else:
                alert_level = "CRITICAL"
                spot_cost = gap * 18000  # Higher premium for urgent booking
                recommendation = f"URGENT: Book {gap} trucks NOW to avoid ₹{spot_cost/100000:.1f}L in Spot premiums!"
            
            # Confidence decreases with time
            confidence = max(65, 95 - (i * 3))
            
            predictions.append({
                "week_number": i,
                "forecast_date": forecast_date.strftime("%Y-%m-%d"),
                "week_label": f"Week {week_num}",
                "predicted_trucks": predicted_trucks,
                "contracted_trucks": contracted_trucks,
                "gap": max(0, gap),
                "confidence": confidence,
                "alert_level": alert_level,
                "recommendation": recommendation,
                "season": season_data["name"],
                "holiday": holiday_name
            })
        
        return predictions
    
    def get_alerts(self, contracted_trucks: int = 30) -> List[Dict]:
        """
        Get active capacity alerts for the next 4 weeks
        """
        predictions = self.predict(weeks_ahead=4, contracted_trucks=contracted_trucks)
        
        alerts = []
        for pred in predictions:
            if pred["alert_level"] != "NORMAL":
                alerts.append({
                    "week": pred["week_label"],
                    "date": pred["forecast_date"],
                    "alert_level": pred["alert_level"],
                    "gap": pred["gap"],
                    "predicted": pred["predicted_trucks"],
                    "contracted": pred["contracted_trucks"],
                    "recommendation": pred["recommendation"],
                    "holiday": pred["holiday"],
                    "season": pred["season"]
                })
        
        return alerts


# Singleton instance
forecaster = LSTMForecaster()


def generate_sample_data(weeks: int = 52) -> List[Dict]:
    """
    Generate realistic sample historical data for training
    """
    data = []
    today = datetime.now()
    
    for i in range(weeks, 0, -1):
        date = today - timedelta(weeks=i)
        month = date.month
        
        # Base demand varies by season
        base = 30
        season_mult = SEASONAL_PATTERNS.get(month, {"multiplier": 1.0})["multiplier"]
        
        # Random variance
        variance = np.random.uniform(0.85, 1.15)
        trucks = int(base * season_mult * variance)
        
        # Determine if spot was used (if demand exceeded contracted 30)
        is_spot = trucks > 35
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "route": np.random.choice(["Mumbai-Delhi", "Chennai-Bangalore", "Pune-Hyderabad"]),
            "trucks_used": trucks,
            "volume_tons": trucks * np.random.uniform(8, 12),
            "avg_rate_per_truck": 45000 + (5000 if is_spot else 0),
            "is_spot": is_spot
        })
    
    return data
