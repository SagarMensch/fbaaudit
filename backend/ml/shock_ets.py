"""
s-ETS (Shock Exponential Smoothing) Algorithm - MySQL Integrated
Separates Normal Rate Level from Disruption Premium (Strike/Festival)
All data is stored and retrieved from MySQL
"""
from typing import Dict, Tuple, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import mysql.connector
import logging

from db_config import DB_CONFIG

logger = logging.getLogger(__name__)


def get_db():
    return mysql.connector.connect(**DB_CONFIG)


@dataclass
class ShockBenchmark:
    """Result of s-ETS calculation"""
    lane: str
    base_level: float
    shock_component: float
    total_benchmark: float
    is_disruption: bool
    confidence: float


@dataclass
class RateValidation:
    """Result of rate validation against benchmark"""
    submitted_rate: float
    benchmark: float
    base_level: float
    shock_premium: float
    variance_pct: float
    verdict: str
    is_disruption: bool
    explanation: str


class ShockETSModel:
    """
    s-ETS Model Implementation - MySQL Backed
    
    All lane states are stored in MySQL rate_benchmarks table.
    """
    
    def __init__(
        self,
        alpha: float = 0.2,
        delta: float = 0.8,
        tolerance_pct: float = 5.0
    ):
        self.alpha = alpha
        self.delta = delta
        self.tolerance_pct = tolerance_pct
        self.default_level = 40000.0
    
    def get_state(self, lane: str) -> Dict:
        """Get current state for a lane from MySQL"""
        try:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT lane, current_level, current_shock, last_rate, is_disruption
                FROM rate_benchmarks WHERE lane = %s
            """, (lane,))
            
            row = cursor.fetchone()
            cursor.close()
            db.close()
            
            if row:
                return {
                    "level": float(row['current_level']),
                    "shock": float(row['current_shock'] or 0),
                    "is_disruption": bool(row['is_disruption']),
                    "last_rate": float(row['last_rate'] or row['current_level'])
                }
            else:
                # Initialize new lane with defaults
                self.initialize_lane(lane, self.default_level)
                return {
                    "level": self.default_level,
                    "shock": 0.0,
                    "is_disruption": False,
                    "last_rate": self.default_level
                }
                
        except Exception as e:
            logger.error(f"Error getting state for {lane}: {e}")
            return {
                "level": self.default_level,
                "shock": 0.0,
                "is_disruption": False,
                "last_rate": self.default_level
            }
    
    def update_state(self, lane: str, level: float, shock: float, is_disruption: bool, last_rate: float) -> None:
        """Update lane state in MySQL"""
        try:
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute("""
                UPDATE rate_benchmarks 
                SET current_level = %s, current_shock = %s, is_disruption = %s, last_rate = %s
                WHERE lane = %s
            """, (level, shock, is_disruption, last_rate, lane))
            
            if cursor.rowcount == 0:
                # Insert if not exists
                cursor.execute("""
                    INSERT INTO rate_benchmarks (lane, current_level, current_shock, is_disruption, last_rate)
                    VALUES (%s, %s, %s, %s, %s)
                """, (lane, level, shock, is_disruption, last_rate))
            
            db.commit()
            cursor.close()
            db.close()
            
        except Exception as e:
            logger.error(f"Error updating state for {lane}: {e}")
    
    def set_disruption(self, lane: str, is_disruption: bool, event_type: str = None) -> Dict:
        """Activate or deactivate disruption mode for a lane"""
        state = self.get_state(lane)
        
        was_disruption = state["is_disruption"]
        
        # If disruption just ended, reset shock to 0
        new_shock = state["shock"]
        if was_disruption and not is_disruption:
            logger.info(f"Disruption ended for {lane}. Resetting shock component.")
            new_shock = 0.0
        
        # Update in MySQL
        self.update_state(lane, state["level"], new_shock, is_disruption, state["last_rate"])
        
        return {
            "lane": lane,
            "is_disruption": is_disruption,
            "event_type": event_type,
            "shock_reset": was_disruption and not is_disruption
        }
    
    def calculate_benchmark(
        self,
        lane: str,
        current_rate: Optional[float] = None
    ) -> ShockBenchmark:
        """
        Calculate the current benchmark for a lane.
        Optionally update state if a new rate is provided.
        """
        state = self.get_state(lane)
        
        prev_level = state["level"]
        prev_shock = state["shock"]
        is_disruption = state["is_disruption"]
        
        if current_rate is not None:
            # === s-ETS Algorithm (Equation 8) ===
            
            # 1. Calculate prediction
            predicted_rate = prev_level + (prev_shock if is_disruption else 0)
            
            # 2. Calculate forecast error
            error = current_rate - predicted_rate
            
            # 3. Update Level (Slow adaptation - alpha)
            new_level = prev_level + (self.alpha * error)
            
            # 4. Update Shock (Fast adaptation - delta, only during disruption)
            if is_disruption:
                new_shock = prev_shock + (self.delta * error)
            else:
                new_shock = prev_shock * 0.5
            
            # Ensure non-negative values
            new_level = max(1000, new_level)
            new_shock = max(0, new_shock)
            
            # Update in MySQL
            self.update_state(lane, new_level, new_shock, is_disruption, current_rate)
            
            # Update local state for return
            state["level"] = new_level
            state["shock"] = new_shock
        
        # Calculate total benchmark
        total = state["level"] + (state["shock"] if state["is_disruption"] else 0)
        
        return ShockBenchmark(
            lane=lane,
            base_level=round(state["level"], 2),
            shock_component=round(state["shock"], 2),
            total_benchmark=round(total, 2),
            is_disruption=state["is_disruption"],
            confidence=85.0
        )
    
    def validate_rate(
        self,
        lane: str,
        submitted_rate: float,
        update_state: bool = True
    ) -> RateValidation:
        """
        Validate a submitted rate against the s-ETS benchmark.
        """
        if update_state:
            benchmark = self.calculate_benchmark(lane, submitted_rate)
        else:
            benchmark = self.calculate_benchmark(lane)
        
        variance_pct = ((submitted_rate - benchmark.total_benchmark) / 
                        benchmark.total_benchmark * 100) if benchmark.total_benchmark > 0 else 0
        
        if abs(variance_pct) <= self.tolerance_pct:
            verdict = "APPROVED"
            explanation = (
                f"Rate within {self.tolerance_pct}% tolerance. "
                f"Base: ₹{benchmark.base_level:,.0f}"
            )
            if benchmark.is_disruption:
                explanation += f" + Shock Premium: ₹{benchmark.shock_component:,.0f}"
        elif variance_pct > self.tolerance_pct:
            verdict = "FLAGGED_HIGH"
            explanation = (
                f"Rate is {abs(variance_pct):.1f}% ABOVE benchmark. "
                f"Expected: ₹{benchmark.total_benchmark:,.0f}, Got: ₹{submitted_rate:,.0f}"
            )
        else:
            verdict = "FLAGGED_LOW"
            explanation = (
                f"Rate is {abs(variance_pct):.1f}% BELOW benchmark. "
                f"Suspiciously low - verify quality/compliance."
            )
        
        # Log validation to MySQL
        try:
            db = get_db()
            cursor = db.cursor()
            cursor.execute("""
                INSERT INTO rate_validations 
                (lane, submitted_rate, benchmark, base_level, shock_premium, variance_pct, verdict, is_disruption)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                lane, submitted_rate, benchmark.total_benchmark,
                benchmark.base_level, benchmark.shock_component if benchmark.is_disruption else 0,
                variance_pct, verdict, benchmark.is_disruption
            ))
            db.commit()
            cursor.close()
            db.close()
        except Exception as e:
            logger.warning(f"Could not log validation: {e}")
        
        return RateValidation(
            submitted_rate=submitted_rate,
            benchmark=benchmark.total_benchmark,
            base_level=benchmark.base_level,
            shock_premium=benchmark.shock_component if benchmark.is_disruption else 0,
            variance_pct=round(variance_pct, 2),
            verdict=verdict,
            is_disruption=benchmark.is_disruption,
            explanation=explanation
        )
    
    def get_all_benchmarks(self) -> List[Dict]:
        """Get all lane benchmarks from MySQL"""
        try:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT lane, current_level, current_shock, is_disruption, last_rate
                FROM rate_benchmarks ORDER BY lane
            """)
            
            rows = cursor.fetchall()
            cursor.close()
            db.close()
            
            return rows
            
        except Exception as e:
            logger.error(f"Error getting all benchmarks: {e}")
            return []
    
    def initialize_lane(
        self,
        lane: str,
        initial_level: float,
        initial_shock: float = 0.0
    ) -> Dict:
        """Initialize a lane with known values in MySQL"""
        try:
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute("""
                INSERT INTO rate_benchmarks (lane, current_level, current_shock, last_rate, is_disruption)
                VALUES (%s, %s, %s, %s, FALSE)
                ON DUPLICATE KEY UPDATE current_level = VALUES(current_level)
            """, (lane, initial_level, initial_shock, initial_level))
            
            db.commit()
            cursor.close()
            db.close()
            
            return {"lane": lane, "level": initial_level, "shock": initial_shock}
            
        except Exception as e:
            logger.error(f"Error initializing lane {lane}: {e}")
            return {"lane": lane, "level": initial_level, "shock": initial_shock}


# Singleton instance
shock_model = ShockETSModel()
