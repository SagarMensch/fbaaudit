"""
Cash Flow Forecaster - ARIMA-based Payment Prediction
======================================================
Predicts future cash requirements using ARIMA on historical payment cycles.

Features:
- Train ARIMA model on historical payment data
- Predict cash needed for specific dates
- Weekly/Monthly forecast with confidence intervals
- Per-vendor payment projections

Author: SequelString AI Team
"""

import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Tuple
import numpy as np
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy import for statsmodels (heavy library)
_arima = None

def get_arima():
    """Lazy load ARIMA from statsmodels"""
    global _arima
    if _arima is None:
        try:
            from statsmodels.tsa.arima.model import ARIMA
            _arima = ARIMA
            logger.info("ARIMA model loaded from statsmodels")
        except ImportError:
            logger.error("statsmodels not installed. Run: pip install statsmodels")
            raise ImportError("statsmodels not installed")
    return _arima



# ============================================================================
# DATABASE QUERY FOR VENDOR PAYMENT CYCLES
# NO HARDCODING - Query from PostgreSQL
# ============================================================================

def get_vendor_payment_cycles_from_db():
    """Get vendor payment cycle data from PostgreSQL database"""
    try:
        from services.postgres_helper import get_postgres_connection
        import psycopg2.extras
        
        conn = get_postgres_connection()
        if not conn:
            logger.warning("Database connection failed - falling back to empty cycles")
            return {}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT 
                id as vendor_id,
                name as vendor_name,
                payment_terms as payment_terms_days
            FROM vendors
            WHERE is_active = TRUE
        """)
        
        vendors = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Build cycles dict
        cycles = {}
        for v in vendors:
            # Extract payment_terms if it contains a number
            payment_terms_str = v.get('payment_terms_days', 'Net 30')
            try:
                payment_days = int(''.join(filter(str.isdigit, payment_terms_str)))
            except:
                payment_days = 30  # Default
            
            cycles[v['vendor_id']] = {
                "vendor_name": v['vendor_name'],
                "avg_invoice_submission_days": 10,  # Standard estimate
                "avg_approval_days": 5,              # Standard estimate
                "payment_terms_days": payment_days,
                "avg_invoice_amount": 125000,        # Will be calculated from invoices
            }
        
        return cycles
        
    except Exception as e:
        logger.error(f"Error fetching vendor cycles: {e}")
        return {}



# Historical daily payments (last 90 days) - for ARIMA training
def generate_historical_payments_from_db(days: int = 90) -> List[Dict]:
    """Generate historical payment data from PostgreSQL invoices table"""
    try:
        from services.postgres_helper import get_postgres_connection
        import psycopg2.extras
        
        conn = get_postgres_connection()
        if not conn:
            logger.warning("Database connection failed - no historical data")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT 
                DATE(payment_date) as date,
                SUM(total_amount) as amount,
                COUNT(*) as num_invoices
            FROM invoices
            WHERE payment_date IS NOT NULL
            AND payment_date >= CURRENT_DATE - INTERVAL '%s days'
            GROUP BY DATE(payment_date)
            ORDER BY date
        """, (days,))
        
        payments = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [
            {
                "date": p['date'].isoformat(),
                "amount": float(p['amount'] or 0),
                "num_invoices": p['num_invoices']
            }
            for p in payments
        ]
        
    except Exception as e:
        logger.error(f"Error fetching historical payments: {e}")
        # Fallback to mock data
        return generate_mock_historical_payments_fallback(days)

def generate_mock_historical_payments_fallback(days: int = 90) -> List[Dict]:
    """Fallback mock data if database unavailable"""
    np.random.seed(42)
    base_daily_amount = 500000
    payments = []
    today = date.today()
    
    for i in range(days, 0, -1):
        payment_date = today - timedelta(days=i)
        day_of_week = payment_date.weekday()
        
        if day_of_week == 4:  # Friday
            multiplier = 1.8
        elif day_of_week in [0, 1]:  # Monday, Tuesday
            multiplier = 1.2
        elif day_of_week in [5, 6]:  # Weekend
            multiplier = 0.1
        else:
            multiplier = 1.0
        
        noise = np.random.normal(1.0, 0.3)
        amount = int(base_daily_amount * multiplier * max(noise, 0.1))
        
        payments.append({
            "date": payment_date.isoformat(),
            "amount": amount,
            "num_invoices": int(amount / 80000) + 1,
        })
    
    return payments


