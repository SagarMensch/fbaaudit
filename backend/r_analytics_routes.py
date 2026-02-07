"""
Flask Routes for R Analytics
Exposes R statistical methods via REST API
"""

from flask import Blueprint, request, jsonify
from r_analytics_service import r_service
import traceback

r_analytics_bp = Blueprint('r_analytics', __name__, url_prefix='/api/r')

# ========================================================================
# BENCHMARK ANALYSIS
# ========================================================================

@r_analytics_bp.route('/benchmark', methods=['POST'])
def benchmark_rates():
    """
    Advanced rate benchmarking using BSTS + GARCH
    
    Request JSON:
    {
        "contract_rates": [3200, 3250, 3300, ...],
        "market_rates": [3100, 3150, 3200, ...],
        "horizon": 6  # optional, default 6
    }
    """
    try:
        data = request.json
        
        contract_rates = data.get('contract_rates', [])
        market_rates = data.get('market_rates', [])
        horizon = data.get('horizon', 6)
        
        contract_id = data.get('contract_id')
        
        # METHOD 1: Database Lookup (Preferred)
        if contract_id:
            result = r_service.benchmark_contract(contract_id)
        
        # METHOD 2: Direct Data Passthrough (Legacy/Testing)
        elif contract_rates and market_rates:
            result = r_service.benchmark_rates(contract_rates, market_rates)
            
        else:
            return jsonify({'error': 'Either contract_id OR (contract_rates and market_rates) is required'}), 400
        
        return jsonify({
            'success': True,
            'data': result,
            'r_available': r_service.r_available
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================================================
# CAPACITY FORECASTING
# ========================================================================

@r_analytics_bp.route('/forecast', methods=['POST'])
def forecast_capacity():
    """
    Capacity forecasting using Prophet + Ensemble
    
    Request JSON:
    {
        "data": [
            {"date": "2024-01-01", "volume": 1200},
            {"date": "2024-02-01", "volume": 1350},
            ...
        ],
        "horizon": 12  # optional, default 12
    }
    """
    try:
        req_data = request.json
        
        historical_data = req_data.get('data', [])
        horizon = req_data.get('horizon', 12)
        
        use_db = req_data.get('use_db', False)
        
        if use_db:
             result = r_service.forecast_capacity_from_db(horizon)
        elif historical_data:
             result = r_service.forecast_capacity(historical_data, horizon)
        else:
             # Default to DB if no data provided
             result = r_service.forecast_capacity_from_db(horizon)
        
        return jsonify({
            'success': True,
            'data': result,
            'r_available': r_service.r_available
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================================================
# ANOMALY DETECTION
# ========================================================================

@r_analytics_bp.route('/anomaly', methods=['POST'])
def detect_anomalies():
    """
    Detect anomalies using Isolation Forest + ensemble
    
    Request JSON:
    {
        "data": [
            {"invoice_id": "INV001", "amount": 5000, "weight": 120, ...},
            ...
        ]
    }
    """
    try:
        req_data = request.json
        
        observations = req_data.get('data', [])
        
        if not observations:
            return jsonify({'error': 'data required'}), 400
        
        result = r_service.detect_anomalies(observations)
        
        return jsonify({
            'success': True,
            'data': result,
            'r_available': r_service.r_available
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================================================
# CARRIER SCORING
# ========================================================================

@r_analytics_bp.route('/score', methods=['POST'])
def score_carriers():
    """
    Score carriers using SEM + Factor Analysis
    
    Request JSON:
    {
        "data": [
            {"id": "CARR001", "otd_rate": 95, "cost_index": 85, ...},
            ...
        ]
    }
    """
    try:
        req_data = request.json
        
        carrier_data = req_data.get('data', [])
        
        if not carrier_data:
            return jsonify({'error': 'carrier data required'}), 400
        
        result = r_service.score_carriers(carrier_data)
        
        return jsonify({
            'success': True,
            'data': result,
            'r_available': r_service.r_available
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================================================
# COST ANALYSIS
# ========================================================================

@r_analytics_bp.route('/cost', methods=['POST'])
def analyze_costs():
    """
    Analyze cost-to-serve using GAM + Quantile Regression
    
    Request JSON:
    {
        "data": [
            {"shipment_id": "SHP001", "cost": 5000, "distance": 500, "weight": 1000, ...},
            ...
        ]
    }
    """
    try:
        req_data = request.json
        
        cost_data = req_data.get('data', [])
        
        if not cost_data:
            return jsonify({'error': 'cost data required'}), 400
        
        result = r_service.analyze_costs(cost_data)
        
        return jsonify({
            'success': True,
            'data': result,
            'r_available': r_service.r_available
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ========================================================================
# HEALTH CHECK
# ========================================================================

@r_analytics_bp.route('/health', methods=['GET'])
def health_check():
    """Check if R is available and which packages are installed"""
    
    required_packages = {
        'benchmarking': ['bsts', 'rugarch', 'forecast'],
        'forecasting': ['prophet', 'forecast', 'quantregForest'],
        'anomaly': ['isotree', 'tsoutliers', 'e1071'],
        'scoring': ['lavaan', 'psych'],
        'cost': ['mgcv', 'quantreg', 'lme4']
    }
    
    package_status = {}
    
    if r_service.r_available:
        for module, packages in required_packages.items():
            package_status[module] = r_service.check_r_packages(packages)
    
    return jsonify({
        'r_available': r_service.r_available,
        'package_status': package_status,
        'message': 'R analytics ready' if r_service.r_available else 'R not available - using Python fallbacks'
    })