def get_active_shipments_from_db() -> List[Dict]:
    """Get active/pending shipments from PostgreSQL database"""
    try:
        from services.postgres_helper import get_postgres_connection
        import psycopg2.extras
        
        conn = get_postgres_connection()
        if not conn:
            logger.warning("Database connection failed - no shipment data")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT 
                id as shipment_id,
                vendor_id,
                delivery_actual as completion_date,
                actual_cost as amount,
                status
            FROM shipments
            WHERE status IN ('DELIVERED', 'IN_TRANSIT', 'PENDING')
            AND delivery_actual IS NOT NULL
            ORDER BY delivery_actual
            LIMIT 50
        """)
        
        shipments = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [
            {
                "shipment_id": s['shipment_id'],
                "vendor_id": s['vendor_id'],
                "completion_date": s['completion_date'].isoformat() if s['completion_date'] else None,
                "amount": float(s['amount'] or 0),
                "status": s['status']
            }
            for s in shipments
            if s['completion_date'] is not None
        ]
        
    except Exception as e:
        logger.error(f"Error fetching active shipments: {e}")
        return []



# ============================================================================
# ARIMA-BASED CASH FLOW FORECASTER
# ============================================================================

class CashFlowForecaster:
    """
    ARIMA-based Cash Flow Prediction Engine
    
    Answers the CFO question: "How much cash do I need next Friday?"
    
    Uses:
    - Historical payment time series for ARIMA modeling
    - Active shipment pipeline for deterministic projections
    - Vendor payment cycle patterns for timing estimates
    """
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.historical_data = None
        self.order = (2, 1, 2)  # ARIMA(p, d, q) parameters
        logger.info("CashFlowForecaster initialized")
    
    def train_arima(self, historical_payments: Optional[List[Dict]] = None) -> Dict:
        """
        Train ARIMA model on historical payment data
        
        Args:
            historical_payments: List of {date, amount} dicts. Uses mock data if None.
            
        Returns:
            Training summary with model parameters and fit statistics
        """
        logger.info("Training ARIMA model...")
        
        # Use database data if not provided
        if historical_payments is None:
            historical_payments = generate_historical_payments_from_db(90)
        
        self.historical_data = historical_payments
        
        # Extract amounts as time series
        amounts = np.array([p['amount'] for p in historical_payments])
        
        # Handle edge cases
        if len(amounts) < 30:
            logger.warning("Insufficient data for ARIMA. Using simple moving average.")
            self.is_trained = False
            return {"success": False, "error": "Insufficient data (need 30+ days)"}
        
        try:
            ARIMA = get_arima()
            
            # Fit ARIMA model
            self.model = ARIMA(amounts, order=self.order)
            self.model_fit = self.model.fit()
            self.is_trained = True
            
            # Get model summary stats
            aic = self.model_fit.aic
            bic = self.model_fit.bic
            
            logger.info(f"ARIMA model trained. AIC: {aic:.2f}, BIC: {bic:.2f}")
            
            return {
                "success": True,
                "model_order": self.order,
                "aic": round(aic, 2),
                "bic": round(bic, 2),
                "training_days": len(amounts),
                "avg_daily_payment": round(float(np.mean(amounts)), 2),
            }
            
        except Exception as e:
            logger.error(f"ARIMA training failed: {e}")
            self.is_trained = False
            return {"success": False, "error": str(e)}
    
    def predict_cash_requirement(
        self, 
        target_date: date,
        include_pipeline: bool = True
    ) -> Dict:
        """
        Predict cash required for a specific date
        
        Args:
            target_date: The date to predict for
            include_pipeline: Whether to include active shipment projections
            
        Returns:
            Prediction with amount, confidence interval, and breakdown
        """
        # Ensure model is trained
        if not self.is_trained:
            self.train_arima()
        
        today = date.today()
        days_ahead = (target_date - today).days
        
        if days_ahead < 0:
            return {"error": "Cannot predict for past dates"}
        
        # ARIMA Forecast
        arima_prediction = 0
        confidence_low = 0
        confidence_high = 0
        
        if self.is_trained and days_ahead > 0:
            try:
                # Forecast for the required number of days
                forecast = self.model_fit.get_forecast(steps=max(days_ahead, 1))
                predictions = forecast.predicted_mean
                conf_int = forecast.conf_int(alpha=0.1)  # 90% confidence
                
                # Get prediction for target date
                arima_prediction = float(predictions.iloc[min(days_ahead - 1, len(predictions) - 1)])
                confidence_low = float(conf_int.iloc[min(days_ahead - 1, len(conf_int) - 1), 0])
                confidence_high = float(conf_int.iloc[min(days_ahead - 1, len(conf_int) - 1), 1])
                
            except Exception as e:
                logger.warning(f"ARIMA forecast failed: {e}. Using fallback.")
                # Fallback to historical average
                avg = np.mean([p['amount'] for p in self.historical_data])
                arima_prediction = float(avg)
                confidence_low = float(avg * 0.7)
                confidence_high = float(avg * 1.3)
        
        # Pipeline-based deterministic projections
        pipeline_amount = 0
        vendor_breakdown = []
        
        if include_pipeline:
            pipeline_amount, vendor_breakdown = self._calculate_pipeline_due(target_date)
        
        # Combine ARIMA (trend) + Pipeline (known upcoming)
        # Weight: 40% ARIMA trend, 60% Pipeline deterministic
        combined_prediction = 0.4 * arima_prediction + 0.6 * pipeline_amount if pipeline_amount > 0 else arima_prediction
        
        # Adjust confidence interval
        if pipeline_amount > 0:
            confidence_low = max(confidence_low, pipeline_amount * 0.8)
            confidence_high = pipeline_amount * 1.2
        
        return {
            "forecast_date": target_date.isoformat(),
            "predicted_cash_required": round(combined_prediction),
            "predicted_in_lakhs": round(combined_prediction / 100000, 2),
            "confidence_interval": {
                "low": round(max(confidence_low, 0)),
                "high": round(confidence_high),
            },
            "breakdown": {
                "arima_trend": round(arima_prediction),
                "pipeline_deterministic": round(pipeline_amount),
                "vendors": vendor_breakdown,
            },
            "days_ahead": days_ahead,
        }
    
    def _calculate_pipeline_due(self, target_date: date) -> Tuple[float, List[Dict]]:
        """
        Calculate payments due from active shipment pipeline
        
        For each shipment, estimate when payment will be due based on:
        1. Shipment completion date
        2. Vendor's avg invoice submission time
        3. Internal approval time
        4. Payment terms
        """
        total_amount = 0
        vendor_cycles = get_vendor_payment_cycles_from_db()
        active_shipments = get_active_shipments_from_db()
        
        for shipment in active_shipments:
            vendor_id = shipment['vendor_id']
            vendor_cycle = vendor_cycles.get(vendor_id, {})
            
            if not vendor_cycle:
                continue
            
            # Calculate expected payment date
            completion = datetime.fromisoformat(shipment['completion_date']).date()
            invoice_submission = completion + timedelta(days=vendor_cycle.get('avg_invoice_submission_days', 10))
            approval = invoice_submission + timedelta(days=vendor_cycle.get('avg_approval_days', 5))
            payment_due = approval + timedelta(days=vendor_cycle.get('payment_terms_days', 30))
            
            # Check if payment falls on or near target date (±3 days window)
            days_diff = abs((payment_due - target_date).days)
            
            if days_diff <= 3:  # Within 3-day window
                amount = shipment['amount']
                total_amount += amount
                vendor_amounts[vendor_id]["amount"] += amount
                vendor_amounts[vendor_id]["invoices"] += 1
                vendor_amounts[vendor_id]["vendor_name"] = vendor_cycle.get('vendor_name', vendor_id)
        
        # Convert to list format
        vendor_breakdown = [
            {
                "vendor_id": vid,
                "vendor_name": data["vendor_name"],
                "amount": data["amount"],
                "invoices": data["invoices"],
            }
            for vid, data in vendor_amounts.items()
            if data["amount"] > 0
        ]
        
        return total_amount, vendor_breakdown
    
    def get_weekly_forecast(self, weeks: int = 4) -> Dict:
        """
        Get cash flow forecast for the next N weeks
        
        Returns:
            Weekly forecast with totals and daily breakdown
        """
        # Ensure model is trained
        if not self.is_trained:
            self.train_arima()
        
        today = date.today()
        weekly_forecasts = []
        
        for week_num in range(weeks):
            # Get Friday of each week
            days_until_friday = (4 - today.weekday()) % 7
            if week_num == 0 and days_until_friday == 0:
                days_until_friday = 7  # Next Friday if today is Friday
            
            friday = today + timedelta(days=days_until_friday + (week_num * 7))
            
            # Get prediction for this Friday
            prediction = self.predict_cash_requirement(friday)
            
            weekly_forecasts.append({
                "week_number": week_num + 1,
                "week_ending": friday.isoformat(),
                "week_label": friday.strftime("%d %b"),  # e.g., "03 Jan"
                "predicted_amount": prediction["predicted_cash_required"],
                "predicted_in_lakhs": prediction["predicted_in_lakhs"],
                "confidence_low": prediction["confidence_interval"]["low"],
                "confidence_high": prediction["confidence_interval"]["high"],
                "vendor_count": len(prediction["breakdown"]["vendors"]),
            })
        
        # Calculate totals
        total_forecasted = sum(w["predicted_amount"] for w in weekly_forecasts)
        
        return {
            "generated_at": datetime.now().isoformat(),
            "weeks_forecasted": weeks,
            "total_forecasted_amount": round(total_forecasted),
            "total_in_lakhs": round(total_forecasted / 100000, 2),
            "weekly_breakdown": weekly_forecasts,
        }
    
    def get_vendor_projections(self, days: int = 30) -> Dict:
        """
        Get payment projections grouped by vendor for next N days
        """
        today = date.today()
        target_date = today + timedelta(days=days)
        
        vendor_cycles = get_vendor_payment_cycles_from_db()
        active_shipments = get_active_shipments_from_db()
        
        for shipment in active_shipments:
            vendor_id = shipment['vendor_id']
            vendor_cycle = vendor_cycles.get(vendor_id, {})
            
            if not vendor_cycle:
                continue
            
            # Calculate expected payment date
            completion = datetime.fromisoformat(shipment['completion_date']).date()
            payment_due = completion + timedelta(
                days=vendor_cycle.get('avg_invoice_submission_days', 10) +
                     vendor_cycle.get('avg_approval_days', 5) +
                     vendor_cycle.get('payment_terms_days', 30)
            )
            
            # Check if within forecast window
            if today <= payment_due <= target_date:
                vendor_totals[vendor_id]["amount"] += shipment['amount']
                vendor_totals[vendor_id]["invoices"] += 1
                vendor_totals[vendor_id]["vendor_name"] = vendor_cycle.get('vendor_name', vendor_id)
        
        # Sort by amount descending
        sorted_vendors = sorted(
            [{"vendor_id": k, **v} for k, v in vendor_totals.items()],
            key=lambda x: x["amount"],
            reverse=True
        )
        
        total = sum(v["amount"] for v in sorted_vendors)
        
        return {
            "forecast_period_days": days,
            "total_projected": round(total),
            "total_in_lakhs": round(total / 100000, 2),
            "vendor_breakdown": sorted_vendors,
        }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_forecaster: Optional[CashFlowForecaster] = None

def get_forecaster() -> CashFlowForecaster:
    """Get or create singleton forecaster instance"""
    global _forecaster
    if _forecaster is None:
        _forecaster = CashFlowForecaster()
        _forecaster.train_arima()  # Pre-train with mock data
    return _forecaster


# ============================================================================
# CONVENIENCE FUNCTIONS FOR API
# ============================================================================

def forecast_for_date(target_date_str: str) -> Dict:
    """Get cash forecast for a specific date (YYYY-MM-DD format)"""
    try:
        target_date = date.fromisoformat(target_date_str)
    except ValueError:
        return {"error": f"Invalid date format: {target_date_str}. Use YYYY-MM-DD"}
    
    forecaster = get_forecaster()
    return forecaster.predict_cash_requirement(target_date)


def forecast_weekly(weeks: int = 4) -> Dict:
    """Get weekly cash forecast for next N weeks"""
    forecaster = get_forecaster()
    return forecaster.get_weekly_forecast(weeks)


def forecast_vendors(days: int = 30) -> Dict:
    """Get per-vendor payment projections for next N days"""
    forecaster = get_forecaster()
    return forecaster.get_vendor_projections(days)


def get_next_friday_forecast() -> Dict:
    """Convenience: Get forecast for next Friday (common CFO query)"""
    today = date.today()
    days_until_friday = (4 - today.weekday()) % 7
    if days_until_friday == 0:
        days_until_friday = 7  # Next Friday if today is Friday
    
    next_friday = today + timedelta(days=days_until_friday)
    
    forecaster = get_forecaster()
    prediction = forecaster.predict_cash_requirement(next_friday)
    
    # Format for CFO-friendly response
    return {
        "question": "How much cash do I need next Friday for Logistics?",
        "answer": f"₹{prediction['predicted_in_lakhs']} Lakhs",
        "date": prediction["forecast_date"],
        "amount_inr": prediction["predicted_cash_required"],
        "confidence": f"₹{round(prediction['confidence_interval']['low']/100000, 1)}-{round(prediction['confidence_interval']['high']/100000, 1)} Lakhs",
        "vendors_expecting_payment": len(prediction["breakdown"]["vendors"]),
        "details": prediction,
    }
